/* ============================================================
   SwimLens — Gallery view + slide-over detail
   Exports: GalleryView, GalleryDetail
   ============================================================ */

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function GalleryView({ items, onOpen, onDelete, onClearAll, setView }) {
  const [sort, setSort] = useState("recent");
  const [filterStroke, setFilterStroke] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [filterFocus, setFilterFocus] = useState("all");

  const filtered = useMemo(() => {
    let out = [...items];
    if (filterStroke !== "all") out = out.filter(i => i.stroke === filterStroke);
    if (filterMode !== "all") out = out.filter(i => i.mode === filterMode);
    if (filterFocus !== "all") out = out.filter(i => (i.focus || []).includes(filterFocus));
    if (sort === "recent") out.sort((a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt));
    else if (sort === "stroke") out.sort((a, b) => (a.stroke || "").localeCompare(b.stroke || ""));
    return out;
  }, [items, sort, filterStroke, filterMode, filterFocus]);

  return (
    <div>
      <div className="section__head">
        <span className="section__num">§ <em>02</em></span>
        <div>
          <h2 className="section__title">The <em>archive</em></h2>
          <p className="section__sub">Every analysis you've run, filed and searchable.</p>
        </div>
        <div className="section__aside">
          <strong>{items.length} entries</strong>
          stored locally in this browser
        </div>
      </div>

      <div className="gallery-toolbar">
        <div className="gallery-toolbar__group">
          <span className="gallery-toolbar__label">Stroke</span>
          <select value={filterStroke} onChange={(e) => setFilterStroke(e.target.value)}>
            <option value="all">All</option>
            {STROKES.filter(s => s.key !== "auto").map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="gallery-toolbar__group">
          <span className="gallery-toolbar__label">Focus</span>
          <select value={filterFocus} onChange={(e) => setFilterFocus(e.target.value)}>
            <option value="all">All</option>
            {FOCUSES.map(f => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="gallery-toolbar__group">
          <span className="gallery-toolbar__label">Mode</span>
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
            <option value="all">All</option>
            <option value="live">Live</option>
            <option value="demo">Demo</option>
          </select>
        </div>
        <div className="gallery-toolbar__group">
          <span className="gallery-toolbar__label">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Most recent</option>
            <option value="stroke">By stroke</option>
          </select>
        </div>
        <div className="gallery-toolbar__spacer"></div>
        {items.length > 0 && (
          <button className="gallery-toolbar__clear" onClick={onClearAll}>
            <Icons.Trash style={{ verticalAlign: "-2px", marginRight: 4 }} /> Clear All
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="gallery-empty">
          <h3>No analyses <em>yet</em></h3>
          <p>{items.length === 0 ? "Run your first analysis to start your archive." : "Try adjusting the filters above."}</p>
          {items.length === 0 && (
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setView("analyze")}>
              Start an Analysis
            </button>
          )}
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map(item => (
            <GalleryCard key={item.id} item={item} onOpen={() => onOpen(item)} onDelete={() => onDelete(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryCard({ item, onOpen, onDelete }) {
  const stroke = STROKES.find(s => s.key === item.stroke);
  const strokeLabel = stroke ? stroke.label : item.stroke;
  const focusLabels = (item.focus || []).slice(0, 3).map(f => {
    const def = FOCUSES.find(x => x.key === f);
    return def ? def.label : f;
  });
  const excerpt = useMemo(() => {
    const s = window.SwimAPI.parseResult(item.result);
    return s.summary || s.observe || "";
  }, [item.result]);

  return (
    <div className="gallery-card" onClick={onOpen}>
      <div className="gallery-card__media">
        <img src={item.thumbnail} alt="" />
        <div className={`gallery-card__badge ${item.mode === "live" ? "gallery-card__badge--live" : ""}`}>
          {item.mode}
        </div>
        <div className="stroke-label">{strokeLabel}</div>
      </div>
      <div className="gallery-card__body">
        <div className="gallery-card__date">{timeAgo(item.analyzedAt)} · {item.type === "video" ? `${(item.frames || []).length} frames` : "Photo"}</div>
        <div className="gallery-card__excerpt">{excerpt}</div>
        <div className="gallery-card__tags">
          {focusLabels.map(f => (<span key={f}>{f}</span>))}
        </div>
      </div>
      <div className="gallery-card__foot" onClick={(e) => e.stopPropagation()}>
        <button className="gallery-card__btn" onClick={onOpen}>Open</button>
        <button className="gallery-card__btn" onClick={() => exportItem(item)}>
          <Icons.Download style={{ verticalAlign: "-2px" }} /> Export
        </button>
        <button className="gallery-card__btn gallery-card__btn--del" onClick={onDelete}>
          <Icons.Trash style={{ verticalAlign: "-2px" }} /> Delete
        </button>
      </div>
    </div>
  );
}

function exportItem(item) {
  const stroke = STROKES.find(s => s.key === item.stroke);
  const strokeLabel = stroke ? stroke.label : item.stroke;
  const focusLabels = (item.focus || []).map(f => {
    const d = FOCUSES.find(x => x.key === f);
    return d ? d.label : f;
  }).join(", ");
  const content = [
    `SwimLens · Coaching Report`,
    `============================`,
    `Date:    ${new Date(item.analyzedAt).toLocaleString()}`,
    `Stroke:  ${strokeLabel}`,
    `Focus:   ${focusLabels || "—"}`,
    `Mode:    ${item.mode}${item.model && item.model !== "demo" ? ` (${item.model})` : ""}`,
    `Tokens:  ${item.tokensUsed || "—"}`,
    ``,
    item.result,
    ``
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `swimlens-${item.stroke}-${item.id.slice(0, 6)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// ----------------------------------------------------------------
// Gallery detail (slide-over)
// ----------------------------------------------------------------
function GalleryDetail({ item, onClose, onOpenFrame }) {
  if (!item) return null;
  const stroke = STROKES.find(s => s.key === item.stroke);
  const strokeLabel = stroke ? stroke.label : item.stroke;
  const sections = window.SwimAPI.parseResult(item.result);

  return (
    <React.Fragment>
      <div className="slide-over-bg" onClick={onClose}></div>
      <aside className="slide-over">
        <div style={{ padding: "28px 36px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--azure-deep)", marginBottom: 8 }}>
              Archived · {new Date(item.analyzedAt).toLocaleString()}
            </div>
            <h2 className="results__title">{strokeLabel} <em>read</em></h2>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)", marginTop: 8 }}>
              {item.mode === "live" ? "Live · Claude" : "Demo Output"}
              {item.model && item.model !== "demo" ? ` · ${item.model}` : ""}
              {item.tokensUsed ? ` · ${item.tokensUsed.toLocaleString()} tokens` : ""}
            </div>
          </div>
          <button className="modal__close" onClick={onClose}><Icons.X /></button>
        </div>

        {item.frames && item.frames.length > 0 && (
          <div style={{ padding: "20px 36px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {item.frames.map((f, i) => (
                <div key={i} className="frame-cell" onClick={() => onOpenFrame(f.dataUrl)}>
                  <img src={f.dataUrl} alt={`Frame ${i + 1}`} />
                  <span className="frame-cell__time">{f.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="result-body" style={{ marginTop: 20 }}>
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

        <div style={{ padding: 24, borderTop: "1px solid var(--line)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={() => exportItem(item)}>
            <Icons.Download style={{ verticalAlign: "-2px", marginRight: 6 }} /> Export (.txt)
          </button>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </aside>
    </React.Fragment>
  );
}

Object.assign(window, { GalleryView, GalleryDetail, exportItem });
