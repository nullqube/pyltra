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

export class OutputWriter {
  fs: any;
  project: any;
    constructor(project, fsAdapter) {
        this.project = project;
        this.fs = fsAdapter;
    }

    async writeBundle(fileName, content) {
        const outputPath = path.join(
            this.project.getDistPath(),
            fileName
        );

        await this.fs.writeText(outputPath, content);
    }
    
    async writePage(language, pageName, content) {
        const outputPath = this.getPageOutputPath(language, pageName);

        await this.fs.writeText(outputPath, content);

        return outputPath;
    }

    getPageOutputPath(language, pageName) {
        const fileName = `${pageName}.html`;

        return path.join(
            this.project.getDistPath(),
            language,
            fileName
        );
    }

    async writeCollectionItem(language, collectionName, itemSlug, content) {
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