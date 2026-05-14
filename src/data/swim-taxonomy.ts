import path from 'path';
import { fileURLToPath } from 'url';

const EXAMPLES_DIR = path.join(
  fileURLToPath(new URL('.', import.meta.url)),
  '..',
  '..',
  'examples',
);

const example = (...parts: string[]) => path.join(EXAMPLES_DIR, ...parts);

type Stroke = 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly';

export type CameraAngle = 'overhead' | 'deck_side' | 'underwater';

export type FocusArea =
  | 'arm_entry'
  | 'pull_phase'
  | 'kick'
  | 'body_rotation'
  | 'head_position'
  | 'breathing'
  | 'timing'
  | 'body_position'
  | 'catch'
  | 'hip_position'
  | 'overall';

export interface ExampleGroup {
  label: string;
  description: string;
  frames: string[];
  cameraAngles?: CameraAngle[];
}

export interface TaxonomyEntry {
  id: string;
  stroke: Stroke;
  title: string;
  description: string;
  cause: string;
  fix: string;
  drill: string;
  detectableFrom: CameraAngle[];
  focusAreas: FocusArea[];
  badExamples?: ExampleGroup[];
  goodExamples?: ExampleGroup[];
}

const SWIM_TAXONOMY: TaxonomyEntry[] = [
  {
    id: 'breaststroke-timing-001',
    stroke: 'breaststroke',
    title: 'Poor Pull-Kick Timing',
    detectableFrom: ['overhead', 'deck_side', 'underwater'],
    description:
      'Pulling and kicking at the same time, or pausing during the breath instead of during the glide. Looks like treading water — lots of movement, very little forward progress.',
    cause:
      'Anxiety about breathing causes swimmers to rush getting their head up, triggering the kick too early. Also common in people who learned breaststroke casually and never separated the phases.',
    fix: 'Use the cue "Pull… breathe… kick… glide." The pause belongs in the glide, not in the breath.',
    drill:
      '2-kick-1-pull — do two kicks per arm cycle to force separation. Swim 4 x 25m with this pattern, 15 seconds rest between reps.',
    focusAreas: ['timing', 'kick', 'breathing'],
  },
  {
    id: 'breaststroke-wide-pull-002',
    stroke: 'breaststroke',
    title: 'Pulling Arms Too Wide (or Too Far Back)',
    detectableFrom: ['deck_side', 'underwater'],
    description:
      'Elbows sweep past the shoulders, arms go wide, or hands pull all the way to the hips. Looks powerful but creates a huge frontal area and kills forward momentum.',
    cause:
      'Swimmers assume bigger movements mean more power. Common in people stronger in freestyle who carry over a long pull habit.',
    fix: "Keep elbows in front of your shoulders at all times. If you can't see them in your peripheral vision, you've pulled too far. Think of the pull as a heart shape, not a circle.",
    drill:
      'Forearm sculling – float face-down and scull with just forearms, keeping elbows nearly still. For competitive swimmers: work on early vertical forearm to catch more water with less arm extension.',
    focusAreas: ['pull_phase', 'catch', 'arm_entry'],
    badExamples: [
      {
        label: 'Arms past shoulder line — wide catch — NCAA overhead 2018',
        description:
          'Overhead broadcast: lane 1 hands and elbows extending past the shoulder line at the catch — arms too wide, reducing water hold and increasing frontal drag. Compare to lane 2 in the same frame for immediate contrast.',
        frames: [
          example('catch-wide-mixed-ncaa2018-t007', 'frame_01.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_06.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_11.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_16.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
    ],
    goodExamples: [
      {
        label: 'Elbows in front of shoulders — correct arm width — NCAA overhead 2018',
        description:
          'Overhead: lane 2 elbows staying in front of the shoulders through the full recovery and catch. Arm path contained inside the shoulder line — correct width for maximising water hold without creating a wide sweep.',
        frames: [
          example('catch-wide-mixed-ncaa2018-t007', 'frame_03.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_08.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_13.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_18.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
    ],
  },
  {
    id: 'breaststroke-sinking-hips-005',
    stroke: 'breaststroke',
    title: 'Sinking Hips and Poor Body Position',
    detectableFrom: ['overhead', 'deck_side', 'underwater'],
    description:
      'Hips sink low every stroke cycle. The body tilts close to vertical during the breath, then crashes back flat. Looks like fighting the water instead of riding on top of it.',
    cause:
      'Lifting the head too high during the breath (so hips drop to compensate), recovering arms too high above the surface (same effect), and weak core engagement.',
    fix: 'Keep the breathing motion small. During arm recovery, hands push forward at or just below the surface.',
    drill:
      'Streamline kick on front (SLOF) – hold streamline, kick breaststroke, time your breathing lift without taking a pull. A pool noodle tucked under the hips helps beginners feel the correct position for a few laps.',
    focusAreas: ['hip_position', 'body_position', 'breathing'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['underwater'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Excessive torso elevation driving hip drop — HS deck side',
        description:
          'Deck-level side view: swimmer exits the water too high during the breath, forcing hips into a very low underwater position. Classic seesaw at high-school level — excess head/torso rise redirects momentum downward rather than forward.',
        frames: [
          example('sinking-hips-bad-hs100br2-t008', 'frame_01.jpg'),
          example('sinking-hips-bad-hs100br2-t008', 'frame_06.jpg'),
          example('sinking-hips-bad-hs100br2-t008', 'frame_11.jpg'),
          example('sinking-hips-bad-hs100br2-t008', 'frame_16.jpg'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Hips too low — chest cannot clear water — HS deck side',
        description:
          'Side view: hips drop below the waterline during the breathing recovery, preventing the chest from clearing the water. Body angle too steep — increased frontal drag through the stroke cycle.',
        frames: [
          example('sinking-hips-bad-hs100br2-t013', 'frame_01.jpg'),
          example('sinking-hips-bad-hs100br2-t013', 'frame_06.jpg'),
          example('sinking-hips-bad-hs100br2-t013', 'frame_11.jpg'),
          example('sinking-hips-bad-hs100br2-t013', 'frame_16.jpg'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Forward gaze during glide — body line disruption — HS deck side',
        description:
          'Head looking straight ahead (eyes at horizon) instead of chin tucked down during the glide/streamline phase. Forward head position increases frontal drag and causes seesaw body-line disruption — the same mechanism as excessive breath lift, applied to the glide.',
        frames: [
          example('head-pos-bad-hs100br2-t038', 'frame_01.jpg'),
          example('head-pos-bad-hs100br2-t038', 'frame_06.jpg'),
          example('head-pos-bad-hs100br2-t038', 'frame_11.jpg'),
          example('head-pos-bad-hs100br2-t038', 'frame_16.jpg'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Severe hip drop — near-vertical body angle — HS deck side',
        description:
          'Most pronounced sinking-hip fault in this clip. Hips drop very low during kick recovery and glide — significant drag, horizontal body line completely lost. Body approaches near-vertical at the deepest point.',
        frames: [
          example('sinking-hips-bad-hs100br2-t046', 'frame_01.jpg'),
          example('sinking-hips-bad-hs100br2-t046', 'frame_06.jpg'),
          example('sinking-hips-bad-hs100br2-t046', 'frame_11.jpg'),
          example('sinking-hips-bad-hs100br2-t046', 'frame_16.jpg'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Early seesaw forming — hips beginning to drop — NCAA overhead 2018',
        description:
          'Overhead broadcast: lane 1 shows hips starting to drop below the surface — early-stage seesaw pattern. Compare directly to lane 3 in the same frame which maintains hip level (side-by-side contrast at race pace).',
        frames: [
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_01.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_06.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_11.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_16.jpg'),
        ],
        cameraAngles: ['overhead'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side', 'overhead'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Hip-level body line — NCAA overhead broadcast',
        description:
          'Overhead broadcast showing hips sitting at the waterline during the breath cycle. Body maintains horizontal alignment with minimal seesaw — forward momentum preserved. Controlled breath with minimal head rise keeps hips from dropping.',
        frames: [
          example('sinking-hips-good-ncaa2025-t633', 'frame_01.jpg'),
          example('sinking-hips-good-ncaa2025-t633', 'frame_05.jpg'),
          example('sinking-hips-good-ncaa2025-t633', 'frame_10.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Minimal head rise preserving hip position — NCAA overhead',
        description:
          'Overhead view: swimmer rises just enough to breathe then drives chin down as arms extend. Hips remain at the surface — no seesaw triggered by excessive head lift. Forward-directed wake confirms horizontal energy transfer.',
        frames: [
          example('breath-hips-good-ncaa2025-t558', 'frame_02.jpg'),
          example('breath-hips-good-ncaa2025-t558', 'frame_06.jpg'),
          example('breath-hips-good-ncaa2025-t558', 'frame_10.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Multi-lane hip-level comparison — NCAA overhead',
        description:
          'Three NCAA swimmers simultaneously maintaining hip level through the breath from overhead. All show forward-directed wake and tight body line — useful pattern for recognising correct body position at race pace.',
        frames: [
          example('breath-hips-good-ncaa2025-t610', 'frame_02.jpg'),
          example('breath-hips-good-ncaa2025-t610', 'frame_07.jpg'),
          example('breath-hips-good-ncaa2025-t610', 'frame_12.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Catch phase with hips level — NCAA overhead',
        description:
          'Overhead showing correct catch setup while hips remain at the waterline. Good horizontal body line maintained as the pull initiates — no premature hip drop triggered by the arm action.',
        frames: [
          example('catch-good-ncaa2025-t559', 'frame_02.jpg'),
          example('catch-good-ncaa2025-t559', 'frame_07.jpg'),
          example('catch-hips-good-ncaa2025-t621', 'frame_03.jpg'),
          example('catch-hips-good-ncaa2025-t621', 'frame_09.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Controlled downward drive after breath — hips at waterline — NCAA overhead 2018',
        description:
          'Overhead broadcast: lane 3 shows controlled downward momentum after the breath — hips stay at the waterline while the body transitions back to the glide. Forward energy maintained, no seesaw. Side-by-side with lane 1 which shows early hip drop for contrast.',
        frames: [
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_02.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_07.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_12.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_17.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Horizontal body, hips at waterline through breath — NCAA overhead 2018',
        description:
          'Overhead at 0:11 — body staying fully horizontal with hips at the waterline and head not rising excessively during the breath. Clean demonstration of correct body-position control at NCAA race pace.',
        frames: [
          example('sinking-hips-good-ncaa2018-t011', 'frame_01.jpg'),
          example('sinking-hips-good-ncaa2018-t011', 'frame_06.jpg'),
          example('sinking-hips-good-ncaa2018-t011', 'frame_11.jpg'),
          example('sinking-hips-good-ncaa2018-t011', 'frame_16.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Multi-lane minimal chin rise — hips held — NCAA overhead 2018',
        description:
          'Two lanes simultaneously showing minimal chin rise during the breath, keeping hips from dropping. Useful multi-lane pattern: forward-directed wake in both lanes confirms no energy redirected downward.',
        frames: [
          example('sinking-hips-good-ncaa2018-t022', 'frame_01.jpg'),
          example('sinking-hips-good-ncaa2018-t022', 'frame_06.jpg'),
          example('sinking-hips-good-ncaa2018-t022', 'frame_11.jpg'),
          example('sinking-hips-good-ncaa2018-t022', 'frame_16.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
    ],
  },
  {
    id: 'breaststroke-breath-timing-006',
    stroke: 'breaststroke',
    title: 'Breathing at the Wrong Moment',
    detectableFrom: ['overhead', 'deck_side'],
    description:
      'Head comes up with no arm support after the pull has already finished, so the whole body sinks. Or the swimmer holds their breath the entire cycle and exhales and inhales in one panicked burst.',
    cause:
      "Fear of not getting enough air. Beginners wait until the head is at its highest point before breathing, which is too late. Competitive swimmers sometimes breathe too late because they're focused on the pull.",
    fix: 'Exhale steadily into the water during the glide. Start the inhale as soon as the outsweep begins and your shoulders rise naturally. By the time your hands sweep inward, the breath should be done. Cue: "Breathe WITH the pull, not AFTER the pull."',
    drill:
      'Practice standing in shallow water doing the arm motion and timing the breath without the pressure of actually swimming.',
    focusAreas: ['breathing', 'timing', 'body_position'],
    badExamples: [
      {
        label: 'Late breath — excessive rise triggering seesaw — HS deck side',
        description:
          'Swimmer rises too high out of the water during the breath — momentum redirected downward rather than forward. Excessive head lift indicates the breath is initiated too late (after the pull rather than with it). Seesaw hip drop follows immediately.',
        frames: [
          example('sinking-hips-bad-hs100br2-t008', 'frame_03.jpg'),
          example('sinking-hips-bad-hs100br2-t008', 'frame_08.jpg'),
          example('sinking-hips-bad-hs100br2-t008', 'frame_13.jpg'),
          example('sinking-hips-bad-hs100br2-t008', 'frame_18.jpg'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Chin up, insufficient rise — mistimed breath — HS deck side',
        description:
          'Chin not tucked combined with insufficient torso rise — swimmer failed to clear the airway. Indicates breath timing is off: either starting too late or the pull did not generate enough lift. Poor head position compounds the fault.',
        frames: [
          example('head-pos-bad-hs100br2-t009', 'frame_03.jpg'),
          example('head-pos-bad-hs100br2-t009', 'frame_08.jpg'),
          example('head-pos-bad-hs100br2-t009', 'frame_13.jpg'),
          example('head-pos-bad-hs100br2-t009', 'frame_18.jpg'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Hips dropping into seesaw — breath timing fault — NCAA overhead 2018',
        description:
          'Overhead: lane 1 hips beginning to drop below the surface — early-stage seesaw caused by late or excessive breath. The hip drop here is the downstream consequence of the breath not being synchronised with the pull.',
        frames: [
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_03.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_08.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_13.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_18.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
    ],
    goodExamples: [
      {
        label: 'Breath WITH the pull — chin tucked, hips level',
        description:
          'Overhead broadcast showing breath timed to coincide with the arm pull phase. Swimmer rises just enough to clear the airway then drives chin down as arms extend — forward momentum preserved, no seesaw hip drop triggered.',
        frames: [
          example('breath-hips-good-ncaa2025-t558', 'frame_01.jpg'),
          example('breath-hips-good-ncaa2025-t558', 'frame_04.jpg'),
          example('breath-hips-good-ncaa2025-t558', 'frame_08.jpg'),
          example('breath-hips-good-ncaa2025-t558', 'frame_12.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Multi-lane correct breath timing — NCAA overhead',
        description:
          'Three NCAA swimmers simultaneously showing correct breath timing. All breathe early in the pull cycle, chin returns down well before the kick fires. Consistent forward-directed wake pattern confirms no energy redirected downward.',
        frames: [
          example('breath-hips-good-ncaa2025-t610', 'frame_01.jpg'),
          example('breath-hips-good-ncaa2025-t610', 'frame_05.jpg'),
          example('breath-hips-good-ncaa2025-t610', 'frame_10.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Controlled downward drive, hips level post-breath — NCAA overhead 2018',
        description:
          'Overhead 2018: lane 3 transitions from the breath back to the glide with a controlled downward drive — hips stay at the waterline throughout. Breath is clearly synchronised with the pull: the body rises and returns as one unit.',
        frames: [
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_04.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_09.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_14.jpg'),
          example('sinking-hips-mixed-ncaa2018-t009', 'frame_19.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
    ],
  },
  {
    id: 'breaststroke-catch-003',
    stroke: 'breaststroke',
    title: 'Poor Catch Mechanics',
    detectableFrom: ['deck_side', 'underwater'],
    description:
      'Elbows drop below the hands before any propulsive surface is established. Arms sweep too wide or too deep, slipping water rather than holding it. Looks like the arms are pushing down instead of pulling back.',
    cause:
      'Swimmers extend fully before bending the elbow, missing the early vertical forearm window. Common in people who learned breaststroke without coaching and default to a wide sweeping motion.',
    fix: 'Initiate the catch with the elbow high and outside. The forearm should be near-vertical before the pull begins. Think "elbows up, hands down" at the start of every pull.',
    drill:
      'Catch-up drill with fists closed — swim breaststroke with fists to force forearm engagement. Then open hands and try to recreate the same forearm pressure. 4 x 25m, 20 seconds rest.',
    focusAreas: ['catch', 'pull_phase', 'arm_entry'],
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
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Crossover entry — arm crossing centerline',
        description:
          'Hand enters across the body centerline causing hip snaking and a misdirected pull path.',
        frames: [example('catch-bad', 'frame_02.png'), example('catch-bad', 'frame_08.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Flat wrist — no downward hand pitch at entry',
        description: 'Hand enters flat rather than fingertips-down, delaying catch initiation.',
        frames: [example('catch-bad', 'frame_01.png'), example('catch-bad', 'frame_06.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Late catch initiation — straight arm pull',
        description:
          'Arm nearly fully extended with no elbow bend at what should be the catch moment. Swimmer relies on straight-arm pull instead of EVF.',
        frames: [example('catch-bad', 'frame_04.png'), example('catch-bad', 'frame_10.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Bilateral elbow dropout',
        description:
          'Both arms lose high elbow position simultaneously — no vertical forearm on either side.',
        frames: [example('catch-bad', 'frame_05.png'), example('catch-bad', 'frame_12.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Palm facing down not back',
        description:
          'Hand oriented toward pool floor rather than back wall, producing lift/brake force instead of propulsion.',
        frames: [example('catch-bad', 'frame_02.png'), example('catch-bad', 'frame_10.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Dead spot glide — lead arm paused flat',
        description:
          'Lead arm pauses flat on the surface instead of transitioning to catch, creating a deceleration dead spot.',
        frames: [example('catch-bad', 'frame_07.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Shoulder over-rotation',
        description:
          'Body rolled past 45° moving shoulder out of strong catch position and reducing mechanical advantage.',
        frames: [example('catch-bad', 'frame_08.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Shallow elbow sweep — arms too wide before catch',
        description:
          'Arms sweep laterally past shoulder-width before any vertical forearm position is established. Slipping water rather than catching it.',
        frames: [example('catch-bad', 'frame_03.png'), example('catch-bad', 'frame_05.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Elbow collapse mid-pull',
        description:
          'Elbow drops during the pull phase. All propulsion shifts to shoulder/upper arm rather than the larger forearm paddle surface.',
        frames: [example('catch-bad', 'frame_11.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Head lift disrupting catch',
        description:
          'Elevated head shifts weight backward so catching arm works uphill. Also prevents shoulder from dropping into the catch plane.',
        frames: [example('catch-bad', 'frame_06.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Over-reach depth',
        description:
          'Hand goes past natural catch depth, forcing swimmer to push water down before pushing it back.',
        frames: [example('catch-bad', 'frame_09.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Elbows at chest level — catch initiated too high — HS deck side',
        description:
          'Deck-level side view: elbows remain at chest height during the catch instead of dropping to rib cage or lower where EVF can be established. Pull initiates too high — arms push water down rather than back, losing propulsive force.',
        frames: [
          example('catch-bad-hs100br2-t024', 'frame_01.jpg'),
          example('catch-bad-hs100br2-t024', 'frame_06.jpg'),
          example('catch-bad-hs100br2-t024', 'frame_11.jpg'),
          example('catch-bad-hs100br2-t024', 'frame_16.jpg'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Catch too wide — hands and elbows past shoulder line — NCAA overhead 2018',
        description:
          'Overhead broadcast: lane 1 arms extending past the shoulder line at the catch, reducing water hold. Compare to lane 2 in the same frame which keeps elbows inside the shoulders — side-by-side contrast of correct vs. wide catch at race pace.',
        frames: [
          example('catch-wide-mixed-ncaa2018-t007', 'frame_01.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_06.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_11.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_16.jpg'),
        ],
        cameraAngles: ['overhead'],
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
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Correct entry angle — fingertips first',
        description:
          'Wrist cocked with fingers leading into water at a downward angle. No flat slap, no air bubbles trapped under palm.',
        frames: [example('catch-good', 'frame_05.png'), example('catch-good', 'frame_12.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Palm facing backward',
        description:
          'Hand pitched toward back wall not pool floor. Propulsive force directed horizontally.',
        frames: [example('catch-good', 'frame_02.png'), example('catch-good', 'frame_10.png')],
        cameraAngles: ['deck_side', 'underwater'],
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
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'No elbow collapse mid-pull',
        description:
          'High elbow maintained through the pull phase past the most common failure point.',
        frames: [example('catch-good', 'frame_07.png'), example('catch-good', 'frame_11.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Body rotation synced to catch',
        description: 'Torso roll timed to load the catch, adding rotation power to the arm pull.',
        frames: [example('catch-good', 'frame_06.png'), example('catch-good', 'frame_10.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Entry outside shoulder line',
        description:
          'Hand enters at or outside shoulder — no crossover. Sets up a straight pull path.',
        frames: [example('catch-good', 'frame_03.png'), example('catch-good', 'frame_05.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Full pull length achieved',
        description:
          'Arm travels from full extension to past the hip. Only possible when catch was set correctly at the start.',
        frames: [example('catch-good', 'frame_13.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Forearm as paddle surface',
        description:
          'Full inner forearm from wrist to elbow pressing water backward during the pull.',
        frames: [example('catch-good', 'frame_11.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Neutral head position at catch',
        description: 'Head down allowing horizontal body position so catch works on a level plane.',
        frames: [example('catch-good', 'frame_04.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Clean entry — no air bubbles',
        description:
          'No aeration under the palm at entry. Clean entry means the hand has solid water to catch against immediately.',
        frames: [example('catch-good', 'frame_12.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Symmetric bilateral timing',
        description:
          'Both arms at matching depth and angle viewed frontally. Hallmark of a well-timed breaststroke catch.',
        frames: [example('catch-good', 'frame_09.png')],
        cameraAngles: ['deck_side', 'underwater'],
      },
      {
        label: 'Elbows inside shoulder line — clean arm recovery — NCAA overhead 2018',
        description:
          'Overhead: lane 2 elbows staying in front of the shoulders through the full catch cycle — correct arm width and path. Compare directly to lane 1 in the same frame which sweeps too wide.',
        frames: [
          example('catch-wide-mixed-ncaa2018-t007', 'frame_03.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_08.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_13.jpg'),
          example('catch-wide-mixed-ncaa2018-t007', 'frame_18.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'EVF before pull — lane 4 — NCAA overhead 2018',
        description:
          'Overhead at 0:18: lane 4 with early vertical forearm fully established before the pull begins. Clean symmetric setup, arm width inside the shoulder line. Clear example of correct catch initiation at race pace.',
        frames: [
          example('catch-good-ncaa2018-t018', 'frame_01.jpg'),
          example('catch-good-ncaa2018-t018', 'frame_06.jpg'),
          example('catch-good-ncaa2018-t018', 'frame_11.jpg'),
          example('catch-good-ncaa2018-t018', 'frame_16.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
      {
        label: 'Multi-lane bilateral EVF — NCAA overhead 2018',
        description:
          'Two NCAA lanes simultaneously showing EVF with elbows high before the pull initiates. Multi-lane overhead comparison of elite catch mechanics — both lanes show correct arm width and symmetric setup.',
        frames: [
          example('catch-good-ncaa2018-t033', 'frame_01.jpg'),
          example('catch-good-ncaa2018-t033', 'frame_06.jpg'),
          example('catch-good-ncaa2018-t033', 'frame_11.jpg'),
          example('catch-good-ncaa2018-t033', 'frame_16.jpg'),
        ],
        cameraAngles: ['overhead'],
      },
    ],
  },
  {
    id: 'freestyle-head-position-004',
    stroke: 'freestyle',
    title: 'Poor Head Position',
    detectableFrom: ['overhead', 'deck_side', 'underwater'],
    description:
      'Head lifted out of the water with eyes looking forward rather than down. Creates a seesaw effect — raised head at the front forces hips and legs to sink at the back, turning the swimmer into a wall of drag.',
    cause:
      'Instinct to see where you are going. Anxiety about breathing causes swimmers to lift the head rather than rotate it. Common in beginners and triathletes who learned in open water.',
    fix: 'Look at the pool floor, not the wall ahead. One goggle should stay submerged on the breath. Use the bow wave trough to breathe — it creates a natural air pocket without any head lift.',
    drill:
      'Catch-up drill with a focus on keeping the crown of the head as the highest point at all times. 4 x 50m, breathing every 3 strokes, 20 seconds rest. Use a tempo trainer to keep stroke rate steady.',
    focusAreas: ['head_position', 'body_position', 'breathing'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Over-rotation on breath',
        description:
          'Head rotating beyond 90 degrees AND lifting simultaneously on the breath. One goggle should stay submerged.',
        frames: [example('head-position-bad', 'frame_08.png')],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Head lift with chin compression',
        description:
          'Head raised but chin tucked creating a neck crunch. Incorrect compensation by swimmers who know not to look forward.',
        frames: [example('head-position-bad', 'frame_09.png')],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Lumbar arch from head lift',
        description:
          'Lower back hollowing as compensation for elevated head. Increases drag profile at the hips.',
        frames: [
          example('head-position-bad', 'frame_11.png'),
          example('head-position-bad', 'frame_12.png'),
        ],
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
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
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Correct breath timing',
        description:
          'Breath taken at biomechanically correct moment — during the insweep/pull when body naturally rises.',
        frames: [example('head-position-good', 'frame_11.png')],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Downward forward gaze',
        description:
          'Eyes angled toward pool floor not at horizon. Confirms head is not hyperextended.',
        frames: [
          example('head-position-good', 'frame_03.png'),
          example('head-position-good', 'frame_09.png'),
        ],
        cameraAngles: ['deck_side'],
      },
      {
        label: 'Head tucked in streamline',
        description:
          'Head between extended arms rather than above arm line. Passive and relaxed — correct for the glide phase.',
        frames: [example('head-position-good', 'frame_07.png')],
        cameraAngles: ['deck_side'],
      },
    ],
  },
];

export function getTaxonomyByStroke(stroke: string): TaxonomyEntry[] {
  if (stroke === 'unknown') return SWIM_TAXONOMY;
  return SWIM_TAXONOMY.filter((entry) => entry.stroke === stroke);
}

export function getTaxonomyByStrokeAndAngle(
  stroke: string,
  cameraAngle: CameraAngle,
): TaxonomyEntry[] {
  const byStroke = getTaxonomyByStroke(stroke);
  return byStroke
    .filter((entry) => entry.detectableFrom.includes(cameraAngle))
    .map((entry) => ({
      ...entry,
      badExamples: entry.badExamples?.filter(
        (g) => !g.cameraAngles || g.cameraAngles.includes(cameraAngle),
      ),
      goodExamples: entry.goodExamples?.filter(
        (g) => !g.cameraAngles || g.cameraAngles.includes(cameraAngle),
      ),
    }));
}

export function getTaxonomyByFocusAreas(
  entries: TaxonomyEntry[],
  focusAreas: string[],
): TaxonomyEntry[] {
  if (focusAreas.length === 0 || focusAreas.includes('overall')) return entries;
  return entries.filter((entry) => entry.focusAreas.some((f) => focusAreas.includes(f)));
}

export function formatTaxonomyForPrompt(entries: TaxonomyEntry[]): string {
  if (entries.length === 0) return '';
  const hasExamples = (e: TaxonomyEntry) =>
    (e.badExamples?.length ?? 0) > 0 || (e.goodExamples?.length ?? 0) > 0;
  const sorted = [...entries].sort((a, b) => Number(hasExamples(b)) - Number(hasExamples(a)));
  return sorted
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
