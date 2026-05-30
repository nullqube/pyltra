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

export class AssetPipeline {

    constructor(project) {
        this.project = project;
    }

    async processAll() {
        await this.copyAssets();
    }

    async copyAssets() {

        const srcAssets = path.join(this.project.getSourcePath(), 'assets');
        const distAssets = path.join(this.project.getDistPath(), 'assets');

        if (!fs.existsSync(srcAssets)) return;

        fs.mkdirSync(distAssets, { recursive: true });

        fs.cpSync(srcAssets, distAssets, { recursive: true });
    }
}
