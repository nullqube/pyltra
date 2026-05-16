/**
 * DevServer
 * ---------
 * Handles development server and file watchers.
 *
 * Wraps BrowserSync or any other server implementation.
 */

import browserSync from 'browser-sync';
import chokidar from 'chokidar';
import path from 'path';

import { RuntimeAware } from './runtime/RuntimeAware.mjs'
export class DevServer extends RuntimeAware{

    constructor(runtime, project, buildManager) {
        super(runtime);
        this.project = project;
        this.buildManager = buildManager;
        this.server = browserSync.create();
    }

    /**
     * Starts dev server and watchers
     */
    async start() {

        await this.buildManager.build();

        const distPath = path.join(this.project.cwd, this.project.paths.dist);

        this.server.init({
            server: distPath,
            open: true
        });

        this.watch();
    }

    /**
     * Watches src directory and rebuilds on change
     */
    watch() {
        const srcPath = path.join(this.project.cwd, this.project.paths.src);

        chokidar.watch(srcPath).on('change', async () => {
            if( this.shouldLogVerbose ) {
                console.log('File changed. Rebuilding...');
            }
            await this.buildManager.build();
            this.server.reload();
        });
    }
}