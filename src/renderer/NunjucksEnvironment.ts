import path from 'path';

import nunjucks from 'nunjucks';
import type { Environment } from 'nunjucks';

import { registerTemplateFilters } from './TemplateFilters.ts';
import type { Project } from '../project/Project.ts';

function normalizeTemplateDirectory(project: Project): string {
    // ProjectPaths.get() returns unknown (dynamic path bag); the templates path
    // is always a string.
    const templatesPath = project.getPaths().get('templates') as string;
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
 * @param {import('../project/Project.ts').Project} project
 * @returns {import('nunjucks').Environment}
 */
export function createNunjucksEnvironment(project: Project): Environment {
    const env = nunjucks.configure(normalizeTemplateDirectory(project), {
        autoescape: true
    });

    registerTemplateFilters(env);

    return env;
}
