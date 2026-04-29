/**
 * TemplateEngine
 * --------------
 * Wraps Nunjucks rendering.
 */

import nunjucks from 'nunjucks';
import path from 'path';

export class TemplateEngine {

    constructor(project) {
        this.project = project;

        const templatePath = path.join(
            project.cwd,
            project.paths.templates
        );

        this.env = nunjucks.configure(templatePath, {
            autoescape: true
        });
    }

    /**
     * Renders template with data
     */
    render(templateName, data) {
        return this.env.render(templateName, data);
    }
}