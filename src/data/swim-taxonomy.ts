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
