/* ============================================================
   SwimLens — Shared components & icons
   Exports to window: Icons, StatusPill, DemoBanner, SettingsModal, Lightbox, Header, FilePreviewMedia
   ============================================================ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ----------------------------------------------------------------
// Icons (minimal stroke icons)
// ----------------------------------------------------------------
const Icons = {
  Gear: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Upload: (p) => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  X: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Eye: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Check: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Arrow: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Link: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Play: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  ),
  Image: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Download: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Sparkles: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
    </svg>
  )
};

// ----------------------------------------------------------------
// StatusPill
// ----------------------------------------------------------------
function StatusPill({ live }) {
  return (
    <div className={`status-pill ${live ? "status-pill--live" : "status-pill--demo"}`}>
      <span className="status-pill__dot"></span>
      {live ? "Live · Claude API" : "Demo Mode"}
    </div>
  );
}

// ----------------------------------------------------------------
// Header
// ----------------------------------------------------------------
function Header({ live, view, setView, galleryCount, onSettings }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand__mark"></div>
        <div>
          <div className="brand__word">Swim<em>lens</em></div>
          <div className="brand__sub">Issue 04 · Stroke Lab</div>
        </div>
      </div>
      <nav className="nav">
        <button className="nav__btn" aria-current={view === "analyze" ? "page" : undefined} onClick={() => setView("analyze")}>Analyze</button>
        <button className="nav__btn" aria-current={view === "upload" ? "page" : undefined} onClick={() => setView("upload")}>Upload</button>
        <button className="nav__btn" aria-current={view === "gallery" ? "page" : undefined} onClick={() => setView("gallery")}>
          Gallery{galleryCount > 0 ? <span className="count">{galleryCount}</span> : null}
        </button>
      </nav>
      <div className="header__actions">
        <StatusPill live={live} />
        <button className="icon-btn" title="Settings" onClick={onSettings}><Icons.Gear /></button>
      </div>
    </header>
  );
}

// ----------------------------------------------------------------
// Demo banner
// ----------------------------------------------------------------
function DemoBanner({ onSettings, onDismiss }) {
  return (
    <div className="banner">
      <span className="banner__tag">Demo Mode</span>
      <span>You're seeing simulated coaching feedback. Add an Anthropic API key to unlock real Claude analysis on your own footage.</span>
      <button className="banner__cta" onClick={onSettings}>Add API Key</button>
      <button className="banner__close" onClick={onDismiss} aria-label="Dismiss"><Icons.X /></button>
    </div>
  );
}

// ----------------------------------------------------------------
// Settings Modal
// ----------------------------------------------------------------
function SettingsModal({ open, onClose, initialKey, model, setModel, onKeyChange }) {
  const [key, setKey] = useState(initialKey || "");
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState(null); // null | testing | ok | err
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    if (open) {
      setKey(initialKey || "");
      setTestState(null);
      setTestMsg("");
    }
  }, [open, initialKey]);

  if (!open) return null;

  async function handleTest() {
    setTestState("testing");
    setTestMsg("");
    try {
      await window.SwimAPI.testKey(key, model);
      setTestState("ok");
      setTestMsg("Connection OK");
    } catch (e) {
      setTestState("err");
      if (e.status === 401) setTestMsg("Invalid key (401)");
      else if (e.status === 429) setTestMsg("Rate limited (429)");
      else setTestMsg(e.message || "Connection failed");
    }
  }

  function handleSave() {
    try {
      if (key.trim()) {
        localStorage.setItem("swimlens_api_key", key.trim());
      } else {
        localStorage.removeItem("swimlens_api_key");
      }
      localStorage.setItem("swimlens_model", model);
    } catch (e) {}
    onKeyChange(key.trim());
    onClose();
  }

  function handleClear() {
    setKey("");
    try { localStorage.removeItem("swimlens_api_key"); } catch (e) {}
    onKeyChange("");
    setTestState(null);
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <h2 className="modal__title">Set<em>tings</em></h2>
            <p className="modal__sub">API Key · Model Selection</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close"><Icons.X /></button>
        </div>
        <div className="modal__body">
          <div className="field">
            <div className="field__label">
              <span>Anthropic API Key</span>
              <span style={{ color: key ? "var(--good)" : "var(--ink-faint)" }}>
                {key ? "✓ Saved locally" : "Not set"}
              </span>
            </div>
            <div className="field__input-wrap">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-..."
                spellCheck={false}
                autoComplete="off"
              />
              <button className="field__eye" onClick={() => setShowKey(!showKey)} aria-label="Toggle visibility">
                {showKey ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
            <p className="field__hint">
              Stored only in <code>localStorage</code>. The key is sent directly from your browser to <code>api.anthropic.com</code> — never to any other server. Get one at <code>console.anthropic.com</code>.
            </p>
            <div className="test-row">
              <button className="btn-test" onClick={handleTest} disabled={!key || testState === "testing"}>
                {testState === "testing" ? "Testing…" : "Test connection"}
              </button>
              {testState === "ok" && (
                <span className="test-result test-result--ok"><Icons.Check /> {testMsg}</span>
              )}
              {testState === "err" && (
                <span className="test-result test-result--err">✕ {testMsg}</span>
              )}
            </div>
          </div>

          <div className="field">
            <div className="field__label"><span>Model</span></div>
            <div className="model-grid">
              <button
                className="model-opt"
                aria-pressed={model === "claude-opus-4-7"}
                onClick={() => setModel("claude-opus-4-7")}
              >
                <div className="model-opt__name">Opus 4.7</div>
                <div className="model-opt__desc">Deepest analysis. Slower, more expensive.</div>
              </button>
              <button
                className="model-opt"
                aria-pressed={model === "claude-sonnet-4-6"}
                onClick={() => setModel("claude-sonnet-4-6")}
              >
                <div className="model-opt__name">Sonnet 4.6</div>
                <div className="model-opt__desc">Fast & balanced. Recommended for most footage.</div>
              </button>
            </div>
          </div>
        </div>
        <div className="modal__actions">
          {key && (
            <button className="btn-secondary" onClick={handleClear} style={{ marginRight: "auto" }}>
              Clear Key
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Lightbox
// ----------------------------------------------------------------
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!src) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <img className="lightbox__img" src={src} alt="Frame" />
      <button className="lightbox__close" onClick={onClose}><Icons.X /></button>
    </div>
  );
}

// ----------------------------------------------------------------
// YouTube URL helpers
// ----------------------------------------------------------------
function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([A-Za-z0-9_-]{11})/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function isYouTubeUrl(url) {
  return !!getYouTubeId(url);
}

// ----------------------------------------------------------------
// Generic file media (image or video) preview
// ----------------------------------------------------------------
function FilePreviewMedia({ file, url, type }) {
  const ytId = url ? getYouTubeId(url) : null;

  const src = useMemo(() => {
    if (ytId) return null; // handled separately via iframe
    if (url) return url;
    if (file) return URL.createObjectURL(file);
    return null;
  }, [file, url, ytId]);

  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: "100%", height: "100%", border: 0, borderRadius: 6 }}
        title="YouTube preview"
      />
    );
  }

  if (!src) return null;
  if (type === "video") {
    return <video src={src} controls playsInline muted />;
  }
  return <img src={src} alt="" />;
}

Object.assign(window, {
  Icons, StatusPill, Header, DemoBanner, SettingsModal, Lightbox, FilePreviewMedia,
  getYouTubeId, isYouTubeUrl
});
