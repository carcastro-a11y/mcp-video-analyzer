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
          <div className="tip__head">Capture Tip</div>
          <h4 className="tip__title">Side view, <em>2 lengths</em></h4>
          <p className="tip__body">Film from the side at water level for the cleanest read on body line, breath timing, and hip rotation.</p>
        </div>

        <div className="tip" style={{ background: "linear-gradient(135deg, #fff, #dfeefe)" }}>
          <div className="tip__num">02</div>
          <div className="tip__head">For Best Results</div>
          <h4 className="tip__title">8–12 frames, <em>not more</em></h4>
          <p className="tip__body">Claude reads each frame carefully. More frames isn't always better — pick a focused window.</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Config panel — stroke, focus, camera angle, swimmer, detail, frames, CTA
// ----------------------------------------------------------------
function ConfigPanel({ type, config, setConfig, canAnalyze, onAnalyze, model, live }) {
  const isVideo = type === "video";

  function setKey(k, v) { setConfig({ ...config, [k]: v }); }

  function toggleFocus(key) {
    const cur = config.focus || [];
    if (cur.includes(key)) {
      setKey("focus", cur.filter(x => x !== key));
    } else {
      setKey("focus", [...cur, key]);
    }
  }

  return (
    <div className="config">
      <div className="config__row">
        <div className="config__label">
          <span className="config__label-tag">01 · Stroke</span>
          <span className="config__label-title">Which <em>stroke</em></span>
        </div>
        <div className="seg">
          {STROKES.map(s => (
            <button
              key={s.key}
              className="seg__btn"
              aria-pressed={config.stroke === s.key}
              onClick={() => setKey("stroke", s.key)}
            >{s.label}</button>
          ))}
        </div>
      </div>

      <div className="config__row">
        <div className="config__label">
          <span className="config__label-tag">02 · Focus Areas</span>
          <span className="config__label-title">What to <em>watch</em></span>
        </div>
        <div className="chips">
          {FOCUSES.map(f => (
            <button
              key={f.key}
              className="chip"
              aria-pressed={(config.focus || []).includes(f.key)}
              onClick={() => toggleFocus(f.key)}
            >
              <span className="chip__check"><Icons.Check style={{ width: 8, height: 8 }} /></span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="config__row">
        <div className="config__label">
          <span className="config__label-tag">03 · Camera Angle</span>
          <span className="config__label-title">How <em>filmed</em></span>
        </div>
        <div className="seg">
          {CAMERA_ANGLES.map(a => (
            <button
              key={a.key}
              className="seg__btn"
              aria-pressed={config.cameraAngle === a.key}
              onClick={() => setKey("cameraAngle", a.key)}
            >{a.label}</button>
          ))}
        </div>
      </div>

      <div className="config__row">
        <div className="config__label">
          <span className="config__label-tag">04 · Swimmer</span>
          <span className="config__label-title">Focus on <em>who</em></span>
        </div>
        <input
          type="text"
          className="url-box__input"
          style={{ maxWidth: 340 }}
          placeholder="e.g. lane 4, blue cap and blue suit (optional)"
          value={config.swimmer || ""}
          onChange={(e) => setKey("swimmer", e.target.value)}
        />
      </div>

      {isVideo && (
        <React.Fragment>
          <div className="config__row">
            <div className="config__label">
              <span className="config__label-tag">05 · Detail Level</span>
              <span className="config__label-title">How <em>deep</em></span>
            </div>
            <div className="seg">
              {["brief", "standard", "detailed"].map(d => (
                <button
                  key={d}
                  className="seg__btn"
                  aria-pressed={config.detail === d}
                  onClick={() => setKey("detail", d)}
                >{d}</button>
              ))}
            </div>
          </div>

          <div className="config__row">
            <div className="config__label">
              <span className="config__label-tag">06 · Frame Count</span>
              <span className="config__label-title">Frames <em>extracted</em></span>
            </div>
            <div className="slider">
              <input
                type="range"
                min="4"
                max="20"
                step="1"
                value={config.frames}
                onChange={(e) => setKey("frames", parseInt(e.target.value))}
              />
              <div className="slider__value">
                {config.frames}
                <small>FRAMES</small>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}

      <div className="cta-row">
        <div className="cta-row__model">
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Model</div>
          <div><strong>{model === "claude-opus-4-7" ? "Opus 4.7" : "Sonnet 4.6"}</strong> · {live ? "Live" : "Demo"}</div>
        </div>
        <div></div>
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
