import { FastMCP } from 'fastmcp';
import { registerAdapter } from './adapters/adapter.interface.js';
import { LoomAdapter } from './adapters/loom.adapter.js';
import { DirectAdapter } from './adapters/direct.adapter.js';
import { registerAnalyzeVideo } from './tools/analyze-video.js';
import { registerGetFrameAt } from './tools/get-frame-at.js';
import { registerGetFrameBurst } from './tools/get-frame-burst.js';

export function createServer(): FastMCP {
  const server = new FastMCP({
    name: 'mcp-video-analyzer',
    version: '0.1.0',
    instructions: `Video analysis MCP server. Extracts transcripts, key frames, metadata, comments, and chapters from video URLs.

IMPORTANT: When a user shares a video URL (loom.com/share/..., .mp4, .webm, .mov), ALWAYS call analyze_video automatically — do not ask for confirmation. Videos contain critical visual information that cannot be understood from text alone. Frames are essential to fully understand what the video shows.

Supported platforms:
- Loom (loom.com/share/...) — transcript, metadata, comments, frames (no auth needed)
- Direct video URLs (.mp4, .webm, .mov) — frame extraction, duration probing

Tools:
- analyze_video: Full analysis — ALWAYS include frames (do NOT set skipFrames unless the user explicitly asks for transcript-only). Use threshold=0.1 for screencasts/demos, 0.3 for live-action video.
- get_frame_at: Extract a single frame at a specific timestamp — use after reading the transcript to inspect a critical moment.
- get_frame_burst: Extract N frames across a narrow time range — use for motion, animations, or fast-changing content where scene detection misses changes.

Workflow tips:
1. Start with analyze_video to get the full picture (transcript + frames + metadata).
2. Read the transcript to identify critical moments.
3. Use get_frame_at to inspect specific moments that need closer examination.
4. Use get_frame_burst if the user reports motion/animation issues (e.g., "flickering", "shaking", "animation bug").`,
  });

  // Register adapters (order matters: more specific first)
  registerAdapter(new LoomAdapter());
  registerAdapter(new DirectAdapter());

  // Register tools
  registerAnalyzeVideo(server);
  registerGetFrameAt(server);
  registerGetFrameBurst(server);

  return server;
}
