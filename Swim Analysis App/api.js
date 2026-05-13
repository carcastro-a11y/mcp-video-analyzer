/* ============================================================
   SwimLens — API layer (Claude + mock)
   Exports: window.SwimAPI = { analyze, testKey, extractFrames }
   ============================================================ */

(function () {
  const STORAGE_KEY = "swimlens_api_key";
  const STORAGE_MODEL = "swimlens_model";

  function getKey() {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch (e) { return ""; }
  }
  function getModel() {
    try { return localStorage.getItem(STORAGE_MODEL) || "claude-opus-4-7"; } catch (e) { return "claude-opus-4-7"; }
  }

  // ----------------------------------------------------------------
  // Frame extraction from video
  // ----------------------------------------------------------------
  async function extractFrames(file, count, onProgress) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";

      const frames = [];
      let canvas, ctx;

      video.addEventListener("loadedmetadata", async () => {
        const duration = isFinite(video.duration) ? video.duration : 5;
        const w = Math.min(video.videoWidth || 1280, 1280);
        const h = Math.round(w * ((video.videoHeight || 720) / (video.videoWidth || 1280)));
        canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext("2d");

        for (let i = 0; i < count; i++) {
          const t = duration * ((i + 0.5) / count);
          try {
            await seekTo(video, t);
            ctx.drawImage(video, 0, 0, w, h);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
            const frame = {
              timestamp: formatTime(t),
              t,
              dataUrl
            };
            frames.push(frame);
            if (onProgress) onProgress(i + 1, count, frame);
          } catch (e) {
            console.warn("seek failed", e);
          }
        }
        URL.revokeObjectURL(url);
        resolve(frames);
      });
      video.addEventListener("error", () => reject(new Error("Video load failed")));
    });
  }

  function seekTo(video, t) {
    return new Promise((resolve) => {
      const onSeek = () => {
        video.removeEventListener("seeked", onSeek);
        // give canvas time
        requestAnimationFrame(() => resolve());
      };
      video.addEventListener("seeked", onSeek);
      video.currentTime = Math.max(0.001, Math.min(t, (video.duration || t) - 0.001));
    });
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // ----------------------------------------------------------------
  // File -> base64
  // ----------------------------------------------------------------
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.split(",")[1];
        resolve({ base64, mediaType: file.type || "image/jpeg" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function dataUrlToBase64(dataUrl) {
    const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
    if (!m) return null;
    return { mediaType: m[1], base64: m[2] };
  }

  // ----------------------------------------------------------------
  // Prompts
  // ----------------------------------------------------------------
  // Swim Taxonomy — ported from src/data/swim-taxonomy.ts
  // ----------------------------------------------------------------
  const SWIM_TAXONOMY = [
    {
      id: "breaststroke-timing-001",
      stroke: "breaststroke",
      title: "Poor Pull-Kick Timing",
      detectableFrom: ["overhead", "deck_side", "underwater"],
      description: "Pulling and kicking at the same time, or pausing during the breath instead of during the glide. Looks like treading water — lots of movement, very little forward progress.",
      cause: "Anxiety about breathing causes swimmers to rush getting their head up, triggering the kick too early. Also common in people who learned breaststroke casually and never separated the phases.",
      fix: 'Use the cue "Pull… breathe… kick… glide." The pause belongs in the glide, not in the breath.',
      drill: "2-kick-1-pull — do two kicks per arm cycle to force separation. Swim 4 x 25m with this pattern, 15 seconds rest between reps."
    },
    {
      id: "breaststroke-wide-pull-002",
      stroke: "breaststroke",
      title: "Pulling Arms Too Wide (or Too Far Back)",
      detectableFrom: ["deck_side", "underwater"],
      description: "Elbows sweep past the shoulders, arms go wide, or hands pull all the way to the hips. Looks powerful but creates a huge frontal area and kills forward momentum.",
      cause: "Swimmers assume bigger movements mean more power. Common in people stronger in freestyle who carry over a long pull habit.",
      fix: "Keep elbows in front of your shoulders at all times. Think of the pull as a heart shape, not a circle.",
      drill: "Forearm sculling — float face-down and scull with just forearms, keeping elbows nearly still. 4 x 25m."
    },
    {
      id: "breaststroke-sinking-hips-005",
      stroke: "breaststroke",
      title: "Sinking Hips and Poor Body Position",
      detectableFrom: ["overhead", "deck_side", "underwater"],
      description: "Hips sink low every stroke cycle. The body tilts close to vertical during the breath, then crashes back flat. Looks like fighting the water instead of riding on top of it.",
      cause: "Lifting the head too high during the breath (so hips drop to compensate), recovering arms too high above the surface, and weak core engagement.",
      fix: "Keep the breathing motion small. During arm recovery, hands push forward at or just below the surface.",
      drill: "Streamline kick on front (SLOF) — hold streamline, kick breaststroke, time your breathing lift without taking a pull. 4 x 25m."
    },
    {
      id: "breaststroke-breath-timing-006",
      stroke: "breaststroke",
      title: "Breathing at the Wrong Moment",
      detectableFrom: ["overhead", "deck_side"],
      description: "Head comes up with no arm support after the pull has already finished, so the whole body sinks. Or the swimmer holds their breath the entire cycle and exhales and inhales in one panicked burst.",
      cause: "Fear of not getting enough air. Beginners wait until the head is at its highest point before breathing, which is too late.",
      fix: 'Exhale steadily into the water during the glide. Start the inhale as soon as the outsweep begins. Cue: "Breathe WITH the pull, not AFTER the pull."',
      drill: "Practice standing in shallow water doing the arm motion and timing the breath without the pressure of actually swimming."
    },
    {
      id: "breaststroke-catch-003",
      stroke: "breaststroke",
      title: "Poor Catch Mechanics",
      detectableFrom: ["deck_side", "underwater"],
      description: "Elbows drop below the hands before any propulsive surface is established. Arms sweep too wide or too deep, slipping water rather than holding it. Looks like the arms are pushing down instead of pulling back.",
      cause: "Swimmers extend fully before bending the elbow, missing the early vertical forearm window. Common in people who learned breaststroke without coaching.",
      fix: 'Initiate the catch with the elbow high and outside. The forearm should be near-vertical before the pull begins. Think "elbows up, hands down" at the start of every pull.',
      drill: "Catch-up drill with fists closed — swim breaststroke with fists to force forearm engagement. 4 x 25m, 20 seconds rest."
    },
    {
      id: "freestyle-head-position-004",
      stroke: "freestyle",
      title: "Poor Head Position",
      detectableFrom: ["overhead", "deck_side", "underwater"],
      description: "Head lifted out of the water with eyes looking forward rather than down. Creates a seesaw effect — raised head at the front forces hips and legs to sink at the back.",
      cause: "Instinct to see where you are going. Anxiety about breathing causes swimmers to lift the head rather than rotate it.",
      fix: "Look at the pool floor, not the wall ahead. One goggle should stay submerged on the breath. Use the bow wave trough to breathe.",
      drill: "Catch-up drill — keep the crown of the head as the highest point at all times. 4 x 50m, breathing every 3 strokes, 20 seconds rest."
    }
  ];

  function getTaxonomyForStrokeAndAngle(stroke, cameraAngle) {
    let entries = stroke && stroke !== "auto"
      ? SWIM_TAXONOMY.filter(e => e.stroke === stroke)
      : SWIM_TAXONOMY;
    if (cameraAngle) {
      entries = entries.filter(e => e.detectableFrom.includes(cameraAngle));
    }
    return entries;
  }

  function formatTaxonomyForPrompt(entries) {
    if (!entries.length) return "";
    return entries.map(e =>
      `**${e.title}**\n` +
      `How it looks: ${e.description}\n` +
      `Why it happens: ${e.cause}\n` +
      `How to fix: ${e.fix}\n` +
      `Drill: ${e.drill}`
    ).join("\n\n");
  }

  // ----------------------------------------------------------------
  // Dynamic system prompt — camera-angle-aware + taxonomy-injected
  // ----------------------------------------------------------------
  function buildSystemPrompt(stroke, cameraAngle) {
    const base = `You are an expert swimming coach with deep knowledge of competitive technique across freestyle, backstroke, breaststroke, and butterfly. You analyze swimming video frames and photos with the eye of an Olympic-level technical coach.\n` +
      `Be precise about what you observe — reference body position, timing, and mechanics directly.\n` +
      `Structure your feedback clearly with strengths, areas for improvement, and specific drills to fix issues.`;

    let angleSection = "";
    if (cameraAngle === "overhead") {
      angleSection = `\n\n## Camera angle: ELEVATED WIDE-ANGLE (overhead)\n\n` +
        `At this distance swimmers occupy a small portion of the frame. Your analysis must be strictly limited to what is physically visible from this angle.\n\n` +
        `**WHAT YOU CAN ASSESS:**\n` +
        `- Body silhouette angle relative to the waterline (seesaw vs. flat body line)\n` +
        `- Hip level: whether hips are at, above, or visibly below the waterline\n` +
        `- Breath height: how far the swimmer's head/body rises above the surface during the breath\n` +
        `- Phase timing: visible glide pauses between stroke cycles vs. constant churning motion\n` +
        `- Wake pattern: tight narrow wake (forward-directed energy) vs. wide scattered wake (vertical bobbing)\n` +
        `- Stroke rate: countable from splash rhythm\n\n` +
        `**WHAT YOU CANNOT ASSESS — do NOT speculate about these:**\n` +
        `- Elbow position, elbow angle, or wrist rotation\n` +
        `- Hand pitch or catch depth\n` +
        `- Precise head angle or chin position\n` +
        `- Kick mechanics below the surface`;
    } else if (cameraAngle === "deck_side") {
      angleSection = `\n\n## Camera angle: POOL DECK LEVEL (side-on)\n\n` +
        `**WHAT YOU CAN ASSESS:**\n` +
        `- Head position during breath: height above water, neck extension, chin angle\n` +
        `- Body line and undulation above the waterline\n` +
        `- Hip position relative to the waterline\n` +
        `- Arm recovery height and path above water\n` +
        `- Breathing timing relative to the pull cycle\n` +
        `- Body angle during the breath and seesaw effect\n\n` +
        `**WHAT YOU CANNOT ASSESS without underwater footage:**\n` +
        `- Hand pitch and catch depth\n` +
        `- Underwater pull path\n` +
        `- Kick mechanics below the surface`;
    } else if (cameraAngle === "underwater") {
      angleSection = `\n\n## Camera angle: UNDERWATER\n\n` +
        `**WHAT YOU CAN ASSESS:**\n` +
        `- Catch mechanics: elbow position, hand pitch, forearm angle (early vertical forearm)\n` +
        `- Pull path: direction and efficiency of force application\n` +
        `- Kick mechanics: knee bend, foot position, kick depth and width\n` +
        `- Hip position and body rotation\n` +
        `- Streamline position during glide\n` +
        `- Arm symmetry and bilateral timing\n\n` +
        `**WHAT YOU CANNOT ASSESS reliably:**\n` +
        `- Breathing timing (head position above water not visible)\n` +
        `- Race-pace stroke rate without surface context`;
    }

    const taxonomyEntries = getTaxonomyForStrokeAndAngle(stroke, cameraAngle);
    const taxonomySection = formatTaxonomyForPrompt(taxonomyEntries);

    const outputFormat = `\n\nAnalyze the provided frames and return your feedback using EXACTLY this markdown structure:\n\n` +
      `### What I Observe\n` +
      `A detailed paragraph describing what you can see — body position, stroke phase, visible technique markers, water disturbance, head and hip alignment. Concrete and specific.\n\n` +
      `### Strengths\n` +
      `Bullet list (use "- " markdown) of 3-5 things the swimmer is doing well. Specific and technical.\n\n` +
      `### Areas for Improvement\n` +
      `Bullet list (use "- " markdown) of 3-5 things to work on. Each should be actionable, not vague.\n\n` +
      `### Recommended Drills\n` +
      `Numbered list (use "1. " markdown) of 3-5 specific drills with brief descriptions and what they correct.\n\n` +
      `### Summary\n` +
      `A short paragraph (2-3 sentences) of overall coaching takeaway. Encouraging but technical.\n\n` +
      `Do not add other sections. Do not add preamble. Start directly with "### What I Observe".`;

    return base + angleSection +
      (taxonomySection ? `\n\n---\n\n## Known technique issues detectable from this angle\n\n${taxonomySection}` : "") +
      outputFormat;
  }

  function buildUserPrompt(opts) {
    const focus = opts.focus && opts.focus.length ? opts.focus.join(", ") : "overall technique";
    const stroke = opts.stroke === "auto" ? "(infer from the footage)" : opts.stroke;
    const angleLabel = opts.cameraAngle === "overhead" ? "overhead / elevated wide-angle" :
                       opts.cameraAngle === "underwater" ? "underwater" : "pool deck / side-on";
    const swimmerLine = opts.swimmer
      ? `\nFocus exclusively on the swimmer matching this description: **${opts.swimmer}**. Track this swimmer across all frames using their visible identifiers (lane position, cap colour, suit colour, body size). Ignore all other swimmers in the frame.`
      : "";
    return `Analyze this swimming ${opts.type === "video" ? "video (frames extracted in chronological order)" : "photo"}.

Stroke: ${stroke}
Focus areas: ${focus}
Detail level: ${opts.detail || "standard"}
Camera angle: ${angleLabel}${swimmerLine}

Give specific, technical, actionable feedback. Only comment on what is physically visible from the ${angleLabel} camera angle. Reference what you can actually see in the ${opts.type === "video" ? "frames" : "image"}.`;
  }

  // ----------------------------------------------------------------
  // Live analysis (Claude API)
  // ----------------------------------------------------------------
  async function liveAnalyze(opts, onStage) {
    const key = getKey();
    const model = getModel();
    onStage && onStage("preparing");

    const content = [];
    if (opts.type === "photo") {
      const { base64, mediaType } = await fileToBase64(opts.file);
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 }
      });
    } else {
      for (const frame of opts.frames) {
        const parsed = dataUrlToBase64(frame.dataUrl);
        if (!parsed) continue;
        content.push({
          type: "image",
          source: { type: "base64", media_type: parsed.mediaType, data: parsed.base64 }
        });
      }
    }
    content.push({ type: "text", text: buildUserPrompt(opts) });

    onStage && onStage("sending");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        system: buildSystemPrompt(opts.stroke, opts.cameraAngle),
        messages: [{ role: "user", content }]
      })
    });

    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`API error ${res.status}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }

    const data = await res.json();
    onStage && onStage("building");
    const markdown = data.content && data.content[0] && data.content[0].text || "";
    const tokens = (data.usage && (data.usage.input_tokens + data.usage.output_tokens)) || 0;
    return { markdown, tokens, model, mode: "live" };
  }

  // ----------------------------------------------------------------
  // Test connection
  // ----------------------------------------------------------------
  async function testKey(key, model) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model || "claude-opus-4-7",
        max_tokens: 12,
        messages: [{ role: "user", content: "ping" }]
      })
    });
    if (!res.ok) {
      const t = await res.text();
      const e = new Error(`HTTP ${res.status}`);
      e.status = res.status;
      e.body = t;
      throw e;
    }
    return true;
  }

  // ----------------------------------------------------------------
  // Mock mode
  // ----------------------------------------------------------------
  const MOCK_DATA = {
    freestyle: {
      observe: "The swimmer is captured mid-stroke through the catch and pull phases of freestyle. Body line is reasonably horizontal at the surface with the head holding a neutral position, though there is a subtle drop in hip height during the breathing rotation. The right arm enters the water at shoulder width with a slight overshoot of the midline, and the underwater pull traces a relatively straight path beneath the body. The kick appears continuous but small in amplitude, originating largely from the knees rather than the hips.",
      strengths: [
        "Strong horizontal body line with minimal drag through most of the stroke cycle",
        "Clean, quiet arm entry — fingertips lead, wrist relaxed, almost no splash",
        "Neutral head position with eyes looking down rather than forward",
        "Consistent breathing rhythm — looks like a clean three-stroke pattern",
        "Good early vertical forearm shape during the catch"
      ],
      improve: [
        "Hips drop slightly during breath — focus on rotating both shoulders together rather than lifting the head",
        "Right arm crosses the midline at entry, which causes a hip wiggle on the recovery side",
        "Kick is knee-driven; engage the hips for a longer, more propulsive kick from the core",
        "Recovery elbow is slightly low — drive the elbow up toward the ceiling, hand relaxed",
        "Catch could be set earlier — there is a brief glide before the fingertips press down"
      ],
      drills: [
        "Catch-up drill — one arm extended forward until the other touches it. Builds rhythm and front-quadrant timing.",
        "6-1-6 drill — six kicks on the side, one stroke, six on the other side. Locks in rotation and a long body line.",
        "Fist-swim — swim freestyle with closed fists. Forces high elbow catch and forearm awareness.",
        "Vertical kicking — 30 seconds in deep water, arms crossed. Builds hip-driven kick from the core.",
        "Single-arm freestyle — one arm at side, breathing to non-stroking side. Isolates catch and pull path."
      ],
      summary: "Overall this is a technically clean freestyle with a good foundation in body line, head position, and entry. The two biggest wins available right now are stabilizing the hips through the breath and engaging the larger hip-driven kick — both will unlock noticeable speed without changing the stroke pattern."
    },
    backstroke: {
      observe: "The swimmer is on their back, mid-pull, with the right arm executing the underwater push and the left arm beginning recovery. The head is steady, water line just below the goggles, with the chin slightly tucked. There is visible shoulder rotation, but the hips appear to rotate less than the shoulders, suggesting a slight 'disconnect' between upper and lower body. The kick is continuous with the feet just breaking the surface — fairly tight and rapid.",
      strengths: [
        "Steady head position — no rocking or looking around",
        "Hands enter the water pinky-first at roughly 11 and 1 — strong textbook angle",
        "Continuous, compact flutter kick keeping the legs near the surface",
        "Good water line at the goggles, body sitting high in the water",
        "Clear S-shaped underwater pull path tracing toward the hip"
      ],
      improve: [
        "Hips rotate less than shoulders — drive rotation from the hips, not the shoulders",
        "Right arm pull finishes a little early; extend through to a full thumb-out exit at the thigh",
        "Slight bend at the waist during the recovery suggests core engagement could be stronger",
        "Kick is fast but small — lengthen the kick to engage the hip flexors for more propulsion",
        "Entry is wide of the shoulder line — bring the entry point closer to the centerline"
      ],
      drills: [
        "Double-arm backstroke — both arms recover together. Forces symmetric rotation from the hips.",
        "10/10 drill — ten kicks on one side, ten on the other. Builds long, rotated streamline.",
        "Cup-on-forehead drill — keep a cup balanced on the forehead. Anchors head position.",
        "Streamline kick on back — arms in tight streamline, kicking on back. Builds straight body line.",
        "Single-arm back — one arm at the side, the other strokes. Isolates pull path and rotation."
      ],
      summary: "A confident, textbook backstroke with great head control and entry mechanics. The next layer of speed will come from connecting the hip rotation to the shoulders and lengthening both the pull and the kick. Small adjustments — same shape, more drive."
    },
    breaststroke: {
      observe: "The swimmer is captured at the outsweep of the breaststroke pull with the head just beginning to lift for the breath. The body is in a slight downhill posture with the hips a touch low and the chest pressing into the water. The arms are outside shoulder width and beginning to scull, and the legs are still extended in glide position. The timing of the pull-breathe-kick-glide sequence is the dominant question this frame raises.",
      strengths: [
        "Long, patient glide position with arms fully extended after the kick",
        "Streamlined head position during the glide — chin tucked, eyes down",
        "Outsweep is clean and symmetric — no shoulder shrug",
        "Good narrow leg position during the glide before the kick recovery",
        "Quiet hands at the catch — no splashing on the press out"
      ],
      improve: [
        "Hips ride slightly low — press the chest down more aggressively to elevate the hips",
        "Breath is taken a fraction late — lift the head with the insweep, not after it",
        "Kick recovery looks like the heels travel wide of the hips — keep them tracking inside the knees",
        "Pull is wide of shoulder width — narrow the outsweep slightly for a stronger catch",
        "Timing tends to be pull-kick-glide; aim for pull-breathe-kick-glide as a single connected wave"
      ],
      drills: [
        "Two-kick-one-pull — emphasizes the kick and glide phase, builds a long bottom of the stroke.",
        "Pull-only with buoy — focuses on the catch and breath timing without leg interference.",
        "Sculling drills (front scull) — sharpens feel for water at the catch.",
        "Eyes-down breaststroke — only the back of the head breaks the surface during breath.",
        "Wall kick with board — narrow kick, heels to glutes, build kick power."
      ],
      summary: "There is a good foundation in glide and streamline here. The biggest unlock is in the timing wave — connecting the breath to the pull and the kick to the glide so the whole stroke moves like one undulating shape rather than four discrete pieces."
    },
    butterfly: {
      observe: "The swimmer is at the front of the stroke just after entry, with the arms extended forward and the head down beginning the press. The body undulation is visible — the hips are rising as the chest presses, and the second kick will follow the hand entry. Recovery looks low and wide, which is common in long-course training. The rhythm of two kicks per pull appears established, though the second kick looks more emphatic than the first.",
      strengths: [
        "Clear two-kick-per-pull rhythm — fundamental fly timing is in place",
        "Strong second kick driving the hands forward at entry",
        "Head leads the press — chin down at entry, eyes looking down",
        "Symmetric arm entry at shoulder width — no crossover",
        "Visible undulation from chest through hips — body wave is present"
      ],
      improve: [
        "Recovery is wide and low — sweep the arms slightly higher with relaxed elbows",
        "First kick is small; equalize the two kicks for more consistent propulsion",
        "Breath looks like it lifts the head too high — aim chin forward, not up",
        "Hands enter slightly wide of the shoulders — track entry just outside shoulder width",
        "Glide pause at the front is a touch long — start the catch sooner after entry"
      ],
      drills: [
        "3-3-3 drill — three left, three right, three full strokes. Builds rhythm and reduces fatigue.",
        "Underwater fly kick on back — builds the kick and undulation pattern.",
        "Single-arm fly — one arm at side, other strokes. Isolates the press and catch.",
        "Body-dolphin drill — no arms, full body undulation. Locks in the wave.",
        "2 kicks per pull with snorkel — removes breathing from the picture, focuses on rhythm."
      ],
      summary: "A solid butterfly with the cardinal sin of fly — uneven kicks — being the main thing to fix. The body wave and entry mechanics are there. Equalize the kicks, keep the breath low, and the stroke will look and feel half as tiring."
    }
  };

  function pickMock(stroke) {
    const s = stroke && MOCK_DATA[stroke] ? stroke : "freestyle";
    return MOCK_DATA[s];
  }

  async function mockAnalyze(opts, onStage) {
    onStage && onStage("preparing");
    await sleep(opts.type === "video" ? 600 : 300);
    onStage && onStage("sending");
    await sleep(opts.type === "video" ? 1800 : 1000);
    onStage && onStage("building");
    await sleep(opts.type === "video" ? 1200 : 700);

    const data = pickMock(opts.stroke);
    const md = [
      "### What I Observe",
      data.observe,
      "",
      "### Strengths",
      data.strengths.map(s => `- ${s}`).join("\n"),
      "",
      "### Areas for Improvement",
      data.improve.map(s => `- ${s}`).join("\n"),
      "",
      "### Recommended Drills",
      data.drills.map((s, i) => `${i + 1}. ${s}`).join("\n"),
      "",
      "### Summary",
      data.summary
    ].join("\n");

    return { markdown: md, tokens: 0, model: "demo", mode: "demo" };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ----------------------------------------------------------------
  // Generate placeholder frame canvases for mock mode
  // ----------------------------------------------------------------
  function makeMockFrame(idx, total, stroke) {
    const c = document.createElement("canvas");
    c.width = 480; c.height = 270;
    const ctx = c.getContext("2d");
    // Deep water gradient
    const g = ctx.createLinearGradient(0, 0, 0, 270);
    g.addColorStop(0, "#0a4d8c");
    g.addColorStop(0.5, "#1a365d");
    g.addColorStop(1, "#051932");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 480, 270);

    // Caustic light beams
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 14; i++) {
      const x = (i * 480 / 14 + idx * 12) % 480;
      ctx.fillStyle = "#7cc4ff";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 8, 0);
      ctx.lineTo(x + 24, 270);
      ctx.lineTo(x + 14, 270);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Surface ripples / lane line
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = 200 + i * 14;
      ctx.beginPath();
      for (let x = 0; x <= 480; x += 6) {
        const yy = y + Math.sin(x * 0.04 + idx * 0.6) * 2;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // Swimmer silhouette (varies by index for motion)
    const swimX = 80 + (idx / Math.max(total - 1, 1)) * 280;
    const armAngle = Math.sin(idx * 0.8) * 0.7;
    ctx.fillStyle = "rgba(13,38,71,0.85)";
    // body
    ctx.beginPath();
    ctx.ellipse(swimX, 145, 70, 18, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(swimX + 60, 138, 14, 0, Math.PI * 2);
    ctx.fill();
    // arm
    ctx.strokeStyle = "rgba(13,38,71,0.9)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(swimX + 50, 140);
    ctx.lineTo(swimX + 50 + Math.cos(armAngle) * 50, 140 - Math.sin(armAngle) * 50);
    ctx.stroke();

    // Splash
    ctx.fillStyle = "rgba(190,227,248,0.6)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(swimX + 60 + Math.random() * 20 - 10, 130 + Math.random() * 10, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lane marker top
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i < 30; i++) {
      ctx.fillRect(i * 18, 6, 12, 4);
    }

    // Timestamp
    const t = (idx / Math.max(total - 1, 1)) * 8;
    const time = `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, "0")}.${Math.floor((t * 10) % 10)}`;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(10, 244, 60, 18);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.fillText(time, 16, 256);

    // Frame number top right
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(420, 8, 50, 18);
    ctx.fillStyle = "#bee3f8";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.fillText(`F${(idx + 1).toString().padStart(2, "0")}/${total.toString().padStart(2, "0")}`, 425, 20);

    return { timestamp: time.slice(0, 4), dataUrl: c.toDataURL("image/jpeg", 0.8), t };
  }

  // ----------------------------------------------------------------
  // Dispatcher
  // ----------------------------------------------------------------
  async function analyze(opts, onStage) {
    const useLive = !!getKey();
    if (useLive) {
      return liveAnalyze(opts, onStage);
    }
    return mockAnalyze(opts, onStage);
  }

  // ----------------------------------------------------------------
  // Parse markdown response into sections
  // ----------------------------------------------------------------
  function parseResult(markdown) {
    const sections = { observe: "", strengths: [], improve: [], drills: [], summary: "" };
    if (!markdown) return sections;
    const parts = markdown.split(/^###\s+/m).filter(Boolean);
    for (const part of parts) {
      const lines = part.split("\n");
      const head = (lines[0] || "").trim().toLowerCase();
      const body = lines.slice(1).join("\n").trim();
      if (head.includes("observe")) sections.observe = body;
      else if (head.includes("strength")) sections.strengths = extractBullets(body);
      else if (head.includes("improve") || head.includes("area")) sections.improve = extractBullets(body);
      else if (head.includes("drill")) sections.drills = extractBullets(body);
      else if (head.includes("summary")) sections.summary = body;
    }
    return sections;
  }

  function extractBullets(text) {
    return text.split("\n")
      .map(l => l.trim())
      .filter(l => /^[-*\d]/.test(l))
      .map(l => l.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean);
  }

  // ----------------------------------------------------------------
  window.SwimAPI = {
    analyze,
    testKey,
    extractFrames,
    parseResult,
    makeMockFrame,
    getKey,
    getModel,
    isLive: () => !!getKey()
  };
})();
