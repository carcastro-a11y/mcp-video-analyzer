const LOOM_PATTERN = /^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([a-f0-9-]+)/i;

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']);

type Platform = 'loom' | 'direct';

export function detectPlatform(url: string): Platform | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (LOOM_PATTERN.test(url)) {
      return 'loom';
    }

    const ext = getExtension(parsed.pathname);
    if (ext && VIDEO_EXTENSIONS.has(ext)) {
      return 'direct';
    }

    return null;
  } catch {
    return null;
  }
}

export function extractLoomId(url: string): string | null {
  if (!url) return null;

  const match = url.match(LOOM_PATTERN);
  return match ? match[1] : null;
}

function getExtension(pathname: string): string | null {
  const lastDot = pathname.lastIndexOf('.');
  if (lastDot === -1) return null;
  return pathname.slice(lastDot).toLowerCase();
}
