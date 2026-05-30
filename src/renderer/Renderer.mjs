import fs from 'fs';
import path from 'path';

import fastGlob from 'fast-glob';
import htmlMinifier from 'html-minifier';

import { createNunjucksEnvironment } from './NunjucksEnvironment.mjs';

const { minify } = htmlMinifier;

const HTML_MINIFY_OPTIONS = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
};

function toPosixPath(value) {
    return value.replaceAll(path.sep, '/');
}

function resolveProjectFile(project, filePath) {
    return path.isAbsolute(filePath)
        ? filePath
        : path.join(project.getRoot(), filePath);
}

function stripHtmlExtension(fileName) {
    return fileName.replace(/\.html$/i, '');
}

/**
 * Renderer
 * --------
 * Transforms loaded project data and templates into HTML files.
 *
 * Renderer does not own project state, scan content data, run the build,
 * process assets, serve files, or watch the filesystem. It receives a loaded
 * Project and asks DataLoader for template-ready render context.
 */
export class Renderer {
    /**
     * @param {import('../project/Project.mjs').Project} project
     * @param {Object} [options]
     * @param {import('nunjucks').Environment} [options.environment]
     */
    constructor(project, options = {}) {
        this.project = project;
        this.dataLoader = options.dataLoader || project.getData();
        this.env = options.environment || createNunjucksEnvironment(project);
    }

    /**
     * Renders all configured languages, collection items, and bundle files.
     *
     * @returns {Promise<Object[]>}
     */
    async renderAll() {
        const outputs = [];

        for (const lang of this.project.getLanguages()) {
            outputs.push(...await this.renderLanguage(lang));
        }

        outputs.push(...await this.renderBundles());
        return outputs;
    }

    /**
     * Renders all page templates and collection item pages for one language.
     *
     * @param {string} lang
     * @returns {Promise<Object[]>}
     */
    async renderLanguage(lang) {
        const outputs = [];

        outputs.push(...await this.renderPages(lang));
        outputs.push(...await this.renderCollectionItems(lang));

        return outputs;
    }

    /**
     * Renders top-level HTML templates to dist/<lang>/.
     *
     * @param {string} lang
     * @returns {Promise<Object[]>}
     */
    async renderPages(lang) {
        const outputs = [];
        const templates = await this._findPageTemplates();

        for (const templatePath of templates) {
            const templateName = path.basename(templatePath);
            const pageName = stripHtmlExtension(templateName);
            const context = this._getPageContext(lang, pageName);

            if (!context) {
                console.log(`Skipping draft page: ${lang}/${pageName}`);
                continue;
            }

            console.log(`Building ${lang}/${pageName}`);

            const html = this._renderTemplate(templateName, context);
            const outputPath = path.join(this.project.getDistPath(), lang, templateName);

            this._writeHtml(outputPath, html);

            outputs.push({
                type: 'page',
                lang,
                page: pageName,
                template: templateName,
                outputPath
            });
        }

        return outputs;
    }

    /**
     * Renders configured collection item pages to dist/<lang>/<collection>/.
     *
     * @param {string} lang
     * @returns {Promise<Object[]>}
     */
    async renderCollectionItems(lang) {
        const outputs = [];
        const config = this.project.getConfig();

        for (const [collectionName, collectionConfig] of Object.entries(config.collections)) {
            const { item_template: itemTemplate, items = [] } = collectionConfig;

            for (const item of items) {
                if (!this._templateExists(itemTemplate)) {
                    continue;
                }

                const context = this.dataLoader.getCollectionItemContext(
                    lang,
                    collectionName,
                    item.slug
                );

                if (!context) {
                    console.log(`Skipping draft: ${lang}/${collectionName}/${item.slug}`);
                    continue;
                }

                const html = this._renderTemplate(itemTemplate, context);
                const outputPath = path.join(
                    this.project.getDistPath(),
                    lang,
                    collectionName,
                    `${item.slug}.html`
                );

                this._writeHtml(outputPath, html);

                outputs.push({
                    type: 'collection-item',
                    lang,
                    collection: collectionName,
                    slug: item.slug,
                    template: itemTemplate,
                    outputPath
                });
            }
        }

        return outputs;
    }

    /**
     * Copies configured bundle HTML files from src/ to dist/.
     *
     * @returns {Promise<Object[]>}
     */
    async renderBundles() {
        const outputs = [];
        const config = this.project.getConfig();

        for (const fileName of config.bundles) {
            const sourcePath = path.join(this.project.getSourcePath(), fileName);

            if (!fs.existsSync(sourcePath)) {
                continue;
            }

            const outputPath = path.join(this.project.getDistPath(), fileName);
            const html = fs.readFileSync(sourcePath, 'utf8');

            this._writeHtml(outputPath, html);

            outputs.push({
                type: 'bundle',
                file: fileName,
                outputPath
            });
        }

        return outputs;
    }

    _getPageContext(lang, pageName) {
        const context = this.dataLoader.getPageContext(lang, pageName);

        if (!context) return null;

        const config = this.project.getConfig();
        const collections = {};

        for (const collectionName of Object.keys(config.collections)) {
            collections[collectionName] = this.dataLoader.getCollection(lang, collectionName);
        }

        return {
            ...context,
            ...collections
        };
    }

    async _findPageTemplates() {
        const paths = this.project.getPaths();
        const templatePattern = resolveProjectFile(this.project, paths.templates);
        const entries = await fastGlob(toPosixPath(templatePattern), {
            onlyFiles: true,
            unique: true
        });

        return entries.sort();
    }

    _renderTemplate(templateName, context) {
        try {
            return this.env.render(templateName, context);
        } catch (error) {
            throw new Error(`HTML error (${templateName}): ${error.message}`);
        }
    }

    _writeHtml(outputPath, html) {
        const output = this.project.getIsProd()
            ? minify(html, HTML_MINIFY_OPTIONS)
            : html;

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, output, 'utf8');
    }

    _templateExists(templateName) {
        return fs.existsSync(path.join(this._getTemplateDirectory(), templateName));
    }

    _getTemplateDirectory() {
        const paths = this.project.getPaths();
        const normalized = paths.templates.replaceAll('\\', '/');
        const beforeGlob = normalized.includes('*')
            ? normalized.split('*')[0]
            : normalized;
        const directory = beforeGlob.endsWith('/')
            ? beforeGlob.slice(0, -1)
            : path.dirname(beforeGlob);

        return resolveProjectFile(this.project, directory);
    }
}
