# mcp-video-analyzer

MCP server for video analysis — extracts transcripts, key frames, and metadata from video URLs. Supports Loom, direct video files (.mp4, .webm), and more.

No existing video MCP combines **transcripts + visual frames + metadata** in one tool. This one does.

## Quick Start

```bash
# One-command install for Claude Code
claude mcp add video-analyzer npx mcp-video-analyzer@latest
```

Or manually add to your MCP config (Claude Desktop, Cursor, VS Code):

```json
{
  "mcpServers": {
    "video-analyzer": {
      "command": "npx",
      "args": ["mcp-video-analyzer@latest"]
    }
  }
}
```

## Tools

### `analyze_video` — Full video analysis

Extracts everything from a video URL in one call:

```
> Analyze this video: https://www.loom.com/share/abc123...
```

Returns:
- **Transcript** with timestamps and speakers
- **Key frames** extracted via scene-change detection (automatically deduplicated)
- **OCR text** extracted from frames (code, error messages, UI text visible on screen)
- **Annotated timeline** merging transcript + frames + OCR into a unified "what happened when" view
- **Metadata** (title, duration, platform)
- **Comments** from viewers
- **Chapters** and **AI summary** (when available)

The AI will **automatically** call this tool when it sees a video URL — no need to ask.

Options:
- `maxFrames` (1-50, default 20) — cap on extracted frames
- `threshold` (0.0-1.0, default 0.1) — scene-change sensitivity. Use 0.1 for screencasts/demos, 0.3 for live-action video
- `skipFrames` (boolean) — skip frame extraction for transcript-only analysis (not recommended — frames are critical for understanding)

### `get_frame_at` — Single frame at a timestamp

```
> Show me the frame at 1:23 in this video
```

The AI reads the transcript, spots a critical moment, and requests the exact frame to see what's on screen.

### `get_frame_burst` — N frames in a time range

```
> Show me 10 frames between 0:15 and 0:17 of this video
```

For motion, vibration, animations, or fast scrolling — burst mode captures N frames in a narrow window so the AI can see frame-by-frame changes.

## Supported Platforms

| Platform | Transcript | Metadata | Comments | Frames | Auth |
|----------|:----------:|:--------:|:--------:|:------:|:----:|
| **Loom** | Yes | Yes | Yes | Yes | None |
| **Direct URL** (.mp4, .webm) | No | Duration only | No | Yes | None |

### Frame Extraction Strategies

Frame extraction uses a two-strategy fallback chain — no single dependency is required:

