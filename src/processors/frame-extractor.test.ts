import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseTimestamp,
  formatTimestamp,
  parseSceneTimestamps,
  probeVideoDuration,
  extractFrameAt,
} from './frame-extractor.js';
import { createTempDir, cleanupTempDir } from '../utils/temp-files.js';

const FIXTURES_DIR = join(import.meta.dirname, '../../test/fixtures');

describe('parseTimestamp', () => {
  it('parses "1:23" to 83 seconds', () => {
    expect(parseTimestamp('1:23')).toBe(83);
  });

  it('parses "0:05" to 5 seconds', () => {
    expect(parseTimestamp('0:05')).toBe(5);
  });

  it('parses "01:23:45" to 5025 seconds', () => {
    expect(parseTimestamp('01:23:45')).toBe(5025);
  });

  it('parses "0:00" to 0 seconds', () => {
    expect(parseTimestamp('0:00')).toBe(0);
  });

  it('parses "10:30" to 630 seconds', () => {
    expect(parseTimestamp('10:30')).toBe(630);
  });

  it('throws for invalid format', () => {
    expect(() => parseTimestamp('abc')).toThrow('Invalid timestamp');
  });

  it('throws for single number', () => {
    expect(() => parseTimestamp('5')).toThrow('Invalid timestamp');
  });
});

describe('formatTimestamp', () => {
  it('formats 83 seconds as "1:23"', () => {
    expect(formatTimestamp(83)).toBe('1:23');
  });

  it('formats 5 seconds as "0:05"', () => {
    expect(formatTimestamp(5)).toBe('0:05');
  });

  it('formats 5025 seconds as "1:23:45"', () => {
    expect(formatTimestamp(5025)).toBe('1:23:45');
  });

  it('formats 0 seconds as "0:00"', () => {
    expect(formatTimestamp(0)).toBe('0:00');
  });

  it('formats 3600 seconds as "1:00:00"', () => {
    expect(formatTimestamp(3600)).toBe('1:00:00');
  });
});

describe('parseSceneTimestamps', () => {
  it('extracts pts_time values from ffmpeg stderr', () => {
    const stderr = readFileSync(join(FIXTURES_DIR, 'ffmpeg-scene-stderr.txt'), 'utf-8');
    const timestamps = parseSceneTimestamps(stderr);

    expect(timestamps).toEqual([0, 5, 12.5, 30]);
  });

  it('returns empty array for no matches', () => {
    expect(parseSceneTimestamps('no timestamps here')).toEqual([]);
  });
});

describe('probeVideoDuration', () => {
  it('returns duration of tiny.mp4 fixture (~3 seconds)', async () => {
    const duration = await probeVideoDuration(join(FIXTURES_DIR, 'tiny.mp4'));
    expect(duration).toBeGreaterThan(2);
    expect(duration).toBeLessThan(4);
  });

  it('throws for non-existent file', async () => {
    await expect(probeVideoDuration('/nonexistent/video.mp4')).rejects.toThrow();
  });
});

describe('extractFrameAt', () => {
  it('extracts a single frame from tiny.mp4', async () => {
    const tempDir = await createTempDir();
    try {
      const result = await extractFrameAt(join(FIXTURES_DIR, 'tiny.mp4'), tempDir, '0:01');

      expect(result.time).toBe('0:01');
      expect(result.mimeType).toBe('image/jpeg');
      expect(existsSync(result.filePath)).toBe(true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
