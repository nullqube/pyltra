import { marked } from 'marked';
import type { Environment } from 'nunjucks';

/**
 * Registers the template filters currently exposed by the Gulp renderer.
 */
export function registerTemplateFilters(env: Environment) {
    env.addFilter('markdown', (content: string) => {
        if (!content) return '';
        return marked(content);
    });

    env.addFilter('date', (date: string | number | Date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    });

    env.addFilter('slugify', (str: string) => {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    });

    env.addFilter('truncate', (str: string, length: number) => {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.slice(0, length) + '...';
    });

    env.addFilter('tojson', (obj: unknown) => JSON.stringify(obj, null, 2));
}
