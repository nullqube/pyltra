import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, expect, it } from 'vitest';
import { AssetPipeline } from '../src/domain/assets/AssetPipeline.ts';
import { Runtime } from '../src/core/runtime/Runtime.ts';
import type { Project } from '../src/project/Project.ts';

const roots: string[] = [];
afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

it.each([false, true])('optimizes lossless graphics without enlarging them (metadata: %s)', async (withMetadata) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyltra-images-'));
    roots.push(root);
    const source = path.join(root, 'src');
    const dist = path.join(root, 'dist');
    const imageDir = path.join(source, 'assets/img/nested');
    fs.mkdirSync(imageDir, { recursive: true });
    const pixels = Buffer.alloc(256 * 256 * 3);
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            pixels.fill((x + y) % 2 ? 255 : 0, (y * 256 + x) * 3, (y * 256 + x + 1) * 3);
        }
    }
    let input = sharp(pixels, { raw: { width: 256, height: 256, channels: 3 } });
    if (withMetadata) input = input.withExif({ IFD0: { Copyright: 'x'.repeat(4096) } });
    const original = await input.webp({ lossless: true, effort: 6 }).toBuffer();
    const lossy = await sharp(original).webp({ quality: 75 }).toBuffer();
    expect(lossy.length).toBeGreaterThan(original.length);
    fs.writeFileSync(path.join(imageDir, 'pattern.webp'), original);
    const pipeline = new AssetPipeline(Runtime.fromCLI({ command: 'build', environment: 'test' }), {
        getSourcePath: () => source,
        getDistPath: () => dist,
    } as Project);
    await pipeline.optimizeImages();
    const output = fs.readFileSync(path.join(dist, 'assets/img/nested/pattern.webp'));
    expect(output.length).toBeLessThanOrEqual(original.length);
    expect(await sharp(output).raw().toBuffer()).toEqual(pixels);
    if (withMetadata) expect(output.length).toBeLessThan(original.length);
    else expect(output).toEqual(original);
});
