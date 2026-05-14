/**
 * SwimLens local bridge — Express HTTP server that wraps the full MCP pipeline
 * so the web app can use ffmpeg + sharp + reference images instead of browser canvas.
 *
 * Usage:
 *   npm run bridge
 * Then open the web app locally — it auto-detects the bridge via /health and
 * routes analysis through here instead of the browser canvas pipeline.
 *
 * POST /analyze  multipart/form-data
 *   video    File   — the uploaded video file
 *   stroke   string — default "breaststroke"
 *   swimmer  string — optional swimmer identifier
 *   notes    string — optional coach notes
 *
 * Returns JSON:
 *   { markdown, tokens, model, frames: [{ timestamp, dataUrl }] }
 */

import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { formatTaxonomyForPrompt, getTaxonomyByStroke } from '../data/swim-taxonomy.js';
import {
  deduplicateFrames,
  detectMotionPeaks,
} from '../processors/frame-dedup.js';
import {
  extractBurstAt,
  extractDenseFrames,
  extractFrameBurst,
  formatTimestamp,
  parseTimestamp,
  probeVideoDuration,
} from '../processors/frame-extractor.js';
import { optimizeFrames } from '../processors/image-optimizer.js';
import { buildReferenceBlocks } from '../utils/reference-images.js';
import { createTempDir } from '../utils/temp-files.js';

const PORT = 3001;

const STROKE_CYCLE_FPS: Record<string, number> = {
  breaststroke: 1.2,
  butterfly: 1.2,
  backstroke: 1.5,
  freestyle: 2.0,
  unknown: 1.5,
};

// ── Prompts ────────────────────────────────────────────────────────────────

function buildSystemPrompt(stroke: string, taxonomySection: string): string {
  const base =
    `You are an expert breaststroke coach. ` +
    `Analyze the provided frames and give concise, specific, actionable feedback. ` +
    `Every sentence must teach something a swimmer can act on in their next session. ` +
    `Only comment on what is physically visible — never speculate about mechanics you cannot see.`;

  const detectionGuide =
    `\n\n## Identifying camera angle from frames\n` +
    `Determine the angle FIRST using these visual cues, then apply the matching constraints:\n\n` +
    `**overhead** — Camera looks straight down. Body appears as a flat top-down silhouette. ` +
    `Lane lines run alongside. No waterline horizon.\n\n` +
    `**deck_side** — Camera at pool-deck level, viewing from the side. ` +
    `A clear waterline horizon divides above/below water. Head, shoulders, hip level visible in profile.\n\n` +
    `**underwater** — Camera is submerged. Strong blue/aqua colour cast, bubbles may be visible. ` +
    `No pool deck or sky in frame.\n\n` +
    `**Once identified, apply these constraints strictly:**\n` +
    `- overhead → no elbow/hand/catch/kick-mechanics commentary\n` +
    `- deck_side → no catch depth, underwater pull path, or below-surface kick commentary\n` +
    `- underwater → no breathing timing or above-water head position commentary`;

  const outputFormat =
    `\n\nReturn your analysis using EXACTLY this structure — no preamble, no extra sections:\n\n` +
    `### Camera Angle\n` +
    `[overhead | deck_side | underwater] — [one short phrase describing what clued you in]\n\n` +
    `### Strengths\n` +
    `- [One sentence, specific and technical. 2–4 bullets.]\n\n` +
    `### Fix These\n` +
    `- [What you see + what to change, one sentence per bullet. 2–4 bullets.]\n\n` +
    `### Drills\n` +
    `1. [Drill Name] — [what it corrects and reps/distance. One sentence.]\n` +
    `2. [2–4 drills total]\n\n` +
    `### Coaching Note\n` +
    `[One sentence. The single most important thing for this swimmer to work on next.]\n\n` +
    `Start with "### Camera Angle". No opening paragraph.`;

  return (
    base +
    detectionGuide +
    (taxonomySection
      ? `\n\n---\n\n## Breaststroke technique reference\n\n${taxonomySection}`
      : '') +
    outputFormat
  );
}

function buildUserPrompt(swimmer?: string, notes?: string): string {
  const swimmerLine = swimmer
    ? `\nFocus on: **${swimmer}** — identify by lane, cap colour, suit colour across all frames.`
    : '';
  const notesLine = notes ? `\n\nCoach notes: ${notes}` : '';
  return `Sequential frames from a breaststroke video. Analyze technique.${swimmerLine}${notesLine}`;
}

// ── Express app ────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: '/tmp/swimlens-bridge/' });

