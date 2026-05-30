/**
 * OutputWriter
 * ------------
 * This module defines the OutputWriter class, which is responsible for writing
 * the rendered HTML output to the file system. 
 * It provides methods to write page outputs and collection items to the appropriate
 * locations in the dist/ directory based on the project configuration.
 * The OutputWriter is used by the Renderer to save the generated HTML files
 * after rendering templates with the provided data context.
 * 
 * OutputWriter owns:
 * - Writing rendered HTML to the filesystem
 * - Determining output paths for pages and collection items
 * 
 * OutputWriter does not own:
 * - Template rendering logic
 * - Data loading logic
 * - Project configuration details
 * - Orchestration of the rendering process
 * 
 * Responsibilities are separated as follows:
 * - OutputWriter: handles writing rendered content to disk
 * - Renderer: handles template rendering and orchestrating the rendering flow
 * - DataLoader: handles loading data for templates
 * - TemplateRepository: handles retrieving template files
 * 
 * This separation allows for better modularity and maintainability of the codebase.
 * Each class has a clear responsibility and can be developed and tested independently.
 * 
 * Renderer owns:
 * - Template rendering logic
 * - Orchestration of the rendering flow (rendering pages, collections, bundles)
 * - Interacting with DataLoader to get context for rendering
 * - Interacting with TemplateRepository to get templates for rendering
 * 
 * Renderer does not own:
 * - Writing rendered HTML to the filesystem (handled by OutputWriter)
 * - Data loading logic (handled by DataLoader)
 * - Project configuration details (handled by Project)
 * - Filesystem access details (handled by OutputWriter and TemplateRepository)
 * 
 * DataLoader owns:
 * - Loading data for templates based on language and page/collection item
 * - Providing fallback values when data files are missing or empty
 * 
 * DataLoader does not own:
 * - Template rendering logic (handled by Renderer)
 * - Writing rendered HTML to the filesystem (handled by OutputWriter)
 * - Project configuration details (handled by Project)
 * - Orchestration of the rendering process (handled by Renderer)
 * 
 * TemplateRepository owns:
 * - Retrieving template files from the project directory
 * - Processing template file paths and names for use in rendering
 * 
 * TemplateRepository does not own:
 * - Template rendering logic (handled by Renderer)
 * - Data loading logic (handled by DataLoader)
 * - Writing rendered HTML to the filesystem (handled by OutputWriter)
 * - Project configuration details (handled by Project)
 * - Orchestration of the rendering process (handled by Renderer)
 */

import path from 'path';

export class OutputWriter {
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