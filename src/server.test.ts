import { describe, it, expect, afterEach } from 'vitest';
import { clearAdapters } from './adapters/adapter.interface.js';
import { createServer } from './server.js';

afterEach(() => {
  clearAdapters();
});

describe('createServer', () => {
  it('creates a FastMCP server instance', () => {
    const server = createServer();
    expect(server).toBeDefined();
  });
});
