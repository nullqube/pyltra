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
import ConfigValidator from '../domain/config/ConfigValidator.ts';
import { Renderer } from '../renderer/Renderer.ts';
import { AssetPipeline } from '../domain/assets/AssetPipeline.ts';
import { RuntimeAware } from './runtime/RuntimeAware.ts';
import { Humanize } from '../utils/Humanize.ts';
export class BuildManager extends RuntimeAware {
  assets: any;
  project: any;
  renderer: any;
  validator: any;
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
    async build(options: any = {}) {
        await this.validate();
        await this.clean();
        await this.renderer.renderAll();
        await this.assets.processAll();
        if(options.report.size) {
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
        const summary = this.diagnostics.getSummary();
        console.log(`Total artifacts: ${summary.total}`);
        console.log(`Total size: ${Humanize.fileSize(summary.totalSize)}`);
        console.log('-----------------------------------');
        const report = this.diagnostics.buildSizeReport();
        for (const [type, data] of Object.entries(report.byType) as [string, any][]) {
            console.log(`${type}:\n  Count: ${data.count}\n  Total Size: ${Humanize.fileSize(data.totalSize)}`);
        }
    }
}
