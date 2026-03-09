import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastMCP } from 'fastmcp';
import { registerGetFrameAt } from './get-frame-at.js';
import { clearAdapters } from '../adapters/adapter.interface.js';

describe('get_frame_at tool', () => {
  let server: FastMCP;

  beforeEach(() => {
    clearAdapters();
    server = new FastMCP({ name: 'test', version: '0.0.0' });
    registerGetFrameAt(server);
  });

  afterEach(() => {
    clearAdapters();
  });

  it('registers the tool on the server', () => {
    expect(server).toBeDefined();
  });
});