| Strategy | How it works | Speed | Requirements |
|----------|-------------|-------|-------------|
| **yt-dlp + ffmpeg** (primary) | Downloads video, extracts frames via scene detection | Fast, precise | [yt-dlp](https://github.com/yt-dlp/yt-dlp) (`pip install yt-dlp`) |
| **Browser** (fallback) | Opens video in headless Chrome, seeks to timestamps, takes screenshots | Slower, no download needed | Chrome or Chromium installed |

The fallback is automatic — if yt-dlp is not available, the server tries browser-based extraction via `puppeteer-core`. If neither is available, analysis still returns transcript + metadata + comments, just no frames.

### Post-Processing Pipeline

After frame extraction, the pipeline automatically applies:

| Step | What it does | Why |
|------|-------------|-----|
| **Frame deduplication** | Removes near-identical consecutive frames using perceptual hashing (dHash + Hamming distance) | Screencasts often have long static moments — dedup removes redundant frames, saving tokens |
| **OCR** | Extracts text visible on screen from each frame (via tesseract.js) | Captures code, error messages, terminal output, UI text that the transcript doesn't cover |
| **Annotated timeline** | Merges transcript timestamps + frame timestamps + OCR text into a single chronological view | Gives the AI a unified "what was said, what changed visually, and what text appeared" at each moment |

The OCR step requires `tesseract.js` (included as a dependency). If it fails to load, analysis continues without OCR — no frames or transcript are lost.

## Complementary Tools

### Chrome DevTools MCP

For **live web debugging** alongside video analysis, pair this server with the [Chrome DevTools MCP](https://github.com/anthropics/anthropic-quickstarts/tree/main/mcp-devtools):

```bash
claude mcp add chrome-devtools npx @anthropic-ai/mcp-devtools@latest
```

**When to use each:**

| Scenario | Tool |
|----------|------|
| Bug report recorded as a Loom video | `mcp-video-analyzer` — extract transcript, frames, and error text from the recording |
| Live debugging a web page | Chrome DevTools MCP — inspect DOM, console, network, take screenshots |
| Video shows UI issue, need to reproduce it | Use both: analyze the video first, then open the page in Chrome DevTools to reproduce |

The two MCPs complement each other: video analyzer understands **recorded** content, DevTools interacts with **live** pages.

## Sample Output

### analyze_video with a Loom URL (skipFrames: true)

```json
{
  "metadata": {
    "platform": "loom",
    "title": "Bug: Cart total not updating",
    "description": "Demonstrating the cart total bug on the checkout page",
    "duration": 154.5,
    "durationFormatted": "2:34",
    "url": "https://www.loom.com/share/abc123..."
  },
  "transcript": [
    { "time": "0:05", "text": "So when I click add to cart..." },
    { "time": "0:12", "text": "The total stays at zero..." },
    { "time": "0:18", "speaker": "Guilherme", "text": "Let me show you the console..." }
  ],
  "comments": [
    { "author": "John", "text": "This also happens on mobile", "time": "0:12" },
    { "author": "Sarah", "text": "Confirmed on iOS Safari too" }
  ],
  "ocrResults": [
    { "time": "0:18", "text": "TypeError: Cannot read property 'total' of undefined", "confidence": 92 }
  ],
  "timeline": [
    { "time": "0:05", "seconds": 5, "transcript": "So when I click add to cart...", "frameIndex": 0 },
    { "time": "0:12", "seconds": 12, "transcript": "The total stays at zero...", "frameIndex": 1 },
    { "time": "0:18", "seconds": 18, "transcript": "Let me show you the console...", "frameIndex": 2, "ocrText": "TypeError: Cannot read property 'total' of undefined" }
  ],
  "frameCount": 3,
  "warnings": []
}
```

### get_frame_at with a direct video URL

Returns the frame as an inline image that the AI can see and analyze.

## Development

```bash
# Install dependencies
npm install

# Run all checks (format, lint, typecheck, knip, tests)
npm run check

# Build
npm run build

# Run E2E tests (requires network)
npm run test:e2e

# Open MCP Inspector for manual testing
npm run inspect
```

## Architecture

```
src/
├── index.ts                    # Entry point (shebang + stdio)
├── server.ts                   # FastMCP server + tool registration
├── tools/                      # MCP tool definitions
│   ├── analyze-video.ts
│   ├── get-frame-at.ts
│   └── get-frame-burst.ts
├── adapters/                   # Platform-specific logic
│   ├── adapter.interface.ts    # IVideoAdapter interface + registry
│   ├── loom.adapter.ts         # Loom: authless GraphQL
│   └── direct.adapter.ts      # Direct URL: any mp4/webm link
├── processors/                 # Shared processing
│   ├── frame-extractor.ts      # ffmpeg scene detection + extraction
│   ├── browser-frame-extractor.ts # Headless Chrome fallback for frames
│   ├── image-optimizer.ts      # sharp resize/compress
│   ├── frame-dedup.ts          # Perceptual dedup (dHash + Hamming distance)
│   ├── frame-ocr.ts            # OCR text extraction (tesseract.js)
│   └── annotated-timeline.ts   # Unified timeline (transcript + frames + OCR)
├── utils/
│   ├── url-detector.ts         # Platform detection from URL
│   ├── vtt-parser.ts           # WebVTT → transcript entries
│   └── temp-files.ts           # Temp directory management
└── types.ts                    # Shared TypeScript interfaces
```

## License

MIT
