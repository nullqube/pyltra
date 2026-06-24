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

import { Runtime } from './runtime/Runtime.mjs';
import { RuntimeAware } from './runtime/RuntimeAware.mjs';
import { Project } from '../project/Project.mjs';
import { BuildManager } from './BuildManager.mjs';
import { DevServer } from './DevServer.mjs';
import { ProjectScaffolder } from './scaffolding/ProjectScaffolder.mjs';
import { ConfigLoader } from '../domain/config/ConfigLoader.mjs';
import { DataLoader } from '../data/DataLoader.mjs';

export class PyltraEngine extends RuntimeAware {

    /**
     * @param {Object} options
     * @param {string} [options.cwd] - Working directory of the project
     * @param {'dev' | 'prod'} [options.mode]
     */
    constructor( options = {} ) {
        const runtime = options.runtime ?? new Runtime({
            environment: options.mode === 'prod' ? 'production' : 'development'
        });

        super({ runtime });
        this.options = {
            cwd: options.cwd ?? process.cwd(),
            configFile: options.configFile ?? 'config.yaml'
        };

        this.project = null;
        this.configLoader = null;
        this.dataLoader = null;
        this.buildManager = null;
        this.devServer = null;

        this._booted = false;
        this._loaded = false;
    }

    async run(input) {
        switch(input.command) {
            case 'init':
                await this.init(input.args);
                break;
            case 'build':
                await this.build(input.args);
                break;
            case 'validate':
                await this.validate(input.args);
                break;
            case 'serve':
                await this.serve(input.args);
                break;
            case 'clean':
                await this.clean(input.args);
                break;
            default:
                throw new Error(`Unknown command: ${input.command}`);
        }
    }
    /**
     * Bootstraps engine-level services.
     */
    async boot() {
        if(this._booted) return;

        this.configLoader = new ConfigLoader({
            cwd: this.options.cwd,
            configFile: this.options.configFile,
            runtime: this.runtime
        });

        this._booted = true;
    }

    /**
     * Load a project 
     */
    async load() {
        await this.boot();
        if(this._loaded) return;

        const config = this.configLoader.load();
        const paths = this.configLoader.getPaths();

        this.project = new Project({
            cwd: this.options.cwd,
            config,
            paths,
            data: {}
        });

        this.dataLoader = new DataLoader({
            runtime: this.runtime,
            project: this.project
        });
        this.project.setData(this.dataLoader);

        this.buildManager = new BuildManager(this.runtime, this.project);
        this.devServer = new DevServer(this.runtime, this.project, this.buildManager);

        this._loaded = true;
    }

    /**
     * Initializes a new project (used by CLI init command)
     */
    async init(args) {
        // TODO: Add validation for project name (e.g. no spaces, special characters, etc.)
        // TODO: Add option to specify a custom directory for the project instead of always using the current working directory
        // TODO: Add option to skip prompts and use defaults for all options (e.g. `--defaults` flag)
        // TODO: Add option to specify a config file or template to use for the project instead of always using a default config
        // TODO: Add option to initialize a git repository and make the first commit as part of the init process
        // TODO: Add option to install dependencies after initialization (e.g. `--install` flag)
        
        await ProjectScaffolder.create(args);
    }

    /**
     * Build the project
     */
    async build(args) {
        await this.load();
        await this.buildManager.build();
    }

    /**
     * Validates project configuration and structure
     */
    async validate(args) {
        await this.load();
        await this.buildManager.validate();
    }

    /**
     * Starts dev server + watchers
     */
    async serve(args) {
        await this.load();
        await this.devServer.start();
    }

    async start() {
        await this.serve();
    }

    /**
     * Cleans output directory
     */
    async clean(args) {
        await this.load();
        await this.buildManager.clean();
    }
}
