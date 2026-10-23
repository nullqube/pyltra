/**
 * TemplateRepository
 * -------------------
 * This module defines the TemplateRepository class, which is responsible 
 * for managing page templates in the project. 
 * It provides methods to retrieve and process template files from 
 * the project directory.
 */
import path from 'path';
import type { Project } from '../project/Project.ts';
import type { FilesystemAdapter } from '../data/adapters/FilesystemAdapter.ts';

export interface PageTemplate {
    name: string;
    fileName: string;
    templatePath: string;
}

function stripExtension(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, '');
}

function normalizeTemplatePath(value: string): string {
    return value.replaceAll(path.sep, '/');
}

export class TemplateRepository {
  fs: FilesystemAdapter;
  project: Project;
    constructor(project: Project, fsAdapter: FilesystemAdapter) {
        this.project = project;
        this.fs = fsAdapter;
    }

    async getPageTemplates() {
        const paths = this.project.getPaths();
        // ProjectPaths.get() returns unknown (dynamic path bag); the templates
        // pattern is always a glob string.
        const templatePattern = paths.get('templates') as string;

        const entries = await this.fs.glob(templatePattern, {
            onlyFiles: true,
            unique: true
        });

        return entries
            .sort()
            .map(templatePath => this.createPageTemplate(templatePath));
    }

    createPageTemplate(templatePath: string): PageTemplate {
        const normalizedPath = normalizeTemplatePath(templatePath);
        const fileName = path.basename(normalizedPath);
        const name = stripExtension(fileName);

        return {
            name,
            fileName,
            templatePath: normalizedPath
        };
    }
}
