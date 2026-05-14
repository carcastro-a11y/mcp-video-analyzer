import type Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import sharp from 'sharp';
import type { ExampleGroup, TaxonomyEntry } from '../data/swim-taxonomy.js';

interface LabelEntry {
  label: string;
  description: string;
}

const MAX_FRAMES_PER_GROUP = 2;
const MAX_TOTAL_REFERENCE_IMAGES = 10;
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
  let imageCount = 0;

  for (const entry of entries) {
    if (imageCount >= MAX_TOTAL_REFERENCE_IMAGES) break;
    const hasBad = (entry.badExamples?.length ?? 0) > 0;
    const hasGood = (entry.goodExamples?.length ?? 0) > 0;
    if (!hasBad && !hasGood) continue;

    if (hasBad) {
      const badBlocks = await buildExampleBlocks(entry.badExamples ?? []);
      const imageBlockCount = badBlocks.filter((b) => b.type === 'image').length;
      if (imageCount + imageBlockCount > MAX_TOTAL_REFERENCE_IMAGES) break;
      blocks.push({ type: 'text', text: `\n### ${entry.title} — BAD form (what to flag)\n` });
      blocks.push(...badBlocks);
      imageCount += imageBlockCount;
    }

    if (hasGood && imageCount < MAX_TOTAL_REFERENCE_IMAGES) {
      const goodBlocks = await buildExampleBlocks(entry.goodExamples ?? []);
      const imageBlockCount = goodBlocks.filter((b) => b.type === 'image').length;
      if (imageCount + imageBlockCount > MAX_TOTAL_REFERENCE_IMAGES) break;
      blocks.push({
        type: 'text',
        text: `\n### ${entry.title} — CORRECT form (what to aim for)\n`,
      });
      blocks.push(...goodBlocks);
      imageCount += imageBlockCount;
    }
  }

  // Mark the last block for prompt caching — reference images are static per stroke
  if (blocks.length > 0) {
    Object.assign(blocks[blocks.length - 1], { cache_control: { type: 'ephemeral' } });
  }

  return blocks;
}