app.get('/health', (_req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

app.post('/analyze', upload.single('video'), async (req, res) => {
  const videoPath = req.file?.path;
  if (!videoPath) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }

  const stroke = (req.body.stroke as string) || 'breaststroke';
  const swimmer = (req.body.swimmer as string) || undefined;
  const notes = (req.body.notes as string) || undefined;
  const cameraAngle = (req.body.cameraAngle as string) || undefined;
  const laneNum = req.body.lane ? parseInt(req.body.lane as string, 10) : undefined;
  const totalLanes = req.body.totalLanes ? parseInt(req.body.totalLanes as string, 10) : undefined;
  // Lane crop is only valid for overhead shots — side/underwater lanes aren't horizontal strips
  const laneSpec =
    cameraAngle === 'overhead' && laneNum && totalLanes
      ? { number: laneNum, total: totalLanes }
      : undefined;
  const frameCount = 12;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in .env' });
    return;
  }

  const tempDir = await createTempDir();

  try {
    // ── Phase 1: 1fps motion scan ──────────────────────────────────────
    console.log('[bridge] scanning video at 1fps...');
    const totalDuration = await probeVideoDuration(videoPath);

    const scanFrames = await extractDenseFrames(videoPath, tempDir, {
      fps: 1,
      maxFrames: 120,
    });

    // ── Detect motion peaks ───────────────────────────────────────────
    const topN = Math.max(2, Math.floor(frameCount / 3));
    const peakIndices = await detectMotionPeaks(scanFrames, { topN, minMagnitude: 6, lane: laneSpec });
    console.log(`[bridge] found ${peakIndices.length} peaks`);

    // ── Phase 2: burst around each peak ──────────────────────────────
    let rawFrames;
    if (peakIndices.length === 0) {
      const cycleFps = STROKE_CYCLE_FPS[stroke] ?? 1.5;
      const effectiveCount = Math.min(frameCount, Math.ceil(totalDuration * cycleFps));
      rawFrames = await extractFrameBurst(
        videoPath, tempDir,
        '0:00', formatTimestamp(totalDuration),
        effectiveCount,
      );
    } else {
      const burstResults = [];
      for (const idx of peakIndices) {
        const centerSec = parseTimestamp(scanFrames[idx].time);
        const burst = await extractBurstAt(videoPath, tempDir, centerSec, {
          windowSeconds: 1.0,
          fps: 8,
        }).catch(() => []);
        burstResults.push(...burst);
      }
      rawFrames = burstResults;
    }

    if (rawFrames.length === 0) {
      res.status(422).json({ error: 'No frames could be extracted from the video.' });
      return;
    }

    // ── Optimize + dedup ──────────────────────────────────────────────
    console.log(`[bridge] optimizing ${rawFrames.length} raw frames...`);
    const optimizedPaths = await optimizeFrames(
      rawFrames.map(f => f.filePath),
      tempDir,
    ).catch(() => rawFrames.map(f => f.filePath));

    let frames = rawFrames.map((frame, i) => ({
      ...frame,
      filePath: optimizedPaths[i] ?? frame.filePath,
    }));
    frames = await deduplicateFrames(frames, 3).catch(() => frames);
    console.log(`[bridge] sending ${frames.length} frames to Claude...`);

    // ── Build prompt ──────────────────────────────────────────────────
    const taxonomyEntries = getTaxonomyByStroke(stroke);
    const taxonomySection = formatTaxonomyForPrompt(taxonomyEntries);
    const systemPrompt = buildSystemPrompt(stroke, taxonomySection);
    const userPrompt = buildUserPrompt(swimmer, notes);

    // ── Reference images ──────────────────────────────────────────────
    const referenceBlocks = await buildReferenceBlocks(taxonomyEntries);

    // ── Assemble user content ─────────────────────────────────────────
    const imageBlocks: Anthropic.ImageBlockParam[] = frames.map(frame => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: fs.readFileSync(frame.filePath).toString('base64'),
      },
    }));

    const userContent: Anthropic.ContentBlockParam[] = [];
    if (referenceBlocks.length > 0) {
      userContent.push({ type: 'text', text: '## Reference Examples\nUse these labeled examples to calibrate your analysis:\n' });
      userContent.push(...referenceBlocks);
      userContent.push({ type: 'text', text: '\n## Swimmer Footage\nAnalyze the following frames:\n' });
    }
    userContent.push(...imageBlocks, { type: 'text', text: userPrompt });

    // ── Call Claude ───────────────────────────────────────────────────
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    });

    const markdown =
      response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';
    const tokens = response.usage.input_tokens + response.usage.output_tokens;

    // ── Return frames as base64 data URLs for the web app filmstrip ───
    const frameData = frames.map(f => ({
      timestamp: f.time,
      dataUrl: `data:image/jpeg;base64,${fs.readFileSync(f.filePath).toString('base64')}`,
    }));

    res.json({
      markdown,
      tokens,
      model: response.model,
      frames: frameData,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[bridge] error:', msg);
    res.status(500).json({ error: msg });
  } finally {
    fs.unlink(videoPath, () => {});
  }
});

app.listen(PORT, () => {
  console.log(`\nSwimLens bridge running → http://localhost:${PORT}`);
  console.log('Open the web app — it will auto-detect the bridge and use ffmpeg + sharp.\n');
});
