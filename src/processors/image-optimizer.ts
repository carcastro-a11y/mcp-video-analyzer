import sharp from 'sharp';

interface OptimizeOptions {
  maxWidth?: number;
  quality?: number;
}

export async function optimizeFrame(
  inputPath: string,
  outputPath: string,
  options: OptimizeOptions = {},
): Promise<string> {
  const maxWidth = options.maxWidth ?? 800;
  const quality = options.quality ?? 70;

  await sharp(inputPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality })
    .toFile(outputPath);

  return outputPath;
}

export async function optimizeFrames(
  inputPaths: string[],
  outputDir: string,
  options: OptimizeOptions = {},
): Promise<string[]> {
  const results: string[] = [];

  for (const inputPath of inputPaths) {
    const filename = inputPath.split(/[/\\]/).pop() ?? 'frame.jpg';
    const outputPath = `${outputDir}/opt_${filename}`;
    await optimizeFrame(inputPath, outputPath, options);
    results.push(outputPath);
  }

  return results;
}
