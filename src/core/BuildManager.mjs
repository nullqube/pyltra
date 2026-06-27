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
import ConfigValidator from '../domain/config/ConfigValidator.mjs';
import { Renderer } from '../renderer/Renderer.mjs';
import { AssetPipeline } from '../domain/assets/AssetPipeline.mjs';
import { RuntimeAware } from './runtime/RuntimeAware.mjs';
export class BuildManager extends RuntimeAware {
    constructor( runtime, project ) {
        super({ runtime });
        this.project = project;

        this.renderer = new Renderer({
            runtime: this.runtime,
            project
        });
        this.assets = new AssetPipeline(this.runtime, project);
        this.validator = new ConfigValidator(project);
    }

    /**
     * Full build lifecycle
     */
    async build(bReportSize) {
        await this.validate();
        await this.clean();
        await this.renderer.renderAll();
        await this.assets.processAll();
        if(bReportSize) {
            this.printSummary();
        }
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
        const distPath = this.project.getDistPath();

        if (fs.existsSync(distPath)) {
            fs.rmSync(distPath, { recursive: true, force: true });
        }

        fs.mkdirSync(distPath, { recursive: true });
    }

    printSummary() {
        const summary = this.diagnostics.buildSizeReport();
        console.log(`Total artifacts: ${summary.total}`);
        console.log(`Total size: ${summary.totalSize} bytes`);
        const report = this.buildSizeReport();
        for (const [type, data] of Object.entries(report.byType)) {
            console.log(`Type: ${type}, Count: ${data.count}, Total Size: ${data.totalSize} bytes`);
        }
    }
}
