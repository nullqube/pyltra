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
        super({ runtime });
        this.project = project;
        this.buildManager = buildManager;
        this.server = browserSync.create();
        this.isRebuilding = false;
        this.pendingReloadMode = null;
    }

    /**
     * Starts dev server and watchers
     */
    async start() {

        await this.buildManager.build({
            report: {
                size: 0
            }
        });

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

        chokidar.watch(srcPath).on('change', changedPath => {
            this.queueRebuild(changedPath);
        });
    }

    queueRebuild(changedPath) {
        const srcPath = this.project.getSourcePath();
        const nextReloadMode = this.isStyleFile(changedPath) ? 'styles' : 'full';

        if (this.shouldLogVerbose) {
            this.info(`File changed: ${path.relative(srcPath, changedPath)}`);
        }

        this.mergeReloadMode(nextReloadMode);

        if (this.isRebuilding) return;

        void this.flushRebuilds();
    }

    mergeReloadMode(reloadMode) {
        this.pendingReloadMode = this.pendingReloadMode === 'full'
            ? 'full'
            : reloadMode;
    }

    async flushRebuilds() {
        this.isRebuilding = true;

        try {
            while (this.pendingReloadMode) {
                const reloadMode = this.pendingReloadMode;
                this.pendingReloadMode = null;

                try {
                    await this.rebuild(reloadMode);
                } catch (err) {
                    this.error(`Dev rebuild failed: ${err.message}`);
                }
            }
        } finally {
            this.isRebuilding = false;
        }
    }

    async rebuild(reloadMode) {
        if (this.shouldLogVerbose) {
            this.info('Rebuilding...');
        }

        this.project.getData()?.invalidateCache?.();
        await this.buildManager.build();

        if (reloadMode === 'styles') {
            this.server.reload('*.css');
            return;
        }

        this.server.reload();
    }

    isStyleFile(filePath) {
        const extension = path.extname(filePath).toLowerCase();
        return extension === '.css' || extension === '.scss';
    }
}
