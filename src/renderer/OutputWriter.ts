/**
 * OutputWriter
 *
 * Responsible for persisting rendered output to the filesystem.
 *
 * The OutputWriter receives rendered HTML from the Renderer and writes it
 * to the appropriate location in the dist/ directory. It also determines
 * output paths for pages and collection items based on the project structure.
 *
 * Responsibilities:
 * - Write rendered content to disk
 * - Determine output paths for pages and collection items
 * - Manage filesystem interactions related to generated output
 *
 * Does not:
 * - Render templates
 * - Load template data
 * - Coordinate the rendering process
 * - Parse or manage project configuration
 *
 * Within the rendering pipeline:
 * - Renderer orchestrates rendering and produces HTML
 * - DataLoader provides rendering data
 * - TemplateRepository provides template sources
 * - OutputWriter persists the final output
 */


import path from 'path';
import type { Project } from '../project/Project.ts';
import type { FilesystemAdapter } from '../data/adapters/FilesystemAdapter.ts';

export class OutputWriter {
  fs: FilesystemAdapter;
  project: Project;
    constructor(project: Project, fsAdapter: FilesystemAdapter) {
        this.project = project;
        this.fs = fsAdapter;
    }

    async writeBundle(fileName: string, content: string) {
        const outputPath = path.join(
            this.project.getDistPath(),
            fileName
        );

        await this.fs.writeText(outputPath, content);
    }
    
    async writePage(language: string, pageName: string, content: string) {
        const outputPath = this.getPageOutputPath(language, pageName);

        await this.fs.writeText(outputPath, content);

        return outputPath;
    }

    getPageOutputPath(language: string, pageName: string) {
        const fileName = `${pageName}.html`;

        return path.join(
            this.project.getDistPath(),
            language,
            fileName
        );
    }

    async writeCollectionItem(language: string, collectionName: string, itemSlug: string, content: string) {
        const outputPath = path.join(
            this.project.getDistPath(),
            language,
            collectionName,
            `${itemSlug}.html`
        );

        await this.fs.writeText(outputPath, content);

        return outputPath;
    }
}