/**
 * Renderer
 * --------
 * Transforms loaded project data and templates into HTML files.
 * 
 * Coordinates page and collection rendering for a loaded project.
 * Renderer does not own project state, scan content data, run the build,
 * process assets, serve files, or watch the filesystem. It receives a loaded
 * Project and asks DataLoader for template-ready render context.
 * Owns:
 * - Template rendering flow
 * - Page/collection render orchestration
 *
 * Does not own:
 * - Filesystem access details
 * - Config loading
 * - Data loading policy
 */

import path from 'path';

import htmlMinifier from 'html-minifier';

import { RuntimeAware } from "../core/runtime/RuntimeAware.mjs";
import { FilesystemAdapter } from '../data/adapters/FilesystemAdapter.mjs';
import { createNunjucksEnvironment } from './NunjucksEnvironment.mjs';
import { TemplateRepository } from "./TemplateRepository.mjs";
import { OutputWriter } from './OutputWriter.mjs';

const HTML_MINIFY_OPTIONS = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
};
export class Renderer extends RuntimeAware {
    constructor(input, options = {}) {
        // Supports both new Renderer(project, options) and
        // new Renderer({ project, dataLoader, environment, runtime }).
        // If the first argument has a "project" property, treat it as the
        // dependency object; otherwise treat the first argument as the project
        // and read optional dependencies from the second argument.
        const hasProjectOption = input && Object.hasOwn(input, 'project');
        const runtime = hasProjectOption ? input.runtime : options.runtime;
        const project = hasProjectOption ? input.project : input;
        const dataLoader = hasProjectOption ? input.dataLoader : options.dataLoader;
        const environment = hasProjectOption ? input.environment : options.environment;

        super({ runtime });
        this.project = project;
        this.dataLoader = dataLoader ?? project.getData();
        this.env = environment || createNunjucksEnvironment(project);
        this.fsAdapter = new FilesystemAdapter(this.project);
        this.templateRepository = new TemplateRepository(this.project, this.fsAdapter);
        this.outputWriter = new OutputWriter(this.project, this.fsAdapter);
    }

    /**
     * Renders all configured languages, collection items, and bundle files.
     */
    async renderAll() {
        for (const lang of this.project.getLanguages()) {
            await this.renderLanguage(lang);
        }

        await this.renderBundles();
    }

    /**
     * Renders all page templates and collection item pages for one language.
     *
     * @param {string} lang
     */
    async renderLanguage(lang) {
        await this.renderPages(lang);
        await this.renderCollections(lang);
    }

    /**
     * Renders top-level HTML templates to dist/<lang>/.
     *
     * @param {string} lang
     */
    async renderPages(lang) {
        const templates = await this.templateRepository.getPageTemplates();

        for( const template of templates ) {
            const result = await this._getPageContext(lang, template.name);

            if (result.status === 'skip') {
                this.#warnSkippedPage(lang, pageName, result.reason);
                continue;
            }

            const context = result.context;
            this.info(`Building ${lang}/${template.name}`);
            let htmlContent = this._renderTemplate(template.fileName, context);
            htmlContent = this.#maybeMinify(htmlContent);

            await this.outputWriter.writePage(lang, template.name, htmlContent);
        }
    }

    /**
     * Renders configured collection item pages to dist/<lang>/<collection>/.
     *
     * @param {string} lang
     */
    async renderCollections(lang) {
        const config = this.project.getConfig();
        for( const [collectionName, collectionConfig] of Object.entries(config.collections) ) {
            const {item_template: itemTemplate, items = []} = collectionConfig;
            if (!itemTemplate) {
                this.warn(`Skipping collection "${collectionName}" because item_template is missing.`);
                continue;
            }
            for( const item of items ) {
                const slug = item.slug ?? item;
                if (!slug) {
                    // TODO: This should be a validation error, not a warning. 
                    //  The collection item is malformed and we can't render it at all,
                    //  so we should fail the build rather than silently skip it.
                    // Maybe we should make one with our default formula 
                    // something like: slug=collectionName + index, and warn that we're doing that?
                    this.warn(`Skipping invalid item in collection "${collectionName}".`);
                    continue;
                }
                const result = await this.dataLoader.getCollectionItemContext(lang, collectionName, slug);
                if (result.status === 'skip') {
                    this.#warnSkippedCollectionItem(
                        lang,
                        collectionName,
                        slug,
                        result.reason
                    );

                    continue;
                }

                const context = result.context;
                this.info(`Building ${lang}/${collectionName}/${slug}`);
                // this.#maybeMinify(html);
                let htmlContent = this._renderTemplate(itemTemplate, context);
                if(this.isProduction) {
                    htmlContent = htmlMinifier.minify(htmlContent, HTML_MINIFY_OPTIONS);
                }
                await this.outputWriter.writeCollectionItem(lang, collectionName, slug, htmlContent);
            }
        }
    }

    /**
     * Copies configured bundle HTML files from src/ to dist/.
     */
    async renderBundles() {
        const config = this.project.getConfig();
        for( const fileName of config.bundles || [] ) {
            let content = await this.fsAdapter.readText(path.join(this.project.getSourcePath(), fileName));
            this.info(`Copied bundle: ${fileName}`);
            if(this.isProduction) {
                content = htmlMinifier.minify(content, HTML_MINIFY_OPTIONS);
            }
            await this.outputWriter.writeBundle(fileName, content);
        }
    }

    _renderTemplate(templateName, context) {
        try {
            return this.env.render(templateName, context);
        } catch (err) {
            throw new Error(
                `Renderer failed to render template "${templateName}": ${err.message}`,
                { cause: err }
            );
        }
    }

    _getPageContext(lang, pageName) {
        const result = this.dataLoader.getPageContext(lang, pageName);

        if (result.status !== 'render') {
            return result;
        }

        const collections = this.#getCollectionsContext(lang);

        return {
            ...result,
            context: {
                ...result.context,
                ...collections
            }
        };
    }

    #getCollectionsContext(lang) {
        const collectionConfigs = this.project.getConfig().collections ?? {};
        const collections = {};

        for (const collectionName of Object.keys(collectionConfigs)) {
            collections[collectionName] =
                this.dataLoader.getCollection(lang, collectionName);
        }

        return collections;
    }

    #maybeMinify(html) {
        if (!this.isProduction) {
            return html;
        }

        return minify(html, HTML_MINIFY_OPTIONS);
    }

    #warnSkippedPage(lang, pageName, reason) {
        if (reason === 'draft') {
            this.warn(`Skipping draft page: ${lang}/${pageName}`);
            this.warn('If this is unexpected, check the page data file for draft=true.');
            return;
        }

        this.warn(`Skipping page: ${lang}/${pageName}`);
    }

    #warnSkippedCollectionItem(lang, collectionName, slug, reason) {
        if (reason === 'draft') {
            this.warn(`Skipping draft: ${lang}/${collectionName}/${slug}`);
            this.warn(`If this is unexpected, check the item's data file for draft=true.`);
            return;
        }

        if (reason === 'missing-item') {
            this.warn(`Skipping missing collection item: ${lang}/${collectionName}/${slug}`);
            this.warn('If this is unexpected, check that the item data file exists and provides a matching slug.');
            return;
        }

        this.warn(`Skipping collection item: ${lang}/${collectionName}/${slug}`);
    }
}
