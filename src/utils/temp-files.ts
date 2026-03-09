import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const activeTempDirs = new Set<string>();

export async function createTempDir(prefix = 'mcp-video-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  activeTempDirs.add(dir);
  return dir;
}

export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await rm(dirPath, { recursive: true, force: true });
  } finally {
    activeTempDirs.delete(dirPath);
  }
}

export function getTempFilePath(dir: string, name: string): string {
  return join(dir, name);
}

function cleanupAllTempDirs(): void {
  for (const dir of activeTempDirs) {
    rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
  activeTempDirs.clear();
}

process.on('exit', cleanupAllTempDirs);
