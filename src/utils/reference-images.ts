import type Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import type { TaxonomyEntry } from '../data/swim-taxonomy.js';

export function buildReferenceBlocks(entries: TaxonomyEntry[]): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const entry of entries) {
    const hasBad = (entry.badExamples?.length ?? 0) > 0;
    const hasGood = (entry.goodExamples?.length ?? 0) > 0;
    if (!hasBad && !hasGood) continue;

    if (hasBad) {
      blocks.push({ type: 'text', text: `\n### ${entry.title} — BAD form (what to flag)\n` });
      for (const group of entry.badExamples ?? []) {
        blocks.push({ type: 'text', text: `**${group.label}**: ${group.description}` });
        for (const framePath of group.frames) {
          if (!fs.existsSync(framePath)) continue;
          const data = fs.readFileSync(framePath).toString('base64');
          blocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data } });
        }
      }
    }

    if (hasGood) {
      blocks.push({
        type: 'text',
        text: `\n### ${entry.title} — CORRECT form (what to aim for)\n`,
      });
      for (const group of entry.goodExamples ?? []) {
        blocks.push({ type: 'text', text: `**${group.label}**: ${group.description}` });
        for (const framePath of group.frames) {
          if (!fs.existsSync(framePath)) continue;
          const data = fs.readFileSync(framePath).toString('base64');
          blocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data } });
        }
      }
    }
  }

  // Mark the last block for prompt caching — reference images are static per stroke
  if (blocks.length > 0) {
    Object.assign(blocks[blocks.length - 1], { cache_control: { type: 'ephemeral' } });
  }

  return blocks;
}
