import sharp from 'sharp';
import type { IFrameResult } from '../types.js';

const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;

/**
 * Check if a frame is effectively black/blank.
 * Computes the mean brightness of the image — if below threshold, it's black.
 */
export async function isBlackFrame(filePath: string, threshold = 10): Promise<boolean> {
  try {
    const { channels } = await sharp(filePath).stats();
    // Average the mean of all channels (R, G, B)
    const meanBrightness = channels.reduce((sum, ch) => sum + ch.mean, 0) / channels.length;
    return meanBrightness < threshold;
  } catch {
    return false; // If we can't analyze, keep the frame
  }
}

/**
 * Filter out black/blank frames from the array.
 * Returns the filtered frames and count of removed frames.
 */
export async function filterBlackFrames(
  frames: IFrameResult[],
  threshold = 10,
): Promise<{ frames: IFrameResult[]; removedCount: number }> {
  if (frames.length === 0) return { frames, removedCount: 0 };

  const results = await Promise.all(
    frames.map(async (frame) => ({
      frame,
      isBlack: await isBlackFrame(frame.filePath, threshold),
    })),
  );

  const filtered = results.filter((r) => !r.isBlack).map((r) => r.frame);

  return {
    frames: filtered,
    removedCount: frames.length - filtered.length,
  };
}

/**
 * Compute a difference hash (dHash) for an image.
 * Resize to 9x8 grayscale, then compare each pixel to its right neighbor.
 * Returns a Buffer of 9 bytes (72 bits), one bit per pixel comparison.
 */
export async function computeDHash(imagePath: string): Promise<Buffer> {
  const pixels = await sharp(imagePath)
    .greyscale()
    .resize(HASH_WIDTH, HASH_HEIGHT, { fit: 'fill' })
    .raw()
    .toBuffer();

  // 8 columns of comparisons (9 pixels wide → 8 diffs) × 8 rows = 64 bits
  // We use 72 bits (9×8) for simplicity — compare each pixel to its right neighbor
  const bits: number[] = [];
  for (let y = 0; y < HASH_HEIGHT; y++) {
    for (let x = 0; x < HASH_WIDTH - 1; x++) {
      const left = pixels[y * HASH_WIDTH + x];
      const right = pixels[y * HASH_WIDTH + x + 1];
      bits.push(left > right ? 1 : 0);
    }
  }

  // Pack bits into bytes
  const bytes = Buffer.alloc(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) {
      bytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }
  }

  return bytes;
}

/**
 * Compute Hamming distance between two hashes (number of differing bits).
 */
export function hammingDistance(a: Buffer, b: Buffer): number {
  const len = Math.min(a.length, b.length);
  let distance = 0;

  for (let i = 0; i < len; i++) {
    let xor = a[i] ^ b[i];
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }

  return distance;
}

/**
 * Remove near-duplicate consecutive frames based on perceptual similarity.
 *
 * Computes dHash for each frame and drops frames that are too similar
 * to the previous kept frame (Hamming distance below threshold).
 *
 * @param frames - Array of frame results to deduplicate
 * @param maxDistance - Maximum Hamming distance to consider frames as duplicates (default: 5).
 *   Lower = more aggressive dedup. Range: 0 (identical only) to 64 (keep all).
 * @returns Deduplicated frames array
 */
export async function deduplicateFrames(
  frames: IFrameResult[],
  maxDistance = 5,
): Promise<IFrameResult[]> {
  if (frames.length <= 1) return frames;

  const hashes = await Promise.all(frames.map((f) => computeDHash(f.filePath).catch(() => null)));

  const result: IFrameResult[] = [frames[0]];
  let lastKeptHash = hashes[0];

  for (let i = 1; i < frames.length; i++) {
    const hash = hashes[i];

    // Keep frame if we couldn't hash it (safe fallback) or if it's different enough
    if (!hash || !lastKeptHash || hammingDistance(lastKeptHash, hash) > maxDistance) {
      result.push(frames[i]);
      lastKeptHash = hash;
    }
  }

  return result;
}

/**
 * Find frames that are clear motion peaks in a 1fps scan sequence.
 *
 * Computes dHash Hamming distance between consecutive frames to build a motion
 * magnitude signal, then returns indices of strict local maxima above a meaningful
 * threshold. Only flags moments with significant structural body-position changes —
 * camera shake, water ripple, and gradual drift are filtered out.
 *
 * @param frames - Frames in chronological order (typically a 1fps scan)
 * @param options.topN - Maximum peaks to return (default: 5)
 * @param options.minMagnitude - Minimum Hamming distance to qualify (default: 15, range 0–64).
 *   15/64 ≈ 23% structural change — enough to distinguish technique transitions from noise.
 * @param options.minSeparation - Minimum frames between accepted peaks (default: 2).
 *   Prevents two peaks from the same stroke cycle both being selected.
 * @returns Indices into `frames`, sorted chronologically. May be fewer than topN
 *   if the video has fewer clearly distinct technique moments.
 */
export async function detectMotionPeaks(
  frames: IFrameResult[],
  options?: { topN?: number; minMagnitude?: number; minSeparation?: number },
): Promise<number[]> {
  const topN = options?.topN ?? 5;
  const minMagnitude = options?.minMagnitude ?? 15;
  const minSeparation = options?.minSeparation ?? 2;

  if (frames.length < 2) {
    return [];
  }

  const hashes = await Promise.all(
    frames.map((f) => computeDHash(f.filePath).catch(() => null)),
  );

  // mag[i] = motion between frame i and frame i+1
  const mag: number[] = new Array(frames.length).fill(0);
  for (let i = 0; i < frames.length - 1; i++) {
    const a = hashes[i];
    const b = hashes[i + 1];
    mag[i] = a && b ? hammingDistance(a, b) : 0;
  }

  // Strict local maxima only (>) — plateaus are not peaks.
  // Assign burst center to frame i+1 (post-transition position is established there).
  const candidates: Array<{ index: number; magnitude: number }> = [];
  for (let i = 0; i < mag.length; i++) {
    if (mag[i] < minMagnitude) continue;
    const prevMag = i > 0 ? mag[i - 1] : 0;
    const nextMag = i < mag.length - 1 ? mag[i + 1] : 0;
    if (mag[i] > prevMag && mag[i] > nextMag) {
      const frameIdx = Math.min(i + 1, frames.length - 1);
      candidates.push({ index: frameIdx, magnitude: mag[i] });
    }
  }

  if (candidates.length === 0) return [];

  // Greedy NMS: take highest-magnitude peaks first, skip any within minSeparation frames.
  candidates.sort((a, b) => b.magnitude - a.magnitude);
  const selected: Array<{ index: number; magnitude: number }> = [];
  for (const candidate of candidates) {
    const tooClose = selected.some((s) => Math.abs(s.index - candidate.index) < minSeparation);
    if (!tooClose) {
      selected.push(candidate);
      if (selected.length >= topN) break;
    }
  }

  return selected.sort((a, b) => a.index - b.index).map((p) => p.index);
}
