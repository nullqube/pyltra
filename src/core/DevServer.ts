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

import { RuntimeAware } from './runtime/RuntimeAware.ts'
import type { Runtime } from './runtime/Runtime.ts';
import type { Project } from '../project/Project.ts';
import type { BuildManager } from './BuildManager.ts';

export class DevServer extends RuntimeAware{
  buildManager: BuildManager;
  isRebuilding: boolean;
  pendingReloadMode: 'styles' | 'full' | null;
  project: Project;
  server: browserSync.BrowserSyncInstance;

    constructor(runtime: Runtime, project: Project, buildManager: BuildManager) {
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

        chokidar.watch(srcPath).on('change', changedPath => {
            this.queueRebuild(changedPath);
        });
    }

    queueRebuild(changedPath: string) {
        const srcPath = this.project.getSourcePath();
        const nextReloadMode = this.isStyleFile(changedPath) ? 'styles' : 'full';

        if (this.shouldLogVerbose) {
            this.info(`File changed: ${path.relative(srcPath, changedPath)}`);
        }

        this.mergeReloadMode(nextReloadMode);

        if (this.isRebuilding) return;

        void this.flushRebuilds();
    }

    mergeReloadMode(reloadMode: 'styles' | 'full') {
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
                    const message = err instanceof Error ? err.message : String(err);
                    this.error(`Dev rebuild failed: ${message}`);
                }
            }
        } finally {
            this.isRebuilding = false;
        }
    }

    async rebuild(reloadMode: 'styles' | 'full') {
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

    isStyleFile(filePath: string) {
        const extension = path.extname(filePath).toLowerCase();
        return extension === '.css' || extension === '.scss';
    }
}
