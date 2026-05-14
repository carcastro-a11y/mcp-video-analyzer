/* ============================================================
   SwimLens — Analysis Progress + Results view
   Exports: AnalysisProgress, ResultsView
   ============================================================ */

const STAGE_DEFS = [
  { key: "preparing", label: "Extracting Frames" },
  { key: "sending", label: "Sending to Claude" },
  { key: "building", label: "Building Report" }
];

// ----------------------------------------------------------------
// AnalysisProgress — shows stage progress + live frame strip
// ----------------------------------------------------------------
function AnalysisProgress({ stage, frames, framesTarget, error, onRetry, onCancel, isVideo, stroke }) {
  const stageIdx = STAGE_DEFS.findIndex(s => s.key === stage);
  const overallPct = stage === "done" ? 100 :
    Math.min(95, Math.max(5,
      stageIdx === 0 ? (frames.length / Math.max(framesTarget, 1)) * 33 :
      stageIdx === 1 ? 33 + 33 :
      stageIdx === 2 ? 80 : 5
    ));

  // Pre-fill empty slots
  const slotCount = isVideo ? framesTarget : 4;
  const slots = [];
  for (let i = 0; i < slotCount; i++) {
    slots.push(frames[i] || null);
  }

  return (
    <div className="progress-card fade-in">
      <div className="progress-left">
        <div>
          <div className="progress-left__tag">Analysis in progress</div>
          <h2 className="progress-left__title">
            Reading <em>technique</em>
          </h2>
        </div>

        <div className="stages">
          {STAGE_DEFS.map((s, i) => {
            const cls = i < stageIdx || stage === "done" ? "stage--done" :
                        i === stageIdx ? "stage--active" : "stage--pending";
            return (
              <div key={s.key} className={`stage ${cls}`}>
                <div className="stage__bullet">
                  {i < stageIdx || stage === "done" ? <Icons.Check style={{ width: 12, height: 12 }} /> : (i + 1)}
                </div>
                <div className="stage__label">{s.label}</div>
                <div className="stage__time">
                  {i < stageIdx || stage === "done" ? "Done" : i === stageIdx ? "Running…" : "Pending"}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="notice notice--err">
            <div className="notice__icon">!</div>
            <div>
              <strong>{error.title}</strong>
              <div style={{ marginTop: 2, opacity: 0.85 }}>{error.message}</div>
            </div>
            <button onClick={onRetry}>Retry</button>
          </div>
        )}
      </div>

      <div className="progress-right">
        <div className="progress-right__head">
          <span className="live">{isVideo ? "Extracting Frames" : "Reading Image"}</span>
          <span>{frames.length} / {isVideo ? framesTarget : 1}</span>
        </div>
        <div className="frame-strip" style={{ gridTemplateColumns: `repeat(${Math.min(slotCount, 5)}, 1fr)` }}>
          {slots.map((f, i) => (
            <div key={i} className={`frame-thumb ${f ? "" : "frame-thumb--loading"}`}>
              {f && (
                <React.Fragment>
                  <img src={f.dataUrl} alt={`Frame ${i + 1}`} />
                  <span className="frame-thumb__time">{f.timestamp}</span>
                </React.Fragment>
              )}
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${overallPct}%` }}></div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// AnalyzedFramesGrid — full-width photo grid shown below the analysis
// ----------------------------------------------------------------
function FrameFilmstrip({ frames, onOpenFrame }) {
  if (!frames || frames.length === 0) return null;
  return (
    <div className="analyzed-frames">
      <div className="analyzed-frames__head">
        <div>
          <span className="analyzed-frames__label">Analyzed Frames</span>
          <span className="analyzed-frames__sublabel">
            Frames extracted and sent to Claude · click any to expand full size
          </span>
        </div>
        <span className="analyzed-frames__count">{frames.length}</span>
      </div>
      <div className="analyzed-frames__grid">
        {frames.map((f, i) => (
          <button
            key={i}
            className="analyzed-frames__thumb"
            onClick={() => onOpenFrame(f.dataUrl)}
            title={`Frame ${i + 1} — ${f.timestamp}`}
          >
            <img src={f.dataUrl} alt={`Frame ${i + 1}`} />
            <span className="analyzed-frames__time">{f.timestamp}</span>
            <span className="analyzed-frames__num">#{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const ANGLE_LABELS = {
  overhead:   { label: "Overhead",    icon: "↓", note: "Body silhouette, hip level, phase timing" },
  deck_side:  { label: "Deck / Side", icon: "→", note: "Body line, head position, breathing timing" },
  underwater: { label: "Underwater",  icon: "↑", note: "Catch mechanics, pull path, kick" }
};

// ----------------------------------------------------------------
// Results View — 3-card layout: Strengths / Fix These / Drills
// ----------------------------------------------------------------
function ResultsView({ result, frames, isVideo, config, mode, model, tokens, onNew, onSaveExport, onOpenFrame }) {
  const sections = useMemo(() => window.SwimAPI.parseResult(result.markdown), [result.markdown]);
  const angleInfo = sections.cameraAngle ? ANGLE_LABELS[sections.cameraAngle] : null;

  return (
    <div className="results fade-in">
      <div className="results__main">
        <div className="results__header">
          <div>
            <div className="results__eyebrow">
              <span>Coaching Report</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>Breaststroke</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{mode === "live" ? "Live · Claude" : "Demo Output"}</span>
            </div>
            <h2 className="results__title">Technique <em>read</em></h2>
          </div>
          <div className="results__meta">
            <strong>{new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
            {model && model !== "demo" ? model : "Simulated output"}
            {tokens ? ` · ${tokens.toLocaleString()} tokens` : ""}
          </div>
        </div>

        {angleInfo && (
          <div className="angle-badge">
            <span className="angle-badge__icon">{angleInfo.icon}</span>
            <div>
              <span className="angle-badge__label">{angleInfo.label} view detected</span>
              <span className="angle-badge__note">{angleInfo.note}</span>
            </div>
          </div>
        )}

        <div className="report-grid">
          {sections.strengths.length > 0 && (
            <div className="report-card report-card--strengths">
              <div className="report-card__head">
                <div className="report-card__icon report-card__icon--strengths">✓</div>
                <h3 className="report-card__title">Strengths</h3>
              </div>
              <ul className="report-card__list">
                {sections.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {sections.improve.length > 0 && (
            <div className="report-card report-card--improve">
              <div className="report-card__head">
                <div className="report-card__icon report-card__icon--improve">!</div>
                <h3 className="report-card__title">Fix These</h3>
              </div>
              <ul className="report-card__list">
                {sections.improve.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {sections.drills.length > 0 && (
            <div className="report-card report-card--drills">
              <div className="report-card__head">
                <div className="report-card__icon report-card__icon--drills">#</div>
                <h3 className="report-card__title">Drills</h3>
              </div>
              <ol className="report-card__list report-card__list--ordered">
                {sections.drills.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}
        </div>

        {sections.summary && (
          <div className="coaching-note">
            <span className="coaching-note__label">Coaching Note</span>
            <p className="coaching-note__text">{sections.summary}</p>
          </div>
        )}

        <FrameFilmstrip frames={frames} onOpenFrame={onOpenFrame} />
      </div>

      <aside className="rail">
        <div className="rail-card">
          <div className="rail-card__head">
            <h3>{isVideo ? "Analyzed Frames" : "Source Image"}</h3>
            <span>{frames.length}</span>
          </div>
          {frames.length > 0 ? (
            <div className="frame-grid">
              {frames.map((f, i) => (
                <div key={i} className="frame-cell" onClick={() => onOpenFrame(f.dataUrl)}>
                  <img src={f.dataUrl} alt={`Frame ${i + 1}`} />
                  <span className="frame-cell__time">{f.timestamp}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, color: "var(--ink-faint)", fontSize: 12 }}>No frames captured.</div>
          )}
          <div className="scoreboard">
            <div className="scoreboard__item">
              <div className="scoreboard__label">Frames</div>
              <div className="scoreboard__value">{frames.length}</div>
            </div>
            <div className="scoreboard__item">
              <div className="scoreboard__label">Angle</div>
              <div className="scoreboard__value" style={{ fontSize: 14 }}>
                {angleInfo ? angleInfo.label : "—"}
              </div>
            </div>
            <div className="scoreboard__item">
              <div className="scoreboard__label">{mode === "live" ? "Tokens" : "Mode"}</div>
              <div className="scoreboard__value" style={{ fontSize: 16 }}>
                {mode === "live" ? (tokens || 0).toLocaleString() : "Demo"}
              </div>
            </div>
          </div>
        </div>

        <div className="rail-card">
          <div className="rail-card__head"><h3>Actions</h3><span></span></div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn-primary" onClick={onNew} style={{ width: "100%", padding: "12px" }}>
              New Analysis
            </button>
            <button className="btn-secondary" onClick={onSaveExport} style={{ width: "100%", padding: "12px" }}>
              <Icons.Download style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Export Report (.txt)
            </button>
          </div>
        </div>

        <div className="rail-card" style={{ background: "linear-gradient(135deg, var(--paper), var(--pale-2))" }}>
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--azure-deep)", marginBottom: 10 }}>
              Saved
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, lineHeight: 1.4, color: "var(--ink)" }}>
              Filed to your gallery automatically. Revisit, compare, and export any time.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

Object.assign(window, { AnalysisProgress, ResultsView });
