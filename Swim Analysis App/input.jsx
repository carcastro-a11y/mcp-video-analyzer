/* ============================================================
   SwimLens — Input + Config panel
   Exports: InputPanel, ConfigPanel
   ============================================================ */

const STROKES = [
  { key: "auto", label: "Auto-detect" },
  { key: "freestyle", label: "Freestyle" },
  { key: "backstroke", label: "Backstroke" },
  { key: "breaststroke", label: "Breast" },
  { key: "butterfly", label: "Butterfly" }
];

const CAMERA_ANGLES = [
  { key: "overhead", label: "Overhead" },
  { key: "deck_side", label: "Deck / Side" },
  { key: "underwater", label: "Underwater" }
];

const FOCUSES = [
  { key: "arm_entry", label: "Arm Entry" },
  { key: "pull_phase", label: "Pull Phase" },
  { key: "kick", label: "Kick" },
  { key: "body_rotation", label: "Body Rotation" },
  { key: "head_position", label: "Head Position" },
  { key: "breathing", label: "Breathing" },
  { key: "turn", label: "Turn" },
  { key: "start", label: "Start" },
  { key: "overall", label: "Overall" }
];

const VIDEO_EXTS = ["mp4", "webm", "mov", "m4v", "ogv"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];

function detectType(name, mime) {
  const ext = (name || "").split(".").pop().toLowerCase();
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (mime && mime.startsWith("video/")) return "video";
  if (mime && mime.startsWith("image/")) return "image";
  return null;
}

function humanSize(bytes) {
  if (!bytes) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes > 1024 && i < u.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(bytes < 10 ? 1 : 0)} ${u[i]}`;
}

// ----------------------------------------------------------------
// Input panel — drop zone + URL + tips
// ----------------------------------------------------------------
function InputPanel({ file, setFile, url, setUrl, type, setType, mediaPreviewUrl, setMediaPreviewUrl, notes, onNotesChange }) {
  const [dragActive, setDragActive] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef(null);

  function handleFiles(files) {
    if (!files || !files[0]) return;
    const f = files[0];
    const t = detectType(f.name, f.type);
    if (!t) {
      alert("Please upload a video (mp4, webm, mov) or image (jpg, png, gif, webp).");
      return;
    }
    setFile(f);
    setType(t);
    setUrl("");
    setMediaPreviewUrl("");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleUrlSubmit() {
    if (!urlDraft) return;
    // Try to detect from URL
    const t = detectType(urlDraft, "");
    setFile(null);
    setUrl(urlDraft);
    setType(t || "video");
    setMediaPreviewUrl(urlDraft);
  }

  function clearMedia() {
    setFile(null);
    setUrl("");
    setType(null);
    setMediaPreviewUrl("");
    setUrlDraft("");
  }

  const hasMedia = !!(file || url);

  return (
    <div className="input-grid">
      <div
        className={`dropzone ${dragActive ? "dropzone--active" : ""} ${hasMedia ? "dropzone--has-file" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !hasMedia && fileInputRef.current?.click()}
      >
        {!hasMedia ? (
          <React.Fragment>
            <div className="dropzone__icon"><Icons.Upload /></div>
            <h3 className="dropzone__title">Drop footage <em>here</em></h3>
            <p className="dropzone__sub">Drag a video or photo, or click to browse. Files stay in your browser — nothing is uploaded except to Claude.</p>
            <div className="dropzone__formats">
              <span>mp4</span><span>webm</span><span>mov</span><span>jpg</span><span>png</span><span>webp</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="video/*,image/*"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </React.Fragment>
        ) : (
          <div className="preview">
            <div className="preview__media">
              <div className="preview__chrome">
                {type === "video" ? "Video Source" : "Photo Source"}
              </div>
              <FilePreviewMedia file={file} url={mediaPreviewUrl} type={type} />
            </div>
            <div className="preview__info">
              <div className="preview__name">
                {file ? file.name : url}
              </div>
              <div className="preview__size">
                {file ? humanSize(file.size) : "remote URL"}
              </div>
              <button className="preview__clear" onClick={clearMedia}>Replace</button>
            </div>
          </div>
        )}
      </div>

      <div className="input-side">
        <div className="url-box">
          <div className="url-box__label">Or paste a URL</div>
          <div className="url-box__row">
            <input
              className="url-box__input"
              type="text"
              placeholder="https://example.com/swim.mp4"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <button className="url-box__btn" onClick={handleUrlSubmit} disabled={!urlDraft}>
              Load
            </button>
          </div>
        </div>

        <div className="url-box">
          <div className="url-box__label">Analysis notes</div>
          <textarea
            className="url-box__input"
            rows={3}
            style={{ width: "100%", resize: "vertical", lineHeight: 1.5 }}
            placeholder="Describe the swimmer or what to focus on — e.g. lane 4, blue cap and blue suit; focus on the breathing phase and hip position"
            value={notes || ""}
            onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
          />
        </div>

        <div className="tip">
          <div className="tip__num">01</div>
          <div className="tip__head">How it works</div>
          <h4 className="tip__title">1 fps scan, <em>then a burst</em></h4>
          <p className="tip__body">Your clip is scanned one frame per second. The algorithm detects where the biggest technique changes happen — catch, breath, kick — and grabs a rapid 8 fps burst around each moment for a close look.</p>
        </div>

        <div className="tip" style={{ background: "linear-gradient(135deg, #fff, #dfeefe)" }}>
          <div className="tip__num">02</div>
          <div className="tip__head">What gets sent to Claude</div>
          <h4 className="tip__title">Only the <em>key moments</em></h4>
          <p className="tip__body">Not every frame makes the cut — only the ones where something meaningful is happening. Claude then reads each flagged burst against proven breaststroke technique and tells you exactly what it sees.</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Config panel — breaststroke-only: swimmer identifier + CTA
// Stroke, focus, camera angle, and frame count are all determined
// automatically — no user selection needed.
// ----------------------------------------------------------------
function ConfigPanel({ type, config, setConfig, canAnalyze, onAnalyze, model, live }) {
  const isVideo = type === "video";
  function setKey(k, v) { setConfig({ ...config, [k]: v }); }

  return (
    <div className="config">
      <div className="config__row">
        <div className="config__label">
          <span className="config__label-tag">01 · Swimmer</span>
          <span className="config__label-title">Focus on <em>who</em></span>
        </div>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            className="url-box__input"
            style={{ maxWidth: 400 }}
            placeholder="e.g. lane 4, blue cap and blue suit (optional)"
            value={config.swimmer || ""}
            onChange={(e) => setKey("swimmer", e.target.value)}
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.4 }}>
            If multiple swimmers are in frame, describe the one to analyze. Leave blank to analyze the most visible swimmer.
          </p>
        </div>
      </div>

      <div className="cta-row">
        <div className="cta-row__model">
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Model</div>
          <div><strong>{model === "claude-opus-4-7" ? "Opus 4.7" : "Sonnet 4.6"}</strong> · {live ? "Live" : "Demo"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
            Breaststroke · Full technique · Auto camera detection
          </div>
        </div>
        <button className="btn-analyze" onClick={onAnalyze} disabled={!canAnalyze}>
          <span>Analyze {isVideo ? "Video" : "Photo"}</span>
          <span className="btn-analyze__arrow"><Icons.Arrow /></span>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  InputPanel, ConfigPanel, STROKES, FOCUSES, CAMERA_ANGLES, detectType
});
