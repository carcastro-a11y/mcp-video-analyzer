import path from 'path';
import { fileURLToPath } from 'url';

const IMAGES_DIR = path.join(fileURLToPath(new URL('.', import.meta.url)), 'swim-reference-images');

const img = (...filenames: string[]) => filenames.map((f) => path.join(IMAGES_DIR, f));

type Stroke = 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly';

interface TaxonomyEntry {
  id: string;
  stroke: Stroke;
  title: string;
  description: string;
  cause: string;
  fix: string;
  drill: string;
  referenceImages?: string[];
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
    id: 'breaststroke-rushing-stroke-007',
    stroke: 'breaststroke',
    title: 'Rushing the Stroke (Skipping the Glide)',
    description:
      'Swimmer goes straight from kick into the next pull with zero pause. High stroke rate, lots of splashing, barely any forward movement.',
    cause:
      'Swimmers panic about losing momentum. Competitive swimmers sometimes confuse faster stroke rate with faster swimming. In breaststroke, distance per stroke matters more than turnover for most events.',
    fix: 'Glide for one to two seconds after each kick. Count "one-Mississippi" in streamline before the next pull. For competitive swimmers: sprint breaststroke (50m) uses less glide than distance (200m), but even in a sprint the glide should never be zero.',
    drill:
      'Stroke count challenge – swim 25m and count your strokes, then repeat trying to reduce the count. This forces a longer glide and more distance per cycle.',
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
