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
// Results View
// ----------------------------------------------------------------
function ResultsView({ result, frames, isVideo, config, mode, model, tokens, onNew, onSaveExport, onOpenFrame }) {
  const sections = useMemo(() => window.SwimAPI.parseResult(result.markdown), [result.markdown]);

  const strokeLabel = useMemo(() => {
    const s = STROKES.find(x => x.key === config.stroke);
    return s ? s.label : "Freestyle";
  }, [config.stroke]);

  return (
    <div className="results fade-in">
      <div className="results__main">
        <div className="results__header">
          <div>
            <div className="results__eyebrow">
              <span>Coaching Report</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{strokeLabel}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{mode === "live" ? "Live · Claude" : "Demo Output"}</span>
            </div>
            <h2 className="results__title">
              Technique <em>read</em>
            </h2>
          </div>
          <div className="results__meta">
            <strong>{new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
            {model && model !== "demo" ? `${model}` : "Simulated output"}
            {tokens ? ` · ${tokens.toLocaleString()} tokens` : ""}
          </div>
        </div>

        <div className="result-body">
          {sections.observe && (
            <section className="result-section result-section--observe">
              <div className="result-section__head">
                <span className="result-section__num">§ 01</span>
                <h3 className="result-section__title">What I <em>observe</em></h3>
              </div>
              <p className="result-prose result-prose--lede">{sections.observe}</p>
            </section>
          )}

          {sections.strengths.length > 0 && (
            <section className="result-section result-section--strengths">
              <div className="result-section__head">
                <span className="result-section__num">§ 02</span>
                <h3 className="result-section__title">Strengths</h3>
              </div>
              <ul className="result-list result-list--strengths">
                {sections.strengths.map((s, i) => (<li key={i}><span></span>{s}</li>))}
              </ul>
            </section>
          )}

          {sections.improve.length > 0 && (
            <section className="result-section result-section--improve">
              <div className="result-section__head">
                <span className="result-section__num">§ 03</span>
                <h3 className="result-section__title">Areas for <em>improvement</em></h3>
              </div>
              <ul className="result-list result-list--improve">
                {sections.improve.map((s, i) => (<li key={i}><span></span>{s}</li>))}
              </ul>
            </section>
          )}

          {sections.drills.length > 0 && (
            <section className="result-section result-section--drills">
              <div className="result-section__head">
                <span className="result-section__num">§ 04</span>
                <h3 className="result-section__title">Recommended <em>drills</em></h3>
              </div>
              <ol className="result-list result-list--drills">
                {sections.drills.map((s, i) => (<li key={i}><span></span>{s}</li>))}
              </ol>
            </section>
          )}

          {sections.summary && (
            <section className="result-section result-section--summary">
              <div className="result-section__head">
                <span className="result-section__num">§ 05</span>
                <h3 className="result-section__title">Summary</h3>
              </div>
              <p className="result-summary">{sections.summary}</p>
            </section>
          )}
        </div>
      </div>

      <aside className="rail">
        <div className="rail-card">
          <div className="rail-card__head">
            <h3>{isVideo ? "Extracted Frames" : "Source Image"}</h3>
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
              <div className="scoreboard__label">Stroke</div>
              <div className="scoreboard__value" style={{ fontSize: 20 }}>{strokeLabel}</div>
            </div>
            <div className="scoreboard__item">
              <div className="scoreboard__label">Frames</div>
              <div className="scoreboard__value">{frames.length}<small>/{frames.length}</small></div>
            </div>
            <div className="scoreboard__item">
              <div className="scoreboard__label">{mode === "live" ? "Tokens" : "Mode"}</div>
              <div className="scoreboard__value" style={{ fontSize: 20 }}>
                {mode === "live" ? (tokens || 0).toLocaleString() : "Demo"}
              </div>
            </div>
            <div className="scoreboard__item">
              <div className="scoreboard__label">Focus</div>
              <div className="scoreboard__value" style={{ fontSize: 20 }}>{(config.focus || []).length || "—"}</div>
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
            <p style={{ margin: 0, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18, lineHeight: 1.4, color: "var(--ink)" }}>
              This analysis was filed to your gallery automatically. Open the gallery to revisit, compare, and re-export.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

Object.assign(window, { AnalysisProgress, ResultsView });
