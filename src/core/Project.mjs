/**
 * Project
 * -------
 * Represents a loaded pyltra project.
 *
 * Holds:
 * - cwd
 * - mode
 * - loaded config
 * - derived paths
 *
 * This removes global singletons and hidden state.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
export class Project {
    constructor({ cwd = process.cwd(), mode = 'dev' } = {}) {
        this.cwd = cwd;
        this.mode = mode;
        this.config = null;
        this.paths = null;
        // this.configLoader = new ConfigLoader(cwd);
    }

    /**
     * Loads config.yaml and derives paths.
     */
    load() {
        const configPath = path.join(this.cwd, 'config.yaml');

        if( !fs.existsSync(configPath)) {
            throw new Error('config.yaml not found in project root.')
        }

        const raw = yaml.load(fs.readFileSync(configPath, 'utf8'));

        // TODO: use configloader feature or it as seperate class
        // including different versions
        this.config = raw;

        // this.config = this.configLoader.load();
        // this.paths = this.configLoader.getPaths();
        this.paths = {
            src: 'src',
            dist: 'dist',
            data: 'src/data',
            templates: 'src/templates'
        };
    }

    /**
     * Returns language codes.
     */
    languages() {
        return this.config.languages.map( l => l.code );
    }
    
    /**
     * Returns true if running in production mode.
     */
    isProd() {
        return this.mode == 'prod';
    }

    /**
     * Initializes new project (scaffold logic goes here)
     */
    async initialize(options, responses) {
        console.log('Project initialization not implemented in this snippet.');
    }
}