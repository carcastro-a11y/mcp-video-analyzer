---
name: swimlens-frontend
description: Guide for editing the SwimLens web app (Swim Analysis App folder). Use when reading, editing, or adding features to any file inside "Swim Analysis App/". Covers stack, file roles, API layer, config flow, and deployment.
---

# SwimLens Frontend Guide

## Stack

Pure static site — **no build step, no npm, no bundler**.

- **React 18** loaded from CDN (`esm.sh`)
- **Babel Standalone** transpiles JSX in the browser at runtime
- **Vanilla JS** for the API layer (`api.js`)
- **CSS** in `styles.css` (no framework, no Tailwind)

Entry point: `index.html` loads every script in order via `<script type="text/babel">` or plain `<script>`. Vercel serves `index.html` directly — root directory is `Swim Analysis App/`.

---

## File map

| File | Role |
|---|---|
| `index.html` | Entry point. Loads CDN scripts then all local files in dependency order. |
| `api.js` | All Claude API calls, frame extraction, dedup, taxonomy, prompts. Exports `window.SwimAPI`. |
| `app.jsx` | Root React component. Owns all state. Wires InputPanel + ConfigPanel + analysis flow. |
| `input.jsx` | `InputPanel` (drop zone, URL input) and `ConfigPanel` (stroke, focus, angle, swimmer, frames). Exports constants to `window`. |
| `components.jsx` | Shared UI: `Header`, `SettingsModal`, `Lightbox`, loading states. |
| `analysis.jsx` | `AnalysisPanel` — renders the structured result (observe, strengths, drills, summary). |
| `gallery.jsx` | `GalleryView` + `GalleryDetailModal` — saved analyses in localStorage. |
| `styles.css` | All styles. Uses CSS custom properties (`--c-*` prefix for colors). |
| `vercel.json` | CORS header for browser-direct Anthropic API calls. |

---

## Window globals pattern

Because there is no module system, files share state through `window`:

```javascript
// api.js exports:
window.SwimAPI = { analyze, testKey, extractFrames, parseResult, makeMockFrame, getKey, getModel, isLive }

// input.jsx exports constants React components use:
window.CAMERA_ANGLES = [...]
window.FOCUSES = [...]
window.STROKES = [...]
```

`index.html` must load `api.js` before `app.jsx`, and `input.jsx` before any component that reads those constants.

---

## Config state (app.jsx)

```javascript
const [config, setConfig] = useState({
  stroke: "freestyle",          // "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "auto"
  focus: ["arm_entry", ...],    // array of focus area keys (see FOCUSES in input.jsx)
  detail: "standard",           // "brief" | "standard" | "detailed"
  frames: 12,                   // max frames (effective count derived from stroke cycle fps)
  cameraAngle: "deck_side",     // "overhead" | "deck_side" | "underwater"
  swimmer: ""                   // free-text swimmer description (optional)
});
```

Config flows: `ConfigPanel` → `setConfig` → `runAnalysis` → `opts` → `SwimAPI.analyze(opts)`.

---

## API layer (api.js)

### Key constants
```javascript
STROKE_CYCLE_FPS = { breaststroke: 1.2, butterfly: 1.2, backstroke: 1.5, freestyle: 2.0, auto: 1.5 }
SWIM_TAXONOMY = [ /* 6 entries: timing-001, wide-pull-002, sinking-hips-005,
                    breath-timing-006, catch-003, head-position-004 */ ]
```

Each taxonomy entry has: `id`, `stroke`, `title`, `detectableFrom`, `focusAreas`, `description`, `cause`, `fix`, `drill`.

### Filtering chain
```javascript
getTaxonomyForStrokeAndAngle(stroke, cameraAngle)  // by stroke + detectableFrom
  → getTaxonomyByFocusAreas(entries, focus)         // by focusAreas overlap
  → formatTaxonomyForPrompt(entries)                // → taxonomy section in system prompt
```

### Prompt building
```javascript
buildSystemPrompt(stroke, cameraAngle, focus)  // expert coach + angle restrictions + taxonomy
buildUserPrompt(opts)                          // stroke, focus areas, angle label, swimmer line
```

### Frame extraction
```javascript
extractFrames(file, count, onProgress, stroke)
// - computes effectiveCount = min(count, ceil(duration × STROKE_CYCLE_FPS[stroke]))
// - seeks to evenly-spaced timestamps using hidden <video> element + canvas
```

### Dedup
```javascript
deduplicateWebFrames(frames, threshold=8)
// - draws each frame to 8×8 canvas, computes grayscale pixel array
// - drops consecutive frames where mean pixel diff < threshold (0–255 scale)
// - runs inside liveAnalyze before frames are base64-encoded for Claude
```

### Live vs demo mode
- **Live**: `localStorage.getItem("swimlens_api_key")` is set → calls `https://api.anthropic.com/v1/messages` directly from browser
- **Demo**: no key → `mockAnalyze()` returns static mock data after fake delays

---

## Adding a new config option

1. Add the constant array to `input.jsx` (follow `CAMERA_ANGLES` pattern) and export to `window`
2. Add the selector row to `ConfigPanel` in `input.jsx`
3. Add the field to `config` state in `app.jsx` with a default value
4. Pass it in `opts` inside `runAnalysis` in `app.jsx`
5. Read `opts.newField` in `buildUserPrompt` or `buildSystemPrompt` in `api.js`

---

## Adding a new result section

1. Add a new `<section>` to `AnalysisPanel` in `analysis.jsx`
2. Add parsing logic in `parseResult()` in `api.js` (splits markdown on `### ` headers)
3. Update `buildSystemPrompt` output format instructions to include the new `### Header`
4. Update mock data in `MOCK_DATA` in `api.js` to include the new section

---

## Deployment

- Vercel project root: `Swim Analysis App/`
- Entry point: `index.html` (Vercel serves this by default)
- No build command, no output directory
- Every `git push origin main` auto-redeploys
- `vercel.json` sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` for browser-direct API calls

---

## Key constraints

- **No `import`/`export`** — everything is global or on `window`
- **No `async` at top level** — wrap in functions
- **Babel transpiles JSX at runtime** — syntax errors show in browser console, not terminal
- **localStorage** for API key (`swimlens_api_key`), model (`swimlens_model`), gallery (`swimlens_gallery`)
- **Cross-origin video URLs** are unreliable — the app falls back to mock frames for URL-only input
- **SWIM_TAXONOMY in api.js must stay in sync with src/data/swim-taxonomy.ts** — they are separate copies
