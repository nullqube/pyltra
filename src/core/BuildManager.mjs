/**
 * BuildManager
 * ------------
 * Coordinates full build lifecycle.
 *
 * Responsibilities:
 * - Validate
 * - Clean
 * - Render
 * - Process assets
 *
 * Does NOT handle CLI or server.
 */

import fs from 'fs';
import path from 'path';
import ConfigValidator from '../domain/config/ConfigValidator.mjs';
import { Renderer } from '../renderer/Renderer.mjs';
import { AssetPipeline } from '../domain/assets/AssetPipeline.mjs';
import { RuntimeAware } from './runtime/RuntimeAware.mjs';
export class BuildManager extends RuntimeAware {
    constructor( runtime, project ) {
        super(runtime);
        this.project = project;

        this.renderer = new Renderer(project);
        this.assets = new AssetPipeline(project);
        this.validator = new ConfigValidator(project);
    }

    /**
     * Full build lifecycle
     */
    async build() {
        await this.validate();
        await this.clean();
        await this.renderer.renderAll();
        await this.assets.processAll();
    }

    /**
     * Validates project
     */
    async validate() {
        return this.validator.validate();
    }

    /**
     * Cleans dist folder
     */
    async clean() {
        const distPath = path.join(this.project.cwd, this.project.paths.dist);

        if (fs.existsSync(distPath)) {
            fs.rmSync(distPath, { recursive: true, force: true });
        }

        fs.mkdirSync(distPath, { recursive: true });
    }
}
