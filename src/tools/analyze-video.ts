import type { FastMCP } from 'fastmcp';
import { imageContent, UserError } from 'fastmcp';
import { z } from 'zod';
import { getAdapter } from '../adapters/adapter.interface.js';
import { extractSceneFrames, probeVideoDuration } from '../processors/frame-extractor.js';
import { extractBrowserFrames, generateTimestamps } from '../processors/browser-frame-extractor.js';
import { deduplicateFrames } from '../processors/frame-dedup.js';
import { extractTextFromFrames } from '../processors/frame-ocr.js';
import { buildAnnotatedTimeline } from '../processors/annotated-timeline.js';
import { optimizeFrames } from '../processors/image-optimizer.js';
import { createTempDir, cleanupTempDir } from '../utils/temp-files.js';
import { formatTimestamp } from '../processors/frame-extractor.js';
import type { IAnalysisResult } from '../types.js';

const AnalyzeOptionsSchema = z
  .object({
    maxFrames: z
      .number()
      .min(1)
      .max(50)
      .default(20)
      .optional()
      .describe('Maximum number of key frames to extract (default: 20)'),
    threshold: z
      .number()
      .min(0)
      .max(1)
      .default(0.1)
      .optional()
      .describe(
        'Scene-change sensitivity 0.0-1.0 (lower = more frames, default: 0.1). Use 0.1 for screencasts/demos, 0.3 for live-action video.',
      ),
    returnBase64: z
      .boolean()
      .default(false)
      .optional()
      .describe('Return frames as base64 inline instead of file paths'),
    skipFrames: z
      .boolean()
      .default(false)
      .optional()
      .describe('Skip frame extraction (transcript + metadata only)'),
  })
  .optional();

const AnalyzeVideoSchema = z.object({
  url: z.string().url().describe('Video URL (Loom share link or direct mp4/webm URL)'),
  options: AnalyzeOptionsSchema.describe('Analysis options'),
});

export function registerAnalyzeVideo(server: FastMCP): void {
  server.addTool({
    name: 'analyze_video',
    description: `Analyze a video URL to extract transcript, key frames, metadata, comments, OCR text, and annotated timeline.

Returns structured data about the video content:
- Transcript with timestamps and speakers
- Key frames extracted via scene-change detection (deduplicated, as images)
- OCR text extracted from frames (code, error messages, UI text visible on screen)
- Annotated timeline merging transcript + frames + OCR into a unified chronological view
- Metadata (title, duration, platform)
- Comments from viewers (if available)

Supports: Loom (loom.com/share/...) and direct video URLs (.mp4, .webm, .mov).

Use options.skipFrames=true for transcript-only analysis (faster, no video download needed).`,
    parameters: AnalyzeVideoSchema,
    annotations: {
      title: 'Analyze Video',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    execute: async (args, { reportProgress }) => {
      const { url, options } = args;
      const skipFrames = options?.skipFrames ?? false;
      const maxFrames = options?.maxFrames ?? 20;
      const threshold = options?.threshold ?? 0.1;

      let adapter;
      try {
        adapter = getAdapter(url);
      } catch (error) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to detect video platform for URL: ${url}`);
      }

      const warnings: string[] = [];
      let tempDir: string | null = null;

      try {
        await reportProgress({ progress: 0, total: 100 });

        // Fetch metadata, transcript, comments in parallel
        const [metadata, transcript, comments, chapters, aiSummary] = await Promise.all([
          adapter.getMetadata(url).catch((e: unknown) => {
            warnings.push(
              `Failed to fetch metadata: ${e instanceof Error ? e.message : String(e)}`,
            );
            return {
              platform: adapter.name as 'loom' | 'direct' | 'unknown',
              title: 'Unknown',
              duration: 0,
              durationFormatted: '0:00',
              url,
            };
          }),
          adapter.getTranscript(url).catch((e: unknown) => {
            warnings.push(
              `Failed to fetch transcript: ${e instanceof Error ? e.message : String(e)}`,
            );
            return [];
          }),
          adapter.getComments(url).catch((e: unknown) => {
            warnings.push(
              `Failed to fetch comments: ${e instanceof Error ? e.message : String(e)}`,
            );
            return [];
          }),
          adapter.getChapters(url).catch(() => []),
          adapter.getAiSummary(url).catch(() => null),
        ]);

        await reportProgress({ progress: 40, total: 100 });

        // Frame extraction (if not skipped)
        const result: IAnalysisResult = {
          metadata,
          transcript,
          frames: [],
          comments,
          chapters,
          ocrResults: [],
          timeline: [],
          aiSummary: aiSummary ?? undefined,
          warnings,
        };

        if (!skipFrames) {
          tempDir = await createTempDir();
          let framesExtracted = false;

          // Strategy 1: yt-dlp download + ffmpeg scene detection
          if (adapter.capabilities.videoDownload) {
            const videoPath = await adapter.downloadVideo(url, tempDir);

            if (videoPath) {
              await reportProgress({ progress: 60, total: 100 });

              // Probe duration if metadata didn't provide it
              if (metadata.duration === 0) {
                const duration = await probeVideoDuration(videoPath).catch(() => 0);
                metadata.duration = duration;
                metadata.durationFormatted = formatTimestamp(Math.floor(duration));
              }

              // Extract scene frames
              const rawFrames = await extractSceneFrames(videoPath, tempDir, {
                threshold,
                maxFrames,
              }).catch((e: unknown) => {
                warnings.push(
                  `Frame extraction failed: ${e instanceof Error ? e.message : String(e)}`,
                );
                return [];
              });

              await reportProgress({ progress: 80, total: 100 });

              if (rawFrames.length > 0) {
                const optimizedPaths = await optimizeFrames(
                  rawFrames.map((f) => f.filePath),
                  tempDir,
                ).catch((e: unknown) => {
                  warnings.push(
                    `Frame optimization failed: ${e instanceof Error ? e.message : String(e)}`,
                  );
                  return rawFrames.map((f) => f.filePath);
                });

                result.frames = rawFrames.map((frame, i) => ({
                  ...frame,
                  filePath: optimizedPaths[i] ?? frame.filePath,
                }));
                framesExtracted = true;
              }
            }
          }

          // Strategy 2: Browser-based extraction (fallback)
          // Opens the video in headless Chrome, seeks to timestamps, takes screenshots
          if (!framesExtracted && metadata.duration > 0) {
            await reportProgress({ progress: 60, total: 100 });

            const timestamps = generateTimestamps(metadata.duration, maxFrames);
            const browserFrames = await extractBrowserFrames(url, tempDir, {
              timestamps,
            }).catch((e: unknown) => {
              warnings.push(
                `Browser frame extraction failed: ${e instanceof Error ? e.message : String(e)}`,
              );
              return [];
            });

            await reportProgress({ progress: 80, total: 100 });

            if (browserFrames.length > 0) {
              result.frames = browserFrames;
              framesExtracted = true;
            }
          }

          if (!framesExtracted) {
            warnings.push(
              'Frame extraction not available — returning transcript and metadata only. Install yt-dlp or Chrome/Chromium for frame extraction.',
            );
          }

          // Post-processing: dedup, OCR, timeline
          if (result.frames.length > 0) {
            // Deduplicate near-identical frames
            const beforeDedup = result.frames.length;
            result.frames = await deduplicateFrames(result.frames).catch((e: unknown) => {
              warnings.push(`Frame dedup failed: ${e instanceof Error ? e.message : String(e)}`);
              return result.frames;
            });
            if (result.frames.length < beforeDedup) {
              warnings.push(
                `Removed ${beforeDedup - result.frames.length} near-duplicate frames (${beforeDedup} → ${result.frames.length})`,
              );
            }

            await reportProgress({ progress: 85, total: 100 });

            // OCR: extract text visible on screen
            result.ocrResults = await extractTextFromFrames(result.frames).catch((e: unknown) => {
              warnings.push(`OCR failed: ${e instanceof Error ? e.message : String(e)}`);
              return [];
            });

            await reportProgress({ progress: 95, total: 100 });
          }

          // Build annotated timeline (even without frames, merges transcript)
          result.timeline = buildAnnotatedTimeline(
            result.transcript,
            result.frames,
            result.ocrResults,
          );
        }

        await reportProgress({ progress: 100, total: 100 });

        // Build response content
        const textData = {
          metadata: result.metadata,
          transcript: result.transcript,
          comments: result.comments,
          chapters: result.chapters,
          ocrResults: result.ocrResults,
          timeline: result.timeline,
          aiSummary: result.aiSummary,
          frameCount: result.frames.length,
          warnings: result.warnings,
        };

        const content: (
          | { type: 'text'; text: string }
          | Awaited<ReturnType<typeof imageContent>>
        )[] = [{ type: 'text' as const, text: JSON.stringify(textData, null, 2) }];

        // Add frame images
        for (const frame of result.frames) {
          content.push(await imageContent({ path: frame.filePath }));
        }

        return { content };
      } finally {
        // Note: we don't cleanup tempDir immediately because imageContent reads files
        // Cleanup will happen via process exit handler or on next invocation
        if (tempDir && warnings.length > 0) {
          // Only cleanup if we have no frames to serve
          const hasFrames = !skipFrames;
          if (!hasFrames) {
            await cleanupTempDir(tempDir).catch(() => undefined);
          }
        }
      }
    },
  });
}
