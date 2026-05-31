/**
 * DevServer
 * ---------
 * Handles development server and file watchers.
 *
 * Wraps BrowserSync or any other server implementation.
 */

import browserSync from 'browser-sync';
import chokidar from 'chokidar';

import { RuntimeAware } from './runtime/RuntimeAware.mjs'
export class DevServer extends RuntimeAware{

    constructor(runtime, project, buildManager) {
        super({ runtime });
        this.project = project;
        this.buildManager = buildManager;
        this.server = browserSync.create();
    }

    /**
     * Starts dev server and watchers
     */
    async start() {

        await this.buildManager.build();

        const distPath = this.project.getDistPath();

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
        const srcPath = this.project.getSourcePath();

        chokidar.watch(srcPath).on('change', async () => {
            if( this.shouldLogVerbose ) {
                this.info('File changed. Rebuilding...');
            }
            this.project.getData()?.invalidateCache?.();
            await this.buildManager.build();
            this.server.reload();
        });
    }
}
