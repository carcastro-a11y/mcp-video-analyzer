import type Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import sharp from 'sharp';
import type { ExampleGroup, TaxonomyEntry } from '../data/swim-taxonomy.js';

interface LabelEntry {
  label: string;
  description: string;
}

const MAX_FRAMES_PER_GROUP = 2;
const MAX_REF_IMAGE_WIDTH = 800;

async function resizeImageToJpeg(filePath: string): Promise<Buffer> {
  return sharp(filePath)
    .resize({ width: MAX_REF_IMAGE_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();
}

async function buildExampleBlocks(groups: ExampleGroup[]): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];

  // Collect all labels per unique frame path, preserving first-seen order
  const frameLabels = new Map<string, LabelEntry[]>();
  for (const group of groups) {
    let count = 0;
    for (const framePath of group.frames) {
      if (!fs.existsSync(framePath)) continue;
      if (count >= MAX_FRAMES_PER_GROUP) break;
      const existing = frameLabels.get(framePath);
      if (existing) {
        existing.push({ label: group.label, description: group.description });
      } else {
        frameLabels.set(framePath, [{ label: group.label, description: group.description }]);
      }
      count++;
    }
  }

  for (const [framePath, labels] of frameLabels) {
    const labelText = labels.map((l) => `**${l.label}**: ${l.description}`).join('\n');
    blocks.push({ type: 'text', text: labelText });
    const resized = await resizeImageToJpeg(framePath);
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: resized.toString('base64') },
    });
  }

  return blocks;
}

export async function buildReferenceBlocks(
  entries: TaxonomyEntry[],
): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const entry of entries) {
    const hasBad = (entry.badExamples?.length ?? 0) > 0;
    const hasGood = (entry.goodExamples?.length ?? 0) > 0;
    if (!hasBad && !hasGood) continue;

    if (hasBad) {
      blocks.push({ type: 'text', text: `\n### ${entry.title} — BAD form (what to flag)\n` });
      blocks.push(...(await buildExampleBlocks(entry.badExamples ?? [])));
    }

    if (hasGood) {
      blocks.push({
        type: 'text',
        text: `\n### ${entry.title} — CORRECT form (what to aim for)\n`,
      });
      blocks.push(...(await buildExampleBlocks(entry.goodExamples ?? [])));
    }
  }

  // Mark the last block for prompt caching — reference images are static per stroke
  if (blocks.length > 0) {
    Object.assign(blocks[blocks.length - 1], { cache_control: { type: 'ephemeral' } });
  }

  return blocks;
}
