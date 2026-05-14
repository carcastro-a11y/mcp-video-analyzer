/* ============================================================
   SwimLens — Root app
   Glues together header, input, config, analysis, results, gallery, settings
   ============================================================ */

const GALLERY_KEY = "swimlens_gallery";

function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function App() {
  // ---- Persistent state ----
  const [apiKey, setApiKey] = useState(() => {
    try {return localStorage.getItem("swimlens_api_key") || "";} catch (e) {return "";}
  });
  const [model, setModel] = useState(() => {
    try {return localStorage.getItem("swimlens_model") || "claude-opus-4-7";} catch (e) {return "claude-opus-4-7";}
  });
  useEffect(() => {
    try {localStorage.setItem("swimlens_model", model);} catch (e) {}
  }, [model]);
  const live = !!apiKey;

  // ---- View routing ----
  const [view, setView] = useState("analyze"); // analyze | gallery
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);

  // ---- Input state ----
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [type, setType] = useState(null);

  // ---- Config state ----
  // Stroke, focus, cameraAngle, and frame count are fixed — only swimmer and notes are user-editable.
  const [config, setConfig] = useState({
    stroke: "breaststroke",
    focus: ["overall"],
    detail: "standard",
    swimmer: "",
    notes: ""
  });

  // ---- Analysis state ----
  const [phase, setPhase] = useState("idle"); // idle | analyzing | done
  const [stage, setStage] = useState("preparing");
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ---- Lightbox ----
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // ---- Gallery ----
  const [gallery, setGallery] = useState(() => {
    try {return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");} catch (e) {return [];}
  });
  const [detailItem, setDetailItem] = useState(null);

  function saveGallery(next) {
    setGallery(next);
    try {localStorage.setItem(GALLERY_KEY, JSON.stringify(next));} catch (e) {}
  }

  // ---- Run analysis ----
  async function runAnalysis() {
    if (!file && !url) return;
    setPhase("analyzing");
    setStage("preparing");
    setExtractedFrames([]);
    setResult(null);
    setError(null);

    try {
      let frames = [];
      const isVideo = type === "video";

      if (isVideo) {
        if (file) {
          // Real extraction from uploaded file — frame count governed by two-phase algorithm
          frames = await window.SwimAPI.extractFrames(file, 20, (i, total, f) => {
            if (f) setExtractedFrames((prev) => [...prev, f]);
          }, "breaststroke");
        } else {
          // URL provided — generate mock frames since cross-origin video is unreliable
          for (let i = 0; i < 10; i++) {
            const f = window.SwimAPI.makeMockFrame(i, 10, "breaststroke");
            await new Promise((r) => setTimeout(r, 90));
            setExtractedFrames((prev) => [...prev, f]);
            frames.push(f);
          }
        }
      } else {
        // Photo — single "frame" from image
        if (file) {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          frames = [{ timestamp: "0:00", t: 0, dataUrl }];
          setExtractedFrames(frames);
        } else {
          frames = [{ timestamp: "0:00", t: 0, dataUrl: url }];
          setExtractedFrames(frames);
        }
      }

      // Inject mock frames in demo mode when file path failed too
      if (!live && frames.length === 0) {
        for (let i = 0; i < (isVideo ? 10 : 1); i++) {
          const f = window.SwimAPI.makeMockFrame(i, 10, "breaststroke");
          frames.push(f);
          setExtractedFrames((prev) => [...prev, f]);
          await new Promise((r) => setTimeout(r, 80));
        }
      }

      const opts = {
        type: isVideo ? "video" : "photo",
        file,
        frames,
        stroke: "breaststroke",
        focus: ["overall"],
        detail: "standard",
        swimmer: config.swimmer || undefined,
        notes: config.notes || undefined
      };
      const out = await window.SwimAPI.analyze(opts, setStage);
      setResult(out);
      setStage("done");
      setPhase("done");

      // Save to gallery
      const thumb = frames[0] ? frames[0].dataUrl : "";
      const item = {
        id: uuid(),
        type: isVideo ? "video" : "photo",
        thumbnail: thumb,
        stroke: "breaststroke",
        focus: ["overall"],
        analyzedAt: new Date().toISOString(),
        result: out.markdown,
        frames: frames.slice(0, 8).map((f) => ({ timestamp: f.timestamp, dataUrl: f.dataUrl })),
        mode: out.mode,
        model: out.model,
        tokensUsed: out.tokens
      };
      saveGallery([item, ...gallery]);
    } catch (e) {
      console.error(e);
      let title = "Analysis failed";
      let message = e.message || "Something went wrong. Try again?";
      if (e.status === 401) {
        title = "Invalid API key";
        message = "Open settings and verify your Anthropic key.";
        setSettingsOpen(true);
      } else if (e.status === 429) {
        title = "Rate limited";
        message = "Claude API is rate-limiting you. Wait a moment and retry.";
      } else if (!navigator.onLine) {
        title = "Network offline";
        message = "Reconnect and retry.";
      }
      setError({ title, message });
    }
  }

  function newAnalysis() {
    setPhase("idle");
    setStage("preparing");
    setExtractedFrames([]);
    setResult(null);
    setError(null);
    setFile(null);
    setUrl("");
    setMediaPreviewUrl("");
    setType(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleKeyChange(newKey) {
    setApiKey(newKey);
  }

  const canAnalyze = (!!file || !!url) && phase !== "analyzing";
  const hasInput = !!file || !!url;

  return (
    <div className="page">
      <div className="container">
        <Header
          live={live}
          view={view}
          setView={setView}
          galleryCount={gallery.length}
          onSettings={() => setSettingsOpen(true)} />
        

        {!live && bannerOpen && view === "analyze" &&
        <DemoBanner
          onSettings={() => setSettingsOpen(true)}
          onDismiss={() => setBannerOpen(false)} />

        }

        {view === "analyze" && phase === "idle" &&
        <React.Fragment>
            <Masthead live={live} />

            <CommonMistakes />

            <HowItWorks />

            <section className="section">
              <div className="section__head">
                <span className="section__num">§ <em>03</em></span>
                <div>
                  <h2 className="section__title">Ready to <em>analyze</em></h2>
                  <p className="section__sub">Breaststroke technique read — full coverage, camera angle auto-detected.</p>
                </div>
                <div className="section__aside">
                  {hasInput ?
                <React.Fragment>
                      <strong>{type === "video" ? "Video" : "Photo"} loaded</strong>
                      {type === "video" ? "1fps scan + burst at key moments" : "Single-frame analysis"}
                    </React.Fragment> :

                <React.Fragment>
                      <strong>No footage yet</strong>
                      Drop a clip on the Upload tab
                    </React.Fragment>
                }
                </div>
              </div>

              {hasInput ?
            <ConfigPanel
              type={type}
              config={config}
              setConfig={setConfig}
              canAnalyze={canAnalyze}
              onAnalyze={runAnalysis}
              model={model}
              live={live} /> :


            <UploadPrompt onGo={() => setView("upload")} />
            }
            </section>
          </React.Fragment>
        }

        {view === "upload" &&
        <section className="section">
            <div className="section__head">
              <span className="section__num">§ <em>01</em></span>
              <div>
                <h2 className="section__title">Drop in your <em>footage</em></h2>
                <p className="section__sub">A side-view clip or a clean still — both work. Multi-second video is best.</p>
              </div>
              <div className="section__aside">
                <strong>Local-first</strong>
                Your file never leaves the browser except to Claude
              </div>
            </div>

            <InputPanel
            file={file}
            setFile={setFile}
            url={url}
            setUrl={setUrl}
            type={type}
            setType={setType}
            mediaPreviewUrl={mediaPreviewUrl}
            setMediaPreviewUrl={setMediaPreviewUrl}
            notes={config.notes}
            onNotesChange={(v) => setConfig({ ...config, notes: v })} />
          

            {hasInput &&
          <div className="upload-continue">
                <div className="upload-continue__text">
                  <strong>Footage loaded.</strong> Head to <em>Analyze</em> to set the read and run it.
                </div>
                <button className="btn-analyze" onClick={() => setView("analyze")}>
                  <span>Continue</span>
                  <span className="btn-analyze__arrow"><Icons.Arrow /></span>
                </button>
              </div>
          }
          </section>
        }

        {view === "analyze" && phase === "analyzing" &&
        <section className="section">
            <div className="section__head">
              <span className="section__num">§ <em>03</em></span>
              <div>
                <h2 className="section__title">Running the <em>read</em></h2>
                <p className="section__sub">Frames extracting, prompt building, Claude reviewing.</p>
              </div>
              <div className="section__aside">
                <strong>{live ? "Live" : "Demo"}</strong>
                {live ? model : "Simulated coach output"}
              </div>
            </div>
            <AnalysisProgress
            stage={stage}
            frames={extractedFrames}
            framesTarget={type === "video" ? Math.max(extractedFrames.length, 8) : 1}
            error={error}
            isVideo={type === "video"}
            stroke={config.stroke}
            onRetry={runAnalysis}
            onCancel={newAnalysis} />
          
          </section>
        }

        {view === "analyze" && phase === "done" && result &&
        <section className="section">
            <div className="section__head">
              <span className="section__num">§ <em>03</em></span>
              <div>
                <h2 className="section__title">The <em>report</em></h2>
                <p className="section__sub">Read the coach's notes. Open frames full-size. Export anytime.</p>
              </div>
              <div className="section__aside">
                <strong>{result.mode === "live" ? "Live" : "Demo"}</strong>
                {result.model && result.model !== "demo" ? result.model : "Mock"}
              </div>
            </div>
            <ResultsView
            result={result}
            frames={extractedFrames}
            isVideo={type === "video"}
            config={config}
            mode={result.mode}
            model={result.model}
            tokens={result.tokens}
            onNew={newAnalysis}
            onSaveExport={() => {
              if (gallery[0]) exportItem(gallery[0]);
            }}
            onOpenFrame={(src) => setLightboxSrc(src)} />
          
          </section>
        }

        {view === "gallery" &&
        <section className="section">
            <GalleryView
            items={gallery}
            setView={setView}
            onOpen={(item) => setDetailItem(item)}
            onDelete={(id) => {
              if (!confirm("Delete this analysis from your gallery?")) return;
              saveGallery(gallery.filter((g) => g.id !== id));
            }}
            onClearAll={() => {
              if (!confirm("Clear all gallery items? This cannot be undone.")) return;
              saveGallery([]);
            }} />
          
          </section>
        }

        <footer className="foot">
          <div>SwimLens · <strong>Stroke analysis</strong>, in your browser</div>
          <div>{live ? "Connected · Live" : "Demo Mode"} · v0.1</div>
        </footer>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialKey={apiKey}
        model={model}
        setModel={setModel}
        onKeyChange={handleKeyChange} />
      
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      {detailItem &&
      <GalleryDetail
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onOpenFrame={(src) => setLightboxSrc(src)} />

      }
    </div>);

}

// ----------------------------------------------------------------
// Masthead — editorial cover for the analyze view
// ----------------------------------------------------------------
function Masthead({ live }) {
  return (
    <section className="masthead">
      <div className="masthead__left">
        <h1 className="masthead__title">
          Swim<br />
          <em>better.</em><br />
          Frame<br />
          <span style={{ color: "var(--azure)" }}>by frame.</span>
        </h1>
      </div>
      <div className="masthead__right">
        <div className="masthead__promo">
          <p className="masthead__lede">
            A pocket-sized coaching room. Drop a clip, pick a stroke, get <em>specific, actionable</em> feedback grounded in what the camera actually saw.
          </p>
          <ul className="masthead__bullets">
            <li><span></span><div></div></li>
            <li><span></span><div></div></li>
            <li><span></span><div></div></li>
          </ul>
        </div>
      </div>
    </section>);

}

// ----------------------------------------------------------------
// Common Mistakes — editorial list of things SwimLens looks for
// ----------------------------------------------------------------
const MISTAKES = [
{ title: "Poor Pull-Kick Timing", note: "Arms and legs fighting each other instead of working as one chain." },
{ title: "Pulling Arms Too Wide — or Too Far Back", note: "A pull that drifts outside the shoulder line or sweeps past the hip leaks power." },
{ title: "Sinking Hips, Poor Body Position", note: "Hips dropping below the surface turns every stroke into uphill work." },
{ title: "Breathing at the Wrong Moment", note: "Lifting the head, or breathing into the recovery, breaks the body line." },
{ title: "Poor Catch Mechanics", note: "A dropped elbow or flat hand at the front of the stroke wastes the strongest phase." }];


function CommonMistakes() {
  return (
    <section className="section">
      <div className="section__head">
        <span className="section__num">§ <em>01</em></span>
        <div>
          <h2 className="section__title">Five common <em>mistakes</em></h2>
          <p className="section__sub">The patterns the read keeps an eye on — in every clip, every stroke.</p>
        </div>
        <div className="section__aside">
          <strong>Field notes</strong>
          From thousands of frames
        </div>
      </div>
      <ol className="mistakes">
        {MISTAKES.map((m, i) =>
        <li key={i} className="mistakes__item">
            <div className="mistakes__num">{String(i + 1).padStart(2, "0")}</div>
            <div className="mistakes__body">
              <h3 className="mistakes__title">{m.title}</h3>
              <p className="mistakes__note">{m.note}</p>
            </div>
            <div className="mistakes__rule" aria-hidden="true"></div>
          </li>
        )}
      </ol>
    </section>);

}

// ----------------------------------------------------------------
// How It Works — three-step explainer with subtle animated icons
// ----------------------------------------------------------------
function FilmStripIcon() {
  return (
    <svg className="hiw-icon hiw-icon--strip" viewBox="0 0 80 56" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="72" height="36" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <g className="hiw-strip__sprockets">
        {Array.from({ length: 9 }).map((_, i) =>
        <rect key={i} x={6 + i * 8} y="5" width="4" height="3" rx="0.6" fill="currentColor" opacity="0.55" />
        )}
      </g>
      <g className="hiw-strip__sprockets">
        {Array.from({ length: 9 }).map((_, i) =>
        <rect key={i} x={6 + i * 8} y="48" width="4" height="3" rx="0.6" fill="currentColor" opacity="0.55" />
        )}
      </g>
      <g className="hiw-strip__frames">
        <rect x="10" y="16" width="18" height="24" rx="1" fill="currentColor" opacity="0.12" />
        <rect x="31" y="16" width="18" height="24" rx="1" fill="currentColor" opacity="0.12" />
        <rect x="52" y="16" width="18" height="24" rx="1" fill="currentColor" opacity="0.12" />
      </g>
      <rect className="hiw-strip__scanner" x="10" y="14" width="2" height="28" fill="currentColor" />
    </svg>);

}

function FlagPinIcon() {
  return (
    <svg className="hiw-icon hiw-icon--flag" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <line x1="14" y1="6" x2="14" y2="50" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14" cy="50" r="2.4" fill="currentColor" />
      <path className="hiw-flag__cloth" d="M14 8 L40 14 L34 22 L40 30 L14 24 Z" fill="currentColor" opacity="0.85" />
      <circle className="hiw-flag__ping" cx="14" cy="50" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>);

}

function MagnifierIcon() {
  return (
    <svg className="hiw-icon hiw-icon--lens" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <g className="hiw-lens__group">
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
        <line x1="34" y1="34" x2="48" y2="48" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <line className="hiw-lens__scan" x1="15" y1="24" x2="33" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      </g>
    </svg>);

}

const HIW_STEPS = [
{
  num: "01",
  title: "We scan your video",
  body: "We go through your clip one frame at a time — like flipping through a flipbook — and look at every single moment of your stroke.",
  Icon: FilmStripIcon
},
{
  num: "02",
  title: "We flag the key moments",
  body: "Our coach spots the exact frames where important technique is happening — your catch, your breath, your kick — and marks them for a closer look.",
  Icon: FlagPinIcon
},
{
  num: "03",
  title: "We zoom in and analyze",
  body: "Around each flagged moment we grab a rapid burst of frames to capture the full movement, then weigh them against proven technique and give you specific feedback.",
  Icon: MagnifierIcon
}];


function HowItWorks() {
  return (
    <section className="section">
      <div className="section__head">
        <span className="section__num">§ <em>02</em></span>
        <div>
          <h2 className="section__title">How it <em>works</em></h2>
          <p className="section__sub">Three steps. Under twenty seconds. No jargon.</p>
        </div>
        <div className="section__aside">
          <strong>For first-timers</strong>
          Skim and you're set
        </div>
      </div>
      <ol className="hiw">
        {HIW_STEPS.map((s, i) =>
        <li key={i} className="hiw__card">
            <div className="hiw__num">{s.num}</div>
            <div className="hiw__icon-wrap"><s.Icon /></div>
            <h3 className="hiw__title">{s.title}</h3>
            <p className="hiw__body">{s.body}</p>
            {i < HIW_STEPS.length - 1 && <div className="hiw__connector" aria-hidden="true"></div>}
          </li>
        )}
      </ol>
    </section>);

}

// ----------------------------------------------------------------
// UploadPrompt — inline CTA when no footage has been loaded yet
// ----------------------------------------------------------------
function UploadPrompt({ onGo }) {
  return (
    <div className="upload-prompt">
      <div className="upload-prompt__num">— 04</div>
      <div className="upload-prompt__body">
        <div className="upload-prompt__tag">Next step</div>
        <h3 className="upload-prompt__title">No <em>footage</em> yet</h3>
        <p className="upload-prompt__sub">Drop a clip on the Upload tab — then come back here to set the read.</p>
      </div>
      <button className="btn-analyze" onClick={onGo}>
        <span>Go to Upload</span>
        <span className="btn-analyze__arrow"><Icons.Arrow /></span>
      </button>
    </div>);

}

// ---- Tweaks Panel ----
function SwimTweaks({ tweaks, setTweak }) {
  if (!window.TweaksPanel) return null;
  const { TweaksPanel, TweakSection, TweakRadio } = window;
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakRadio
        label="Variant"
        value={tweaks.variant}
        options={["light", "deeper"]}
        onChange={(v) => setTweak("variant", v)} />
      
    </TweaksPanel>);

}

// ----------------------------------------------------------------
// Mount
// ----------------------------------------------------------------
function Root() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "variant": "light"
  } /*EDITMODE-END*/;
  const t = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const tweaks = t[0];
  const setTweak = t[1];

  useEffect(() => {
    if (tweaks.variant) document.body.dataset.variant = tweaks.variant;
  }, [tweaks.variant]);

  return (
    <React.Fragment>
      <App />
      <SwimTweaks tweaks={tweaks} setTweak={setTweak} />
    </React.Fragment>);

}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Root />);