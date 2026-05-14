import Anthropic from '@anthropic-ai/sdk';
import type { FastMCP } from 'fastmcp';
import { UserError, imageContent } from 'fastmcp';
import fs from 'fs';
import { z } from 'zod';
import { getAdapter } from '../adapters/adapter.interface.js';
import type { CameraAngle } from '../data/swim-taxonomy.js';
import {
  formatTaxonomyForPrompt,
  getTaxonomyByFocusAreas,
  getTaxonomyByStroke,
  getTaxonomyByStrokeAndAngle,
} from '../data/swim-taxonomy.js';
import { deduplicateFrames, detectMotionPeaks } from '../processors/frame-dedup.js';
import {
  extractBurstAt,
  extractDenseFrames,
  extractFrameBurst,
  formatTimestamp,
  parseTimestamp,
  probeVideoDuration,
} from '../processors/frame-extractor.js';
import { optimizeFrames } from '../processors/image-optimizer.js';
import type { IFrameResult } from '../types.js';
import { createProgressReporter } from '../utils/progress.js';
import { buildReferenceBlocks } from '../utils/reference-images.js';
import { createTempDir } from '../utils/temp-files.js';

// Approximate stroke cycles per second at race pace for each stroke.
// Used to derive a frame count that naturally aligns with stroke phase boundaries
// rather than landing randomly within a cycle.
const STROKE_CYCLE_FPS: Record<string, number> = {
  breaststroke: 1.2,
  butterfly: 1.2,
  backstroke: 1.5,
  freestyle: 2.0,
  unknown: 1.5,
};

const AnalyzeSwimStrokeSchema = z.object({
  url: z.string().url().describe('Video URL of the swim footage (.mp4, .webm, .mov)'),
  from: z
    .string()
    .optional()
    .describe('Start timestamp for analysis (e.g., "0:10"). Defaults to start of video.'),
  to: z
    .string()
    .optional()
    .describe('End timestamp for analysis (e.g., "0:30"). Defaults to end of video.'),
  stroke: z
    .enum(['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'unknown'])
    .default('unknown')
    .optional()
    .describe('Swimming stroke being performed (helps focus the analysis)'),
  cameraAngle: z
    .enum(['overhead', 'deck_side', 'underwater'])
    .optional()
    .describe(
      'Camera angle of the footage. Controls which taxonomy entries are shown and how Claude interprets the frames. ' +
        '"overhead" = elevated wide-angle broadcast or stands (body line, hip level, breath height, phase timing, wake pattern). ' +
        '"deck_side" = pool deck level side-on (head position, arm recovery, body line, breathing timing). ' +
        '"underwater" = submerged camera (catch mechanics, pull path, kick, body rotation). ' +
        'Omit if unknown — defaults to full taxonomy.',
    ),
  focus: z
    .array(
      z.enum([
        // deck_side / underwater
        'arm_entry',
        'pull_phase',
        'kick',
        'body_rotation',
        'head_position',
        'breathing',
        'turn',
        'start',
        // overhead
        'body_line',
        'hip_level',
        'breath_height',
        'phase_timing',
        'wake_pattern',
        'stroke_rate',
        // universal
        'overall',
      ]),
    )
    .default(['overall'])
    .optional()
    .describe('Specific aspects of technique to focus on'),
  frameCount: z
    .number()
    .min(3)
    .max(20)
    .default(12)
    .optional()
    .describe(
      'Maximum frames to extract for analysis (default: 12). ' +
        'Actual count is capped at the stroke cycle rate × window duration so frames align with stroke phases.',
    ),
  swimmer: z
    .string()
    .optional()
    .describe(
      'Description of a specific swimmer to focus on (e.g., "lane 4 from bottom, blue cap and blue suit"). ' +
        'When provided, Claude will track and analyze only that swimmer across all frames, ' +
        'using other swimmers only for comparison.',
    ),
});

function buildAngleSystemPrompt(cameraAngle: CameraAngle | undefined, swimmer?: string): string {
  const swimmerDirective = swimmer
    ? `\n\n## Target Swimmer\nFocus your entire analysis on this specific swimmer: **${swimmer}**.\n` +
      `Track this swimmer across all frames using their visual identifiers (cap color, suit color, lane position).\n` +
      `Other swimmers in the frame may be referenced for comparison only — do not analyze them as primary subjects.`
    : '';

  const base =
    `You are an expert swimming coach with deep knowledge of competitive swimming technique.\n` +
    `You analyze video frames to provide specific, actionable technique feedback.\n` +
    `Be precise about what you observe — reference body position, timing, and mechanics directly.\n` +
    `Structure your feedback clearly with strengths, areas for improvement, and specific drills to fix issues.` +
    swimmerDirective;

  if (cameraAngle === 'overhead') {
    return (
      base +
      `\n\n## Camera angle: ELEVATED WIDE-ANGLE (overhead)\n\n` +
      `At this distance swimmers occupy a small portion of the frame.\n` +
      `Your analysis must be strictly limited to what is physically visible from this angle.\n\n` +
      `**WHAT YOU CAN ASSESS:**\n` +
      `- Body silhouette angle relative to the waterline (seesaw vs. flat body line)\n` +
      `- Hip level: whether hips are at, above, or visibly below the waterline\n` +
      `- Breath height: how far the swimmer's head/body rises above the surface during the breath\n` +
      `- Phase timing: visible glide pauses between stroke cycles vs. constant churning motion\n` +
      `- Wake pattern: tight narrow wake (forward-directed energy) vs. wide scattered wake (vertical bobbing)\n` +
      `- Stroke rate: countable from splash rhythm\n` +
      `- Cross-lane comparison: relative body position and timing between swimmers\n\n` +
      `**WHAT YOU CANNOT ASSESS — do NOT speculate about these:**\n` +
      `- Elbow position, elbow angle, or wrist rotation\n` +
      `- Hand pitch or catch depth\n` +
      `- Precise head angle or chin position\n` +
      `- Kick mechanics below the surface\n` +
      `- Body rotation (freestyle/backstroke)\n\n` +
      `If something is not clearly visible from this angle, say so and redirect to what IS observable.`
    );
  }

  if (cameraAngle === 'deck_side') {
    return (
      base +
      `\n\n## Camera angle: POOL DECK LEVEL (side-on)\n\n` +
      `**WHAT YOU CAN ASSESS:**\n` +
      `- Head position during breath: height above water, neck extension, chin angle\n` +
      `- Body line and undulation above the waterline\n` +
      `- Hip position relative to the waterline\n` +
      `- Arm recovery height and path above water\n` +
      `- Breathing timing relative to the pull cycle\n` +
      `- Body angle during the breath and seesaw effect\n` +
      `- General kick pattern above the surface\n\n` +
      `**WHAT YOU CANNOT ASSESS without underwater footage:**\n` +
      `- Hand pitch and catch depth\n` +
      `- Underwater pull path\n` +
      `- Kick mechanics below the surface`
    );
  }

  if (cameraAngle === 'underwater') {
    return (
      base +
      `\n\n## Camera angle: UNDERWATER\n\n` +
      `**WHAT YOU CAN ASSESS:**\n` +
      `- Catch mechanics: elbow position, hand pitch, forearm angle (early vertical forearm)\n` +
      `- Pull path: direction and efficiency of force application\n` +
      `- Kick mechanics: knee bend, foot position, kick depth and width\n` +
      `- Hip position and body rotation\n` +
      `- Streamline position during glide\n` +
      `- Arm symmetry and bilateral timing\n\n` +
      `**WHAT YOU CANNOT ASSESS reliably:**\n` +
      `- Breathing timing (head position above water not visible)\n` +
      `- Race-pace stroke rate without surface context`
    );
  }

  return base;
}

function buildUserPrompt(
  strokeLabel: string,
  focusLabel: string,
  cameraAngle: CameraAngle | undefined,
  swimmer?: string,
): string {
  const angleNote =
    cameraAngle === 'overhead'
      ? `\nNote: This is an elevated wide-angle shot. Assess only what is visible at this distance — body silhouette, hip level, breath height, phase timing, and wake pattern. Do not speculate about elbow position, hand pitch, or any fine arm mechanics.`
      : cameraAngle === 'deck_side'
        ? `\nNote: This is a pool deck side-on view. Focus on above-water mechanics — head position, body line, hip level, and breathing timing.`
        : cameraAngle === 'underwater'
          ? `\nNote: This is underwater footage. Focus on catch mechanics, pull path, kick, and body rotation.`
          : '';

  const swimmerLine = swimmer
    ? `\nFocus exclusively on the swimmer matching this description: **${swimmer}**. Track them by their visual identifiers across all frames.`
    : '';

  return `These are sequential frames from a ${strokeLabel} video.
Please analyze the swimmer's ${focusLabel}.${angleNote}${swimmerLine}

Provide your analysis in this structure:

## Stroke: ${strokeLabel.charAt(0).toUpperCase() + strokeLabel.slice(1)}
## Camera Angle: ${cameraAngle ?? 'unspecified'}
## Focus Areas: ${focusLabel}

### What I Observe
(Describe what you see across the frames — only what is visible from this camera angle)

### Strengths
(What the swimmer is doing well)

### Areas for Improvement
(Specific technique issues observed, referencing only what is detectable from this angle)

### Recommended Drills
(3–5 specific drills to address the issues found)

### Summary
(One paragraph coaching summary)`;
}

export function registerAnalyzeSwimStroke(server: FastMCP): void {
  server.addTool({
    name: 'analyze_swim_stroke',
    description: `Analyze swim technique using Claude's vision AI.

Extracts frames from a swim video and sends them to Claude for detailed technique feedback —
stroke mechanics, body position, kick timing, breathing pattern, and coaching recommendations.

Use this when:
- A swimmer wants feedback on their technique
- A coach wants to review stroke mechanics from video
- Comparing before/after technique changes

Supports freestyle, backstroke, breaststroke, and butterfly analysis.
Requires a direct video URL (.mp4, .webm, .mov).`,
    parameters: AnalyzeSwimStrokeSchema,
    annotations: {
      title: 'Analyze Swim Stroke',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    execute: async (args, { reportProgress }) => {
      const progress = createProgressReporter(reportProgress);
      const { url } = args;
      const stroke = args.stroke ?? 'unknown';
      const focus = args.focus ?? ['overall'];
      const frameCount = args.frameCount ?? 8;
      const cameraAngle = args.cameraAngle as CameraAngle | undefined;

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new UserError(
          'ANTHROPIC_API_KEY environment variable is not set. Add it to your .env file.',
        );
      }

      let adapter;
      try {
        adapter = getAdapter(url);
      } catch (error) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to detect video platform for URL: ${url}`);
      }

      if (!adapter.capabilities.videoDownload) {
        throw new UserError(
          'Swim stroke analysis requires video download. Use a direct video URL (.mp4, .webm, .mov).',
        );
      }

      const tempDir = await createTempDir();
      await progress(5, 'Downloading swim video...');

      const videoPath = await adapter.downloadVideo(url, tempDir);
      if (!videoPath) {
        throw new UserError('Failed to download video for analysis.');
      }

      // ── Phase 1: 1fps motion scan ──────────────────────────────────
      await progress(20, 'Scanning video for technique moments...');

      const totalDuration = await probeVideoDuration(videoPath);
      const fromSec = args.from ? parseTimestamp(args.from) : 0;
      const toSec = args.to ? parseTimestamp(args.to) : totalDuration;

      if (fromSec >= toSec) {
        throw new UserError(
          `"from" timestamp (${args.from}) must be before "to" timestamp (${args.to})`,
        );
      }

      const scanFrames = await extractDenseFrames(videoPath, tempDir, {
        fps: 1,
        maxFrames: 120,
        ...(fromSec > 0 && { fromSeconds: fromSec }),
        ...(toSec < totalDuration && { toSeconds: toSec }),
      });

      // ── Detect local motion peaks (stroke-phase transitions) ───────
      const topN = Math.max(2, Math.floor(frameCount / 3));
      const peakIndices = await detectMotionPeaks(scanFrames, { topN, minMagnitude: 6 });

      // ── Phase 2: burst around each peak ───────────────────────────
      await progress(40, `Found ${peakIndices.length} key moments, extracting bursts...`);

      let rawFrames: IFrameResult[];

      if (peakIndices.length === 0 || scanFrames.length === 0) {
        // Fallback: no detectable peaks — use stroke-cycle uniform sampling
        const cycleFps = STROKE_CYCLE_FPS[stroke] ?? 1.5;
        const windowDuration = toSec - fromSec;
        const effectiveCount = Math.min(frameCount, Math.ceil(windowDuration * cycleFps));
        rawFrames = await extractFrameBurst(
          videoPath,
          tempDir,
          formatTimestamp(fromSec),
          formatTimestamp(toSec),
          effectiveCount,
        );
      } else {
        const burstResults: IFrameResult[][] = [];
        for (const idx of peakIndices) {
          const centerSec = parseTimestamp(scanFrames[idx].time);
          const burst = await extractBurstAt(videoPath, tempDir, centerSec, {
            windowSeconds: 1.0,
            fps: 8,
          }).catch(() => [] as IFrameResult[]);
          burstResults.push(burst);
        }
        rawFrames = burstResults.flat();
      }

      if (rawFrames.length === 0) {
        throw new UserError('No frames could be extracted from the video.');
      }

      await progress(55, `Extracted ${rawFrames.length} frames, optimizing...`);

      const optimizedPaths = await optimizeFrames(
        rawFrames.map((f: IFrameResult) => f.filePath),
        tempDir,
      ).catch(() => rawFrames.map((f: IFrameResult) => f.filePath));

      let frames = rawFrames.map((frame: IFrameResult, i: number) => ({
        ...frame,
        filePath: optimizedPaths[i] ?? frame.filePath,
      }));

      // Burst frames are already dense; dedup removes near-identical frames within each burst.
      frames = await deduplicateFrames(frames, 3).catch(() => frames);

      await progress(70, `Sending ${frames.length} frames to Claude for analysis...`);

      // Build image content blocks for Claude API
      const imageBlocks: Anthropic.ImageBlockParam[] = [];
      for (const frame of frames) {
        const imageData = fs.readFileSync(frame.filePath).toString('base64');
        imageBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageData,
          },
        });
      }

      // Build the analysis prompt
      const strokeLabel = stroke === 'unknown' ? 'swimming' : stroke;
      const focusLabel =
        focus.includes('overall') || focus.length === 0
          ? 'overall technique'
          : focus.map((f) => f.replace(/_/g, ' ')).join(', ');

      const byAngle = cameraAngle
        ? getTaxonomyByStrokeAndAngle(stroke, cameraAngle)
        : getTaxonomyByStroke(stroke);
      const taxonomyEntries = getTaxonomyByFocusAreas(byAngle, focus);
      const taxonomySection = formatTaxonomyForPrompt(taxonomyEntries);

      const angleSystemPrompt = buildAngleSystemPrompt(cameraAngle, args.swimmer);
      const systemPrompt =
        angleSystemPrompt +
        (taxonomySection.length > 0
          ? `\n\n---\n\n## Technique issues detectable from this camera angle\n\n${taxonomySection}`
          : '');

      const userPrompt = buildUserPrompt(strokeLabel, focusLabel, cameraAngle, args.swimmer);

      const referenceBlocks = await buildReferenceBlocks(taxonomyEntries);

      const client = new Anthropic({ apiKey });

      const userContent: Anthropic.ContentBlockParam[] = [];
      if (referenceBlocks.length > 0) {
        userContent.push({
          type: 'text',
          text: '## Reference Examples\nUse these labeled examples to calibrate your analysis:\n',
        });
        userContent.push(...referenceBlocks);
        userContent.push({
          type: 'text',
          text: "\n## Video Frames\nNow analyze the following frames from the swimmer's video:\n",
        });
      }
      userContent.push(...imageBlocks, { type: 'text', text: userPrompt });

      const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      });

      await progress(95, 'Analysis complete, building report...');

      const analysisText =
        response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ??
        'No analysis returned.';

      const metadata = {
        framesAnalyzed: frames.length,
        stroke,
        cameraAngle: cameraAngle ?? 'unspecified',
        focus,
        swimmer: args.swimmer ?? null,
        range: args.from && args.to ? { from: args.from, to: args.to } : null,
        model: response.model,
        usage: response.usage,
      };

      await progress(100, 'Done');

      // Return analysis text + the frames that were analyzed
      const content: ({ type: 'text'; text: string } | Awaited<ReturnType<typeof imageContent>>)[] =
        [
          { type: 'text' as const, text: analysisText },
          {
            type: 'text' as const,
            text: `\n\n---\n_Analyzed ${frames.length} frames using ${response.model}_`,
          },
          {
            type: 'text' as const,
            text:
              `\n_Frames: ${metadata.framesAnalyzed} | Stroke: ${metadata.stroke} | Angle: ${metadata.cameraAngle}` +
              (metadata.swimmer ? ` | Swimmer: ${metadata.swimmer}` : '') +
              (metadata.range ? ` | Range: ${metadata.range.from}–${metadata.range.to}` : '') +
              '_',
          },
        ];

      for (const frame of frames) {
        content.push(await imageContent({ path: frame.filePath }));
      }

      return { content };
    },
  });
}
