// 
// PyltraEngine
// -------------
// Main application orchestrator.
// 
// This class represents the public API of the system.
// Both CLI and Web UI must interact ONLY with this class.
//
// Responsibilities:
// - Load project
// - Set mode (dev/prod)
// - Coordinate build lifecycle
// - Start development server
// - Validate project
//
// This class does NOT:
// - Render templates
// - Process assets
// - Read YAML directly
//
// It delegates everything to lower layers.
//

import { Project } from './Project.mjs';
import { BuildManager } from './BuildManager.mjs';
import { DevServer } from './DevServer.mjs';

export class PyltraEngine {

    /**
     * @param {Object} options
     * @param {string} [options.cwd] - Working directory of the project
     * @param {'dev' | 'prod'} [options.mode]
     */
    constructor( options = {} ) {
        this.options = {
            cwd: process.cwd(),
            mode: 'dev',
            ...options
        }

        this.project = null;
        this.buildManager = null;
        this.devServer = null;

        this._booted = false;
        this._loaded = false;
    }

    /**
     * Boostraps the system (lazy init)
     */
    async boot() {
        if(this._booted) return;

        this.project = new Project(this.options);
        this.buildManager = new BuildManager(this.project);
        this.devServer = new DevServer(this.project, this.buildManager);

        this._booted = true;
    }

    /**
     * Load a project 
     */
    async load() {
        await this.boot();
        if(this._loaded) return;
        await this.project.load();
        this._loaded = true;
    }

    /**
     * Initializes a new project (used by CLI init command)
     */
    async init(initOptions, responses) {
        const project = new Project({ cwd: process.cwd(), mode: this.options.mode });
        await project.initialize(initOptions, responses);
    }

    /**
     * Build the project
     */
    async build() {
        await this.load();
        await this.buildManager.build();
    }

    /**
     * Validates project configuration and structure
     */
    async validate() {
        await this.load();
        await this.buildManager.validate();
    }

    /**
     * Starts dev server + watchers
     */
    async serve() {
        await this.load();
        await this.devServer.start();
    }
}