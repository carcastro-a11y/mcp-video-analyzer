import { execFile as execFileCb } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { IFrameResult } from '../types.js';

const execFile = promisify(execFileCb);

const require = createRequire(import.meta.url);
const ffmpegPath: string = require('ffmpeg-static') as string;

/** Normalize path to forward slashes for ffmpeg image2 muxer (Windows compat) */
function ffmpegPath_(p: string): string {
  return p.replace(/\\/g, '/');
}

export function parseTimestamp(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.some((p) => isNaN(p))) {
    throw new Error(`Invalid timestamp format: "${ts}"`);
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  throw new Error(`Invalid timestamp format: "${ts}". Expected "M:SS" or "H:MM:SS".`);
}

export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export async function probeVideoDuration(videoPath: string): Promise<number> {
  try {
    const { stderr } = await execFile(ffmpegPath, ['-i', videoPath, '-f', 'null', '-'], {
      timeout: 30000,
    });
    return parseDurationFromStderr(stderr);
  } catch (error: unknown) {
    // ffmpeg exits with code 1 even on successful probe; check stderr
    if (error && typeof error === 'object' && 'stderr' in error) {
      const stderr = (error as { stderr: string }).stderr;
      const duration = parseDurationFromStderr(stderr);
      if (duration > 0) return duration;
    }
    throw new Error(`Failed to probe video duration: ${videoPath}`, { cause: error });
  }
}

function parseDurationFromStderr(stderr: string): number {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const centiseconds = parseInt(match[4], 10);

  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
}

export function parseSceneTimestamps(stderr: string): number[] {
  const timestamps: number[] = [];
  const regex = /pts_time:(\d+(?:\.\d+)?)/g;
  let match;

  while ((match = regex.exec(stderr)) !== null) {
    timestamps.push(parseFloat(match[1]));
  }

  return timestamps;
}

export async function extractSceneFrames(
  videoPath: string,
  outputDir: string,
  options: { threshold?: number; maxFrames?: number } = {},
): Promise<IFrameResult[]> {
  const threshold = options.threshold ?? 0.1;
  const maxFrames = options.maxFrames ?? 20;

  const outputPattern = ffmpegPath_(join(outputDir, 'scene_%03d.jpg'));

  try {
    const { stderr } = await execFile(
      ffmpegPath,
      [
        '-i',
        videoPath,
        '-vf',
        `select='gt(scene,${threshold})',showinfo`,
        '-fps_mode',
        'vfr',
        '-q:v',
        '2',
        outputPattern,
        '-y',
      ],
      { timeout: 120000 },
    );

    const timestamps = parseSceneTimestamps(stderr);
    const files = await listFrameFiles(outputDir, 'scene_');

    const results: IFrameResult[] = files.slice(0, maxFrames).map((file, i) => ({
      time: formatTimestamp(timestamps[i] ?? 0),
      filePath: join(outputDir, file),
      mimeType: 'image/jpeg',
    }));

    return results;
  } catch (error: unknown) {
    // Try to parse results from partial output
    if (error && typeof error === 'object' && 'stderr' in error) {
      const stderr = (error as { stderr: string }).stderr;
      const timestamps = parseSceneTimestamps(stderr);
      const files = await listFrameFiles(outputDir, 'scene_').catch(() => [] as string[]);

      if (files.length > 0) {
        return files.slice(0, maxFrames).map((file, i) => ({
          time: formatTimestamp(timestamps[i] ?? 0),
          filePath: join(outputDir, file),
          mimeType: 'image/jpeg',
        }));
      }
    }

    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Scene frame extraction failed: ${msg}`, { cause: error });
  }
}

export async function extractFrameAt(
  videoPath: string,
  outputDir: string,
  timestamp: string,
): Promise<IFrameResult> {
  const seconds = parseTimestamp(timestamp);
  const outputPath = ffmpegPath_(join(outputDir, `frame_at_${seconds}.jpg`));

  try {
    await execFile(
      ffmpegPath,
      ['-ss', String(seconds), '-i', videoPath, '-frames:v', '1', '-q:v', '2', outputPath, '-y'],
      { timeout: 30000 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Frame extraction at ${timestamp} failed: ${msg}`, { cause: error });
  }

  return {
    time: timestamp,
    filePath: outputPath,
    mimeType: 'image/jpeg',
  };
}

