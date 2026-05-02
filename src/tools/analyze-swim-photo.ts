import Anthropic from '@anthropic-ai/sdk';
import type { FastMCP } from 'fastmcp';
import { UserError, imageContent } from 'fastmcp';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { formatTaxonomyForPrompt, getTaxonomyByStroke } from '../data/swim-taxonomy.js';
import { buildReferenceBlocks } from '../utils/reference-images.js';

const MEDIA_TYPES: Record<string, 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function loadImageBlock(source: string): Anthropic.ImageBlockParam {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return { type: 'image', source: { type: 'url', url: source } };
  }
  if (!fs.existsSync(source)) {
    throw new UserError(`Image file not found: ${source}`);
  }
  const ext = path.extname(source).toLowerCase();
  const mediaType = MEDIA_TYPES[ext] ?? 'image/jpeg';
  const data = fs.readFileSync(source).toString('base64');
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
}

const AnalyzeSwimPhotoSchema = z.object({
  source: z
    .string()
    .describe(
      'Absolute path to a local image file (.jpg, .png, .webp) or a direct image URL (http/https)',
    ),
  stroke: z
    .enum(['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'unknown'])
    .default('unknown')
    .optional()
    .describe('Swimming stroke being performed (helps focus the analysis)'),
  focus: z
    .array(
      z.enum([
        'arm_entry',
        'pull_phase',
        'kick',
        'body_rotation',
        'head_position',
        'breathing',
        'turn',
        'start',
        'overall',
      ]),
    )
    .default(['overall'])
    .optional()
    .describe('Specific aspects of technique to focus on'),
});

export function registerAnalyzeSwimPhoto(server: FastMCP): void {
  server.addTool({
    name: 'analyze_swim_photo',
    description: `Analyze a single swim photo using Claude's vision AI with labeled reference examples.

Accepts a local image file path or direct image URL, loads the relevant good/bad reference
examples from the taxonomy, and sends everything to Claude for technique feedback.

Use this when:
- You have a still photo of a swimmer and want technique feedback
- You want to compare a frame against the labeled reference examples
- A coach wants to annotate or review a specific position

Requires ANTHROPIC_API_KEY in the environment.`,
    parameters: AnalyzeSwimPhotoSchema,
    annotations: {
      title: 'Analyze Swim Photo',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    execute: async (args) => {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new UserError(
          'ANTHROPIC_API_KEY environment variable is not set. Add it to your .env file.',
        );
      }

      const stroke = args.stroke ?? 'unknown';
      const focus = args.focus ?? ['overall'];
      const strokeLabel = stroke === 'unknown' ? 'swimming' : stroke;
      const focusLabel =
        focus.includes('overall') || focus.length === 0
          ? 'overall technique'
          : focus.map((f) => f.replace(/_/g, ' ')).join(', ');

      let imageBlock: Anthropic.ImageBlockParam;
      try {
        imageBlock = loadImageBlock(args.source);
      } catch (err) {
        if (err instanceof UserError) throw err;
        throw new UserError(`Failed to load image from: ${args.source}`);
      }

      const taxonomyEntries = getTaxonomyByStroke(stroke);
      const taxonomySection = formatTaxonomyForPrompt(taxonomyEntries);
      const referenceBlocks = buildReferenceBlocks(taxonomyEntries);

      const systemPrompt =
        `You are an expert swimming coach with deep knowledge of competitive swimming technique.\n` +
        `You analyze photos to provide specific, actionable technique feedback.\n` +
        `Be precise about what you observe — reference body position, timing cues, and mechanics directly.\n` +
        `Structure your feedback clearly with strengths, areas for improvement, and specific drills to fix issues.` +
        (taxonomySection.length > 0
          ? `\n\n---\n\n## Known common mistakes for this stroke\n\n${taxonomySection}`
          : '');

      const userPrompt = `This is a still photo of a swimmer performing the ${strokeLabel} stroke.
Please analyze the swimmer's ${focusLabel}.

Note: This is a single frame — base your analysis on what is visible in this position.
Use the reference examples above to calibrate your assessment of what is good or needs correction.

Provide your analysis in this structure:

## Stroke: ${strokeLabel.charAt(0).toUpperCase() + strokeLabel.slice(1)}
## Focus Areas: ${focusLabel}

### What I Observe
(Describe what you see — body position, limb placement, alignment)

### Strengths
(What the swimmer is doing well in this frame)

### Areas for Improvement
(Specific technique issues visible, with reference to the labeled examples above where relevant)

### Recommended Drills
(3–5 specific drills or exercises to address the issues found)

### Summary
(One paragraph coaching summary)`;

      const userContent: Anthropic.ContentBlockParam[] = [];
      if (referenceBlocks.length > 0) {
        userContent.push({
          type: 'text',
          text: '## Reference Examples\nUse these labeled examples to calibrate your analysis:\n',
        });
        userContent.push(...referenceBlocks);
        userContent.push({ type: 'text', text: '\n## Photo for Analysis\n' });
      }
      userContent.push(imageBlock, { type: 'text', text: userPrompt });

      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
      });

      const analysisText =
        response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ??
        'No analysis returned.';

      const metadata = {
        stroke,
        focus,
        source: args.source,
        referenceGroupsLoaded: referenceBlocks.length > 0,
        model: response.model,
        usage: response.usage,
      };

      const content: ({ type: 'text'; text: string } | Awaited<ReturnType<typeof imageContent>>)[] =
        [
          { type: 'text' as const, text: analysisText },
          {
            type: 'text' as const,
            text: `\n\n---\n_Analyzed using ${response.model}_`,
          },
          { type: 'text' as const, text: JSON.stringify(metadata, null, 2) },
        ];

      if (typeof args.source === 'string' && !args.source.startsWith('http')) {
        content.push(await imageContent({ path: args.source }));
      }

      return { content };
    },
  });
}
