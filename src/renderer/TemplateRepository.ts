/**
 * TemplateRepository
 * -------------------
 * This module defines the TemplateRepository class, which is responsible 
 * for managing page templates in the project. 
 * It provides methods to retrieve and process template files from 
 * the project directory.
 */
import path from 'path';
function stripExtension(fileName) {
    return fileName.replace(/\.[^.]+$/, '');
}

function normalizeTemplatePath(value) {
    return value.replaceAll(path.sep, '/');
}

export class TemplateRepository {
  fs: any;
  project: any;
    constructor(project, fsAdapter) {
        this.project = project;
        this.fs = fsAdapter;
    }

    async getPageTemplates() {
        const paths = this.project.getPaths();
        const templatePattern = paths.get('templates');

        const entries = await this.fs.glob(templatePattern, {
            onlyFiles: true,
            unique: true
        });

        return entries
            .sort()
            .map(templatePath => this.createPageTemplate(templatePath));
    }

    createPageTemplate(templatePath) {
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