export async function extractFrameBurst(
  videoPath: string,
  outputDir: string,
  from: string,
  to: string,
  count = 5,
): Promise<IFrameResult[]> {
  const fromSeconds = parseTimestamp(from);
  const toSeconds = parseTimestamp(to);

  if (toSeconds <= fromSeconds) {
    throw new Error(`"to" timestamp (${to}) must be after "from" timestamp (${from}).`);
  }

  const duration = toSeconds - fromSeconds;
  const fps = count / duration;

  const outputPattern = ffmpegPath_(join(outputDir, 'burst_%03d.jpg'));

  try {
    await execFile(
      ffmpegPath,
      [
        '-ss',
        String(fromSeconds),
        '-to',
        String(toSeconds),
        '-i',
        videoPath,
        '-vf',
        `fps=${fps}`,
        '-q:v',
        '2',
        outputPattern,
        '-y',
      ],
      { timeout: 60000 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Burst frame extraction failed: ${msg}`, { cause: error });
  }

  const files = await listFrameFiles(outputDir, 'burst_');

  return files.map((file, i) => {
    const frameTime = fromSeconds + (i * duration) / Math.max(count - 1, 1);
    return {
      time: formatTimestamp(Math.round(frameTime)),
      filePath: join(outputDir, file),
      mimeType: 'image/jpeg',
    };
  });
}

/**
 * Extract frames at a fixed rate (dense sampling).
 * Useful for motion scanning — captures 1 frame per second by default.
 * Supports optional time window via fromSeconds/toSeconds.
 */
export async function extractDenseFrames(
  videoPath: string,
  outputDir: string,
  options?: { fps?: number; maxFrames?: number; fromSeconds?: number; toSeconds?: number },
): Promise<IFrameResult[]> {
  const requestedFps = options?.fps ?? 1;
  const maxFrames = options?.maxFrames ?? 120;
  const fromSec = options?.fromSeconds ?? 0;

  const totalDuration = await probeVideoDuration(videoPath);
  const toSec = options?.toSeconds ?? totalDuration;
  const windowDuration = Math.max(toSec - fromSec, 0.1);

  const expectedFrames = Math.ceil(windowDuration * requestedFps);
  const effectiveFps = expectedFrames > maxFrames ? maxFrames / windowDuration : requestedFps;

  const outputPattern = ffmpegPath_(join(outputDir, 'dense_%04d.jpg'));

  // Fast keyframe seek when a start offset is given; -t limits to window duration
  const args: string[] = [];
  if (fromSec > 0) args.push('-ss', String(fromSec));
  args.push('-i', videoPath, '-t', String(windowDuration), '-vf', `fps=${effectiveFps}`, '-q:v', '2', outputPattern, '-y');

  try {
    await execFile(ffmpegPath, args, { timeout: 180000 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Dense frame extraction failed: ${msg}`, { cause: error });
  }

  const files = await listFrameFiles(outputDir, 'dense_');

  return files.slice(0, maxFrames).map((file, i) => ({
    time: formatTimestamp(Math.round(fromSec + i / effectiveFps)),
    filePath: join(outputDir, file),
    mimeType: 'image/jpeg',
  }));
}

/**
 * Extract a short burst of frames centred on a specific timestamp.
 * Uses a unique file prefix per call so multiple bursts can coexist in the same output dir.
 *
 * @param centerSeconds - The focal timestamp (seconds from video start)
 * @param options.windowSeconds - Total window around the centre (default: 1.0s)
 * @param options.fps - Frames per second within the burst (default: 8)
 */
export async function extractBurstAt(
  videoPath: string,
  outputDir: string,
  centerSeconds: number,
  options?: { windowSeconds?: number; fps?: number },
): Promise<IFrameResult[]> {
  const windowSeconds = options?.windowSeconds ?? 1.0;
  const fps = options?.fps ?? 8;

  const fromSec = Math.max(0, centerSeconds - windowSeconds / 2);

  // Unique prefix per centre timestamp avoids file collisions across parallel bursts
  const prefix = `burst_${Math.round(centerSeconds * 1000)}_`;
  const outputPattern = ffmpegPath_(join(outputDir, `${prefix}%03d.jpg`));

  try {
    await execFile(
      ffmpegPath,
      [
        '-ss', String(fromSec),
        '-i', videoPath,
        '-t', String(windowSeconds),
        '-vf', `fps=${fps}`,
        '-q:v', '2',
        outputPattern,
        '-y',
      ],
      { timeout: 30000 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Burst extraction at ${centerSeconds}s failed: ${msg}`, { cause: error });
  }

  const files = await listFrameFiles(outputDir, prefix);

  return files.map((file, i) => ({
    time: formatTimestamp(fromSec + i / fps),
    filePath: join(outputDir, file),
    mimeType: 'image/jpeg',
  }));
}

async function listFrameFiles(dir: string, prefix: string): Promise<string[]> {
  const files = await readdir(dir);
  return files.filter((f) => f.startsWith(prefix) && f.endsWith('.jpg')).sort();
}
