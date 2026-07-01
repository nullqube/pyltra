import { marked } from 'marked';

/**
 * Registers the template filters currently exposed by the Gulp renderer.
 *
 * @param {import('nunjucks').Environment} env
 */
export function registerTemplateFilters(env) {
    env.addFilter('markdown', (content) => {
        if (!content) return '';
        return marked(content);
    });

    env.addFilter('date', (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    });

    env.addFilter('slugify', (str) => {
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

    env.addFilter('truncate', (str, length) => {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.slice(0, length) + '...';
    });

    env.addFilter('tojson', (obj) => JSON.stringify(obj, null, 2));
}
