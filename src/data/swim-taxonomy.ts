import path from 'path';
import { fileURLToPath } from 'url';

const IMAGES_DIR = path.join(fileURLToPath(new URL('.', import.meta.url)), 'swim-reference-images');
const EXAMPLES_DIR = path.join(
  fileURLToPath(new URL('.', import.meta.url)),
  '..',
  '..',
  'examples',
);

const img = (...filenames: string[]) => filenames.map((f) => path.join(IMAGES_DIR, f));
const example = (...parts: string[]) => path.join(EXAMPLES_DIR, ...parts);

type Stroke = 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly';

export interface ExampleGroup {
  label: string;
  description: string;
  frames: string[];
}

export interface TaxonomyEntry {
  id: string;
  stroke: Stroke;
  title: string;
  description: string;
  cause: string;
  fix: string;
  drill: string;
  referenceImages?: string[];
  badExamples?: ExampleGroup[];
  goodExamples?: ExampleGroup[];
}

const SWIM_TAXONOMY: TaxonomyEntry[] = [
  {
    id: 'breaststroke-timing-001',
    stroke: 'breaststroke',
    title: 'Poor Pull-Kick Timing',
    description:
      'Pulling and kicking at the same time, or pausing during the breath instead of during the glide. Looks like treading water — lots of movement, very little forward progress.',
    cause:
      'Anxiety about breathing causes swimmers to rush getting their head up, triggering the kick too early. Also common in people who learned breaststroke casually and never separated the phases.',
    fix: 'Use the cue "Pull… breathe… kick… glide." The pause belongs in the glide, not in the breath.',
    drill:
      '2-kick-1-pull — do two kicks per arm cycle to force separation. Swim 4 x 25m with this pattern, 15 seconds rest between reps.',
    referenceImages: img('Correct-breaststroke-kick.png', 'breaststroke-Pull-sequence-.png'),
  },
  {
    id: 'breaststroke-wide-pull-002',
    stroke: 'breaststroke',
    title: 'Pulling Arms Too Wide (or Too Far Back)',
    description:
      'Elbows sweep past the shoulders, arms go wide, or hands pull all the way to the hips. Looks powerful but creates a huge frontal area and kills forward momentum.',
    cause:
      'Swimmers assume bigger movements mean more power. Common in people stronger in freestyle who carry over a long pull habit.',
    fix: "Keep elbows in front of your shoulders at all times. If you can't see them in your peripheral vision, you've pulled too far. Think of the pull as a heart shape, not a circle.",
    drill:
      'Forearm sculling – float face-down and scull with just forearms, keeping elbows nearly still. For competitive swimmers: work on early vertical forearm to catch more water with less arm extension.',
    referenceImages: img('breaststroke-arm-pull.png'),
  },
  {
    id: 'breaststroke-sinking-hips-005',
    stroke: 'breaststroke',
    title: 'Sinking Hips and Poor Body Position',
    description:
      'Hips sink low every stroke cycle. The body tilts close to vertical during the breath, then crashes back flat. Looks like fighting the water instead of riding on top of it.',
    cause:
      'Lifting the head too high during the breath (so hips drop to compensate), recovering arms too high above the surface (same effect), and weak core engagement.',
    fix: 'Keep the breathing motion small. During arm recovery, hands push forward at or just below the surface.',
    drill:
      'Streamline kick on front (SLOF) – hold streamline, kick breaststroke, time your breathing lift without taking a pull. A pool noodle tucked under the hips helps beginners feel the correct position for a few laps.',
    referenceImages: img('Breaststroke-Body-Position-During-Breathing.png'),
    badExamples: [
      {
        label: 'Sinking hips — seesaw effect',
        description:
          'Above-water and side-profile underwater views showing the classic seesaw: when the head or chest rises during the breath, the hips are forced down, dramatically increasing drag.',
        frames: [
          example('hip-position-bad', 'frame_01.png'),
          example('hip-position-bad', 'frame_02.png'),
          example('hip-position-bad', 'frame_04.png'),
          example('hip-position-bad', 'frame_05.png'),
        ],
      },
      {
        label: 'Excessive hip flexion — piking during pull',
        description:
          'Close-up underwater shots showing hips piking sharply downward during the arm pull. Frames 6–8 show knees tucking far under the body during recovery — both create a wall of resistance.',
        frames: [
          example('hip-position-bad', 'frame_03.png'),
          example('hip-position-bad', 'frame_04.png'),
          example('hip-position-bad', 'frame_05.png'),
          example('hip-position-bad', 'frame_06.png'),
          example('hip-position-bad', 'frame_07.png'),
          example('hip-position-bad', 'frame_08.png'),
        ],
      },
      {
        label: 'Hips too high — heels breaking the surface',
        description:
          'Heels break the surface on the breaststroke recovery (frame_07 has on-screen "HEELS UP" label). When heels come up, hips crest and kill horizontal momentum.',
        frames: [
          example('hip-position-bad', 'frame_07.png'),
          example('hip-position-bad', 'frame_09.png'),
          example('hip-position-bad', 'frame_10.png'),
          example('hip-position-bad', 'frame_11.png'),
        ],
      },
      {
        label: 'Hip–kick timing mismatch',
        description:
          'Wall-turn sequence and arrow-annotated frames showing the kick firing while hips are still repositioning. Hands extend while hips are out of alignment — the hands and hips are not moving as a coordinated unit.',
        frames: [
          example('hip-position-bad', 'frame_12.png'),
          example('hip-position-bad', 'frame_13.png'),
          example('hip-position-bad', 'frame_14.png'),
          example('hip-position-bad', 'frame_15.png'),
          example('hip-position-bad', 'frame_16.png'),
          example('hip-position-bad', 'frame_17.png'),
          example('hip-position-bad', 'frame_18.png'),
        ],
      },
    ],
    goodExamples: [
      {
        label: 'Level alignment — hips at the waterline',
        description:
          'The polka-dot swimmer is the clearest example: hips sit right at the waterline, body perfectly parallel to the pool floor, nothing breaking the surface. Head-neutral position in frames 1 and 4 enables this — no chin-up means no hip drop.',
        frames: [
          example('hip-position-good', 'frame_01.png'),
          example('hip-position-good', 'frame_04.png'),
          example('hip-position-good', 'frame_09.png'),
          example('hip-position-good', 'frame_10.png'),
          example('hip-position-good', 'frame_11.png'),
        ],
      },
      {
        label: 'Controlled undulation — compact hip wave',
        description:
          "Breaststroke sequence showing a wave that stays contained within the body's own silhouette rather than diving below it. Frame 7 (butterfly swimmers from above) is particularly clear — the wake pattern is tight and narrow, meaning hip drive is going forward rather than up and down.",
        frames: [
          example('hip-position-good', 'frame_02.png'),
          example('hip-position-good', 'frame_03.png'),
          example('hip-position-good', 'frame_05.png'),
          example('hip-position-good', 'frame_06.png'),
          example('hip-position-good', 'frame_07.png'),
        ],
      },
      {
        label: 'Hip-driven rotation — hip leads the arm',
        description:
          "The polka-dot swimmer's freestyle shows the hip rolling before the arm finishes its entry. That sequencing — hip first, then arm pull — is the source of most of the power. Frame 13 shows the result: the arm reaches far forward precisely because the hip rotation created the space.",
        frames: [
          example('hip-position-good', 'frame_08.png'),
          example('hip-position-good', 'frame_09.png'),
          example('hip-position-good', 'frame_13.png'),
        ],
      },
      {
        label: 'Tight glide phase — full body extension',
        description:
          'During the breaststroke glide in frames 1 and 4, the hips are fully extended with no break at the waist. Frame 11 is the best single frame in this set: the body forms one completely straight line from fingertips to feet.',
        frames: [
          example('hip-position-good', 'frame_01.png'),
          example('hip-position-good', 'frame_04.png'),
          example('hip-position-good', 'frame_11.png'),
        ],
      },
    ],
  },
  {
    id: 'breaststroke-breath-timing-006',
    stroke: 'breaststroke',
    title: 'Breathing at the Wrong Moment',
    description:
      'Head comes up with no arm support after the pull has already finished, so the whole body sinks. Or the swimmer holds their breath the entire cycle and exhales and inhales in one panicked burst.',
    cause:
      "Fear of not getting enough air. Beginners wait until the head is at its highest point before breathing, which is too late. Competitive swimmers sometimes breathe too late because they're focused on the pull.",
    fix: 'Exhale steadily into the water during the glide. Start the inhale as soon as the outsweep begins and your shoulders rise naturally. By the time your hands sweep inward, the breath should be done. Cue: "Breathe WITH the pull, not AFTER the pull."',
    drill:
      'Practice standing in shallow water doing the arm motion and timing the breath without the pressure of actually swimming.',
  },
  {
    id: 'breaststroke-catch-003',
    stroke: 'breaststroke',
    title: 'Poor Catch Mechanics',
    description:
      'Elbows drop below the hands before any propulsive surface is established. Arms sweep too wide or too deep, slipping water rather than holding it. Looks like the arms are pushing down instead of pulling back.',
    cause:
      'Swimmers extend fully before bending the elbow, missing the early vertical forearm window. Common in people who learned breaststroke without coaching and default to a wide sweeping motion.',
    fix: 'Initiate the catch with the elbow high and outside. The forearm should be near-vertical before the pull begins. Think "elbows up, hands down" at the start of every pull.',
    drill:
      'Catch-up drill with fists closed — swim breaststroke with fists to force forearm engagement. Then open hands and try to recreate the same forearm pressure. 4 x 25m, 20 seconds rest.',
    badExamples: [
      {
        label: 'Dropped elbow — no EVF established',
        description:
          'Elbow falls below wrist at the catch moment. The forearm cannot act as a propulsive surface when the elbow is the lowest point.',
        frames: [
          example('catch-bad', 'frame_01.png'),
          example('catch-bad', 'frame_03.png'),
          example('catch-bad', 'frame_04.png'),
          example('catch-bad', 'frame_05.png'),
          example('catch-bad', 'frame_09.png'),
          example('catch-bad', 'frame_12.png'),
        ],
      },
      {
        label: 'Crossover entry — arm crossing centerline',
        description:
          'Hand enters across the body centerline causing hip snaking and a misdirected pull path.',
        frames: [example('catch-bad', 'frame_02.png'), example('catch-bad', 'frame_08.png')],
      },
      {
        label: 'Flat wrist — no downward hand pitch at entry',
        description: 'Hand enters flat rather than fingertips-down, delaying catch initiation.',
        frames: [example('catch-bad', 'frame_01.png'), example('catch-bad', 'frame_06.png')],
      },
      {
        label: 'Late catch initiation — straight arm pull',
        description:
          'Arm nearly fully extended with no elbow bend at what should be the catch moment. Swimmer relies on straight-arm pull instead of EVF.',
        frames: [example('catch-bad', 'frame_04.png'), example('catch-bad', 'frame_10.png')],
      },
      {
        label: 'Bilateral elbow dropout',
        description:
          'Both arms lose high elbow position simultaneously — no vertical forearm on either side.',
        frames: [example('catch-bad', 'frame_05.png'), example('catch-bad', 'frame_12.png')],
      },
      {
        label: 'Palm facing down not back',
        description:
          'Hand oriented toward pool floor rather than back wall, producing lift/brake force instead of propulsion.',
        frames: [example('catch-bad', 'frame_02.png'), example('catch-bad', 'frame_10.png')],
      },
      {
        label: 'Dead spot glide — lead arm paused flat',
        description:
          'Lead arm pauses flat on the surface instead of transitioning to catch, creating a deceleration dead spot.',
        frames: [example('catch-bad', 'frame_07.png')],
      },
      {
        label: 'Shoulder over-rotation',
        description:
          'Body rolled past 45° moving shoulder out of strong catch position and reducing mechanical advantage.',
        frames: [example('catch-bad', 'frame_08.png')],
      },
      {
        label: 'Shallow elbow sweep — arms too wide before catch',
        description:
          'Arms sweep laterally past shoulder-width before any vertical forearm position is established. Slipping water rather than catching it.',
        frames: [example('catch-bad', 'frame_03.png'), example('catch-bad', 'frame_05.png')],
      },
      {
        label: 'Elbow collapse mid-pull',
        description:
          'Elbow drops during the pull phase. All propulsion shifts to shoulder/upper arm rather than the larger forearm paddle surface.',
        frames: [example('catch-bad', 'frame_11.png')],
      },
      {
        label: 'Head lift disrupting catch',
        description:
          'Elevated head shifts weight backward so catching arm works uphill. Also prevents shoulder from dropping into the catch plane.',
        frames: [example('catch-bad', 'frame_06.png')],
      },
      {
        label: 'Over-reach depth',
        description:
          'Hand goes past natural catch depth, forcing swimmer to push water down before pushing it back.',
        frames: [example('catch-bad', 'frame_09.png')],
      },
    ],
    goodExamples: [
      {
        label: 'EVF established — forearm near vertical',
        description:
          'Elbow elevated above wrist and hand with forearm close to perpendicular to travel direction. Classic high-elbow catch position.',
        frames: [
          example('catch-good', 'frame_02.png'),
          example('catch-good', 'frame_06.png'),
          example('catch-good', 'frame_07.png'),
          example('catch-good', 'frame_08.png'),
        ],
      },
      {
        label: 'Correct entry angle — fingertips first',
        description:
          'Wrist cocked with fingers leading into water at a downward angle. No flat slap, no air bubbles trapped under palm.',
        frames: [example('catch-good', 'frame_05.png'), example('catch-good', 'frame_12.png')],
      },
      {
        label: 'Palm facing backward',
        description:
          'Hand pitched toward back wall not pool floor. Propulsive force directed horizontally.',
        frames: [example('catch-good', 'frame_02.png'), example('catch-good', 'frame_10.png')],
      },
      {
        label: 'Bilateral EVF — both arms simultaneously',
        description:
          'Both arms show elbow-above-wrist position at the same time. Critical for breaststroke symmetry.',
        frames: [
          example('catch-good', 'frame_02.png'),
          example('catch-good', 'frame_04.png'),
          example('catch-good', 'frame_09.png'),
        ],
      },
      {
        label: 'No elbow collapse mid-pull',
        description:
          'High elbow maintained through the pull phase past the most common failure point.',
        frames: [example('catch-good', 'frame_07.png'), example('catch-good', 'frame_11.png')],
      },
      {
        label: 'Body rotation synced to catch',
        description: 'Torso roll timed to load the catch, adding rotation power to the arm pull.',
        frames: [example('catch-good', 'frame_06.png'), example('catch-good', 'frame_10.png')],
      },
      {
        label: 'Entry outside shoulder line',
        description:
          'Hand enters at or outside shoulder — no crossover. Sets up a straight pull path.',
        frames: [example('catch-good', 'frame_03.png'), example('catch-good', 'frame_05.png')],
      },
      {
        label: 'Full pull length achieved',
        description:
          'Arm travels from full extension to past the hip. Only possible when catch was set correctly at the start.',
        frames: [example('catch-good', 'frame_13.png')],
      },
      {
        label: 'Forearm as paddle surface',
        description:
          'Full inner forearm from wrist to elbow pressing water backward during the pull.',
        frames: [example('catch-good', 'frame_11.png')],
      },
      {
        label: 'Neutral head position at catch',
        description:
          'Head down allowing horizontal body position so catch works on a level plane.',
        frames: [example('catch-good', 'frame_04.png')],
      },
      {
        label: 'Clean entry — no air bubbles',
        description:
          'No aeration under the palm at entry. Clean entry means the hand has solid water to catch against immediately.',
        frames: [example('catch-good', 'frame_12.png')],
      },
      {
        label: 'Symmetric bilateral timing',
        description:
          'Both arms at matching depth and angle viewed frontally. Hallmark of a well-timed breaststroke catch.',
        frames: [example('catch-good', 'frame_09.png')],
      },
    ],
  },
  {
    id: 'freestyle-head-position-004',
    stroke: 'freestyle',
    title: 'Poor Head Position',
    description:
      'Head lifted out of the water with eyes looking forward rather than down. Creates a seesaw effect — raised head at the front forces hips and legs to sink at the back, turning the swimmer into a wall of drag.',
    cause:
      'Instinct to see where you are going. Anxiety about breathing causes swimmers to lift the head rather than rotate it. Common in beginners and triathletes who learned in open water.',
    fix: 'Look at the pool floor, not the wall ahead. One goggle should stay submerged on the breath. Use the bow wave trough to breathe — it creates a natural air pocket without any head lift.',
    drill:
      'Catch-up drill with a focus on keeping the crown of the head as the highest point at all times. 4 x 50m, breathing every 3 strokes, 20 seconds rest. Use a tempo trainer to keep stroke rate steady.',
    badExamples: [
      {
        label: 'Head fully out of water — extreme lift',
        description:
          'Entire head including chin clear of surface. Most extreme form of head lift fault. Body adopts nearly vertical position in the water.',
        frames: [
          example('head-position-bad', 'frame_02.png'),
          example('head-position-bad', 'frame_03.png'),
          example('head-position-bad', 'frame_04.png'),
          example('head-position-bad', 'frame_05.png'),
          example('head-position-bad', 'frame_06.png'),
        ],
      },
      {
        label: 'Forward gaze — eyes at horizon',
        description:
          'Eyes directed at the far wall rather than pool floor. Eye line should be directed downward at approximately 45 degrees.',
        frames: [
          example('head-position-bad', 'frame_01.png'),
          example('head-position-bad', 'frame_04.png'),
          example('head-position-bad', 'frame_06.png'),
          example('head-position-bad', 'frame_07.png'),
          example('head-position-bad', 'frame_10.png'),
          example('head-position-bad', 'frame_11.png'),
          example('head-position-bad', 'frame_12.png'),
        ],
      },
      {
        label: 'Neck hyperextension',
        description:
          'Cervical spine cranked upward from neutral creating pronounced arch at back of neck.',
        frames: [
          example('head-position-bad', 'frame_01.png'),
          example('head-position-bad', 'frame_06.png'),
          example('head-position-bad', 'frame_10.png'),
        ],
      },
      {
        label: 'Hip sink from head lift',
        description:
          'Hips and legs dropping as direct consequence of raised head. Classic seesaw effect.',
        frames: [
          example('head-position-bad', 'frame_02.png'),
          example('head-position-bad', 'frame_10.png'),
          example('head-position-bad', 'frame_11.png'),
          example('head-position-bad', 'frame_12.png'),
        ],
      },
      {
        label: 'Vertical body position from head lift',
        description:
          'Torso nearly upright in water. Swimmer is moving through the water like a post rather than over it.',
        frames: [
          example('head-position-bad', 'frame_02.png'),
          example('head-position-bad', 'frame_04.png'),
          example('head-position-bad', 'frame_05.png'),
          example('head-position-bad', 'frame_06.png'),
        ],
      },
      {
        label: 'Shoulder elevation from head',
        description:
          'Shoulders rise toward ears caused by tension from head lift. Disrupts shoulder rotation needed for efficient stroke.',
        frames: [
          example('head-position-bad', 'frame_01.png'),
          example('head-position-bad', 'frame_07.png'),
          example('head-position-bad', 'frame_08.png'),
        ],
      },
      {
        label: 'Over-rotation on breath',
        description:
          'Head rotating beyond 90 degrees AND lifting simultaneously on the breath. One goggle should stay submerged.',
        frames: [example('head-position-bad', 'frame_08.png')],
      },
      {
        label: 'Head lift with chin compression',
        description:
          'Head raised but chin tucked creating a neck crunch. Incorrect compensation by swimmers who know not to look forward.',
        frames: [example('head-position-bad', 'frame_09.png')],
      },
      {
        label: 'Lumbar arch from head lift',
        description:
          'Lower back hollowing as compensation for elevated head. Increases drag profile at the hips.',
        frames: [
          example('head-position-bad', 'frame_11.png'),
          example('head-position-bad', 'frame_12.png'),
        ],
      },
      {
        label: 'Elbow drop linked to head position',
        description:
          'Catch compromised because elevated head prevents shoulder from dropping into the water on the catching side.',
        frames: [example('head-position-bad', 'frame_12.png')],
      },
      {
        label: 'Chest above waterline',
        description:
          'Upper chest and torso riding above surface. Should be submerged in a horizontal streamlined position.',
        frames: [
          example('head-position-bad', 'frame_03.png'),
          example('head-position-bad', 'frame_04.png'),
          example('head-position-bad', 'frame_05.png'),
          example('head-position-bad', 'frame_06.png'),
        ],
      },
      {
        label: 'Persistent head lift pattern',
        description:
          'Head never submerges across multiple stroke phases. Structural fault not a momentary error.',
        frames: [
          example('head-position-bad', 'frame_02.png'),
          example('head-position-bad', 'frame_05.png'),
          example('head-position-bad', 'frame_06.png'),
          example('head-position-bad', 'frame_11.png'),
          example('head-position-bad', 'frame_12.png'),
        ],
      },
    ],
    goodExamples: [
      {
        label: 'Head submerged during glide',
        description:
          'Head fully down and in line with spine during non-breath phase. Crown is highest point, not the face.',
        frames: [
          example('head-position-good', 'frame_02.png'),
          example('head-position-good', 'frame_05.png'),
          example('head-position-good', 'frame_07.png'),
          example('head-position-good', 'frame_12.png'),
        ],
      },
      {
        label: 'Minimal breath lift — chin at waterline',
        description:
          'Head raised only enough to clear airway. Chin just at waterline, no energy wasted lifting higher than the breath requires.',
        frames: [
          example('head-position-good', 'frame_01.png'),
          example('head-position-good', 'frame_03.png'),
          example('head-position-good', 'frame_10.png'),
          example('head-position-good', 'frame_11.png'),
          example('head-position-good', 'frame_13.png'),
        ],
      },
      {
        label: 'Body-driven head rise',
        description:
          'Head elevation caused by whole-body surge during pull, not isolated neck extension. Chest rises with the head.',
        frames: [
          example('head-position-good', 'frame_01.png'),
          example('head-position-good', 'frame_03.png'),
          example('head-position-good', 'frame_10.png'),
          example('head-position-good', 'frame_11.png'),
        ],
      },
      {
        label: 'Neutral cervical spine',
        description:
          'No hyperextension at back of neck during breath. Neck and upper back form a smooth curve not a sharp angle.',
        frames: [
          example('head-position-good', 'frame_01.png'),
          example('head-position-good', 'frame_03.png'),
          example('head-position-good', 'frame_09.png'),
          example('head-position-good', 'frame_11.png'),
        ],
      },
      {
        label: 'Head centered bilaterally',
        description:
          'Head tracking straight on centerline with no lateral tilt or twist. Critical for breaststroke to avoid yaw.',
        frames: [
          example('head-position-good', 'frame_04.png'),
          example('head-position-good', 'frame_08.png'),
          example('head-position-good', 'frame_13.png'),
        ],
      },
      {
        label: 'Chin drops before arm extension',
        description:
          'Chin returning down ahead of arms reaching into streamline. Correct sequencing — head leads body into position.',
        frames: [
          example('head-position-good', 'frame_04.png'),
          example('head-position-good', 'frame_09.png'),
          example('head-position-good', 'frame_12.png'),
        ],
      },
      {
        label: 'Crown as leading point',
        description:
          'Top of head is highest and leading point of body. Face directed downward. Confirmed by minimal surface disturbance at head.',
        frames: [
          example('head-position-good', 'frame_06.png'),
          example('head-position-good', 'frame_07.png'),
          example('head-position-good', 'frame_12.png'),
        ],
      },
      {
        label: 'Flat body line confirmed by head',
        description:
          'Horizontal body position visible as direct consequence of correct head position. No seesaw effect.',
        frames: [
          example('head-position-good', 'frame_02.png'),
          example('head-position-good', 'frame_05.png'),
          example('head-position-good', 'frame_07.png'),
        ],
      },
      {
        label: 'Relaxed shoulders from head position',
        description:
          'No shoulder elevation or trapezius tension. Relaxed shoulder girdle is the downstream benefit of controlled head position.',
        frames: [
          example('head-position-good', 'frame_04.png'),
          example('head-position-good', 'frame_08.png'),
          example('head-position-good', 'frame_13.png'),
        ],
      },
      {
        label: 'Correct breath timing',
        description:
          'Breath taken at biomechanically correct moment — during the insweep/pull when body naturally rises.',
        frames: [example('head-position-good', 'frame_11.png')],
      },
      {
        label: 'Downward forward gaze',
        description:
          'Eyes angled toward pool floor not at horizon. Confirms head is not hyperextended.',
        frames: [
          example('head-position-good', 'frame_03.png'),
          example('head-position-good', 'frame_09.png'),
        ],
      },
      {
        label: 'Head tucked in streamline',
        description:
          'Head between extended arms rather than above arm line. Passive and relaxed — correct for the glide phase.',
        frames: [example('head-position-good', 'frame_07.png')],
      },
    ],
  },
];

export function getTaxonomyByStroke(stroke: string): TaxonomyEntry[] {
  if (stroke === 'unknown') return SWIM_TAXONOMY;
  return SWIM_TAXONOMY.filter((entry) => entry.stroke === stroke);
}

export function formatTaxonomyForPrompt(entries: TaxonomyEntry[]): string {
  if (entries.length === 0) return '';
  return entries
    .map(
      (entry) =>
        `**${entry.title}**\n` +
        `How it looks: ${entry.description}\n` +
        `Why it happens: ${entry.cause}\n` +
        `How to fix: ${entry.fix}\n` +
        `Drill: ${entry.drill}`,
    )
    .join('\n\n');
}
