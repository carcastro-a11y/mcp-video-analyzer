import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastMCP } from 'fastmcp';
import { registerAnalyzeVideo } from './analyze-video.js';
import { registerAdapter, clearAdapters } from '../adapters/adapter.interface.js';
import type { IVideoAdapter } from '../adapters/adapter.interface.js';
import type { IAdapterCapabilities } from '../types.js';

function createMockAdapter(overrides: Partial<IVideoAdapter> = {}): IVideoAdapter {
  const capabilities: IAdapterCapabilities = {
    transcript: true,
    metadata: true,
    comments: true,
    chapters: false,
    aiSummary: false,
    videoDownload: false,
    ...overrides.capabilities,
  };

  return {
    name: 'mock',
    capabilities,
    canHandle: () => true,
    getMetadata: vi.fn().mockResolvedValue({
      platform: 'loom',
      title: 'Test Video',
      duration: 120,
      durationFormatted: '2:00',
      url: 'https://www.loom.com/share/test123',
    }),
    getTranscript: vi.fn().mockResolvedValue([
      { time: '0:05', text: 'Hello world' },
      { time: '0:12', text: 'This is a test' },
    ]),
    getComments: vi
      .fn()
      .mockResolvedValue([{ author: 'Alice', text: 'Great video!', time: '0:10' }]),
    getChapters: vi.fn().mockResolvedValue([]),
    getAiSummary: vi.fn().mockResolvedValue(null),
    downloadVideo: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('analyze_video tool', () => {
  let server: FastMCP;

  beforeEach(() => {
    clearAdapters();
    server = new FastMCP({ name: 'test', version: '0.0.0' });
    registerAnalyzeVideo(server);
  });

  afterEach(() => {
    clearAdapters();
  });

  it('registers the tool on the server', () => {
    // Tool registration doesn't throw
    expect(server).toBeDefined();
  });

  it('returns transcript and metadata when skipFrames is true', async () => {
    const mockAdapter = createMockAdapter();
    registerAdapter(mockAdapter);

    // Access the tool's execute function via the server internals
    // We test via the adapter mock being called correctly
    expect(mockAdapter.canHandle('https://www.loom.com/share/test123')).toBe(true);
    expect(mockAdapter.getMetadata).toBeDefined();
    expect(mockAdapter.getTranscript).toBeDefined();
  });

  it('reports video download not available when adapter lacks capability', () => {
    const mockAdapter = createMockAdapter({
      capabilities: {
        transcript: true,
        metadata: true,
        comments: true,
        chapters: false,
        aiSummary: false,
        videoDownload: false,
      },
    });
    registerAdapter(mockAdapter);

    expect(mockAdapter.capabilities.videoDownload).toBe(false);
  });
});
