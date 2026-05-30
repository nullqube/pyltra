import path from 'path';

import nunjucks from 'nunjucks';

import { registerTemplateFilters } from './TemplateFilters.mjs';

function normalizeTemplateDirectory(project) {
    const templatesPath = project.getPaths().templates || 'src/templates/*.html';
    const normalized = templatesPath.replaceAll('\\', '/');

    if (!normalized.includes('*')) {
        return path.isAbsolute(templatesPath)
            ? templatesPath
            : path.join(project.getRoot(), templatesPath);
    }

    const beforeGlob = normalized.split('*')[0];
    const directory = beforeGlob.endsWith('/')
        ? beforeGlob.slice(0, -1)
        : path.dirname(beforeGlob);

    return path.isAbsolute(directory)
        ? directory
        : path.join(project.getRoot(), directory);
}

/**
 * Creates the Nunjucks environment used by the v2 renderer.
 *
 * @param {import('../project/Project.mjs').Project} project
 * @returns {import('nunjucks').Environment}
 */
export function createNunjucksEnvironment(project) {
    const env = nunjucks.configure(normalizeTemplateDirectory(project), {
        autoescape: true
    });

    registerTemplateFilters(env);

    return env;
}
