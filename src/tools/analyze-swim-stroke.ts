import Anthropic from '@anthropic-ai/sdk';
import type { FastMCP } from 'fastmcp';
import { UserError, imageContent } from 'fastmcp';
import fs from 'fs';
import { z } from 'zod';
import { getAdapter } from '../adapters/adapter.interface.js';
import { deduplicateFrames } from '../processors/frame-dedup.js';
import {
  extractFrameBurst,
  parseTimestamp,
  probeVideoDuration,
} from '../processors/frame-extractor.js';
import { optimizeFrames } from '../processors/image-optimizer.js';
import type { IFrameResult } from '../types.js';
import { createProgressReporter } from '../utils/progress.js';
import { createTempDir } from '../utils/temp-files.js';

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
  focus: z
    .array(
      z.enum([
        'arm_entry',
        'pull_phase',
        'kick',
        'body_rotation',
        'head_position',
        'breathing',
        'turn',
        'start',
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
    .default(8)
    .optional()
    .describe('Number of frames to extract for analysis (default: 8)'),
});

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

      await progress(30, 'Extracting frames...');

      let rawFrames;
      if (args.from && args.to) {
        const fromSeconds = parseTimestamp(args.from);
        const toSeconds = parseTimestamp(args.to);
        if (fromSeconds >= toSeconds) {
          throw new UserError(
            `"from" timestamp (${args.from}) must be before "to" timestamp (${args.to})`,
          );
        }
        rawFrames = await extractFrameBurst(videoPath, tempDir, args.from, args.to, frameCount);
      } else {
        const totalDuration = await probeVideoDuration(videoPath);
        rawFrames = await extractFrameBurst(
          videoPath,
          tempDir,
          '0',
          String(totalDuration),
          frameCount,
        );
      }

      if (rawFrames.length === 0) {
        throw new UserError('No frames could be extracted from the video.');
      }

      await progress(50, `Extracted ${rawFrames.length} frames, optimizing...`);

      const optimizedPaths = await optimizeFrames(
        rawFrames.map((f: IFrameResult) => f.filePath),
        tempDir,
      ).catch(() => rawFrames.map((f: IFrameResult) => f.filePath));

      let frames = rawFrames.map((frame: IFrameResult, i: number) => ({
        ...frame,
        filePath: optimizedPaths[i] ?? frame.filePath,
      }));

      frames = await deduplicateFrames(frames).catch(() => frames);

      await progress(65, `Sending ${frames.length} frames to Claude for analysis...`);

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

      const systemPrompt = `You are an expert swimming coach with deep knowledge of competitive swimming technique.
You analyze video frames to provide specific, actionable technique feedback.
Be precise about what you observe — reference body position, timing, and mechanics directly.
Structure your feedback clearly with strengths, areas for improvement, and specific drills to fix issues.`;

      const userPrompt = `These are sequential frames from a ${strokeLabel} video.
Please analyze the swimmer's ${focusLabel}.

Provide your analysis in this structure:

## Stroke: ${strokeLabel.charAt(0).toUpperCase() + strokeLabel.slice(1)}
## Focus Areas: ${focusLabel}

### What I Observe
(Describe what you see across the frames — body position, timing, mechanics)

### Strengths
(What the swimmer is doing well)

### Areas for Improvement
(Specific technique issues observed, with frame-by-frame references where relevant)

### Recommended Drills
(3–5 specific drills or exercises to address the issues found)

### Summary
(One paragraph coaching summary)`;

      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [...imageBlocks, { type: 'text', text: userPrompt }],
          },
        ],
      });

      await progress(95, 'Analysis complete, building report...');

      const analysisText =
        response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ??
        'No analysis returned.';

      const metadata = {
        framesAnalyzed: frames.length,
        stroke,
        focus,
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
          { type: 'text' as const, text: JSON.stringify(metadata, null, 2) },
        ];

      for (const frame of frames) {
        content.push(await imageContent({ path: frame.filePath }));
      }

      return { content };
    },
  });
}
