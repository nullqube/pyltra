/**
 * AssetPipeline
 * -------------
 * Processes assets.
 *
 * This simplified version copies assets.
 * You can reintroduce:
 * - SCSS compile
 * - Minify
 * - Image optimization
 */

import fs from 'fs';
import path from 'path';

import autoprefixer from 'autoprefixer';
import fastGlob from 'fast-glob';
import postcss from 'postcss';
import * as sass from 'sass';

import { RuntimeAware } from '../../core/runtime/RuntimeAware.mjs';

export class AssetPipeline extends RuntimeAware {

    constructor(runtime, project) {
        super({ runtime });
        this.project = project;
    }

    async processAll() {
        await this.compileScss();
        await this.copyAssets();
    }

    async compileScss() {
        const scssRoot = path.join(this.project.getSourcePath(), 'assets', 'scss');
        const cssRoot = path.join(this.project.getDistPath(), 'assets', 'css');

        if (!fs.existsSync(scssRoot)) return;

        const files = await fastGlob('**/*.scss', {
            cwd: scssRoot,
            onlyFiles: true,
            ignore: ['**/_*.scss']
        });

        await Promise.all(files.map(async file => {
            const sourcePath = path.join(scssRoot, file);
            const outputPath = path.join(
                cssRoot,
                file.replace(/\.scss$/i, '.css')
            );
            const result = sass.compile(sourcePath, {
                style: this.isProduction ? 'compressed' : 'expanded'
            });
            const processed = await postcss([autoprefixer()]).process(result.css, {
                from: sourcePath,
                to: outputPath,
                map: false
            });

            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, processed.css);
        }));
    }

    async copyAssets() {
        const srcAssets = path.join(this.project.getSourcePath(), 'assets');
        const distAssets = path.join(this.project.getDistPath(), 'assets');

        if (!fs.existsSync(srcAssets)) return;

        fs.mkdirSync(distAssets, { recursive: true });
        fs.cpSync(srcAssets, distAssets, {
            recursive: true,
            filter: source => {
                const relative = path.relative(srcAssets, source);
                return relative === '' || !relative.split(path.sep).includes('scss');
            }
        });
    }
}
