/**
 * Project
 * -------
 * Represents a loaded pyltra project.
 *
 * Holds:
 * - cwd
 * - mode
 * - Loads and exposes config
 * - derived paths
 *
 * This removes global singletons and hidden state.
 */

import { ConfigLoader } from '../domain/config/ConfigLoader.mjs';
import { ProjectScaffolder } from './scaffolding/ProjectScaffolder.mjs'

export class Project {
    constructor({ cwd = process.cwd(), mode = 'dev' } = {}) {
        this.cwd = cwd;
        this.mode = mode;
        /** @type {boolean} */
        this.isProd = mode !== 'dev';
        this.configLoader = new ConfigLoader(cwd, this.isProd);

        /** @type {SiteConfig|null} */
        this.config = null;

        /** @type {PathsConfig|null} */
        this.paths = null;

        /** @type {DataLoader|null} */
        this.data = null;
    }

    /**
     * Loads config.yaml and derives paths.
     */
    load() {
        this.config = this.configLoader.load();
        this.paths = this.configLoader.getPaths();

        // Initialize runtime services
        this.data = new DataLoader({ project: this });
    }

    /**
     * Initializes new project (scaffold logic goes here)
     */
    async initialize(options, responses) {
        // console.log('Project initialization not implemented in this snippet.');
        await ProjectScaffolder.create(options, responses);
    }

    /** @returns {SiteConfig} */
    getConfig() {
        if (!this.config) {
            throw new Error('Project not loaded. Call project.load() first.');
        }
        return this.config;
    }

    /** @returns {PathsConfig} */
    getPaths() {
        if (!this.paths) {
            throw new Error('Project not loaded. Call project.load() first.');
        }
        return this.paths;
    }

    /** @returns {DataLoader} */
    getData() {
        if (!this.data) {
            throw new Error('Project not loaded. Call project.load() first.');
        }
        return this.data;
    }

    /** 
     * Returns language codes.
     * @returns {string[]} */
    getLanguages() {
        return this.getConfig().languages.map(l => l.code);
    }

    /**
     * Returns true if running in production mode. 
     * @returns {boolean} */
    getIsProd() {
        return this.isProd;
    }
}