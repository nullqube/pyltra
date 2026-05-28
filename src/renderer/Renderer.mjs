/**
 * Renderer
 * --------
 * Coordinates page and collection rendering for a loaded project.
 *
 * Owns:
 * - Template rendering flow
 * - Page/collection render orchestration
 *
 * Does not own:
 * - Filesystem access details
 * - Config loading
 * - Data loading policy
 */

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
        // This makes the constructor support two calling styles:
        // 1. new Renderer(project, options)
        // 2. new Renderer({ project, dataLoader, environment, runtime })
        // The second style allows for more flexible dependency injection,
        // while the first style is simpler for common use.
        // The presence of the "project" property is used to detect which 
        // style is being used.
        // If "project" is present, we assume the first style and treat 
        // the input as the project.
        // If "project" is not present, we assume the second style and 
        // destructure the input for dependencies.
        // This approach allows for backward compatibility while also enabling
        // more advanced usage when needed.
        // Note: This is a bit of a hack and can be confusing, so it should be
        // used with caution. In a more complex application, it might be better
        // to have separate factory functions or static methods for different 
        // construction styles instead of overloading the constructor like this.
        const hasProjectOption = input && Object.hasOwn(input, 'project');
        const runtime = hasProjectOption ? input.runtime : options.runtime;
        const project = hasProjectOption ? input.project : input;
        const dataLoader = hasProjectOption ? input.dataLoader : options.dataLoader;
        const environment = hasProjectOption ? input.environment : options.environment;

        super(runtime);
        this.project = project;
        this.dataLoader = dataLoader ?? project.getData();
        this.env = environment || createNunjucksEnvironment(project);
        this.fsAdapter = new FilesystemAdapter(this.project);
        this.templateRepository = new TemplateRepository(this.project, this.fsAdapter);
        this.outputWriter = new OutputWriter(this.project, this.fsAdapter);
    }

    async renderAll() {
        for (const lang of this.project.getLanguages()) {
            await this.renderLanguage(lang);
        }

        await this.renderBundles();
        return outputs;
    }

    async renderLanguage(lang) {
        await this.renderPages(lang);
        await this.renderCollections(lang);
    }

    async renderPages(lang) {
        const templates = this.templateRepository.getPageTemplates();

        for( const template of templates ) {
            const context = await this._getPageContext(lang, template.name);

            if( !context ) {
                console.warn(`No context found for page "${template.name}" in language "${lang}". Skipping.`);
                continue;
            }
            this.info(`Building ${lang}/${template.name}`);
            const htmlContent = this._renderTemplate(template.templatePath, context);
            if(this.isProduction) {
                htmlContent = minify(htmlContent, HTML_MINIFY_OPTIONS);
            }
            await this.outputWriter.writePage(lang, template.name, htmlContent);
        }
    }

    async renderCollections(lang) {
        const config = this.project.getConfig();
        for( const [collectionName, collectionConfig] of Object.entries(config.collections) ) {
            const {item_template: itemTemplate, items = []} = collectionConfig;

            for( const item of items ) {
                const context = await this.dataLoader.getCollectionItemContext(lang, collectionName, item);
                if( !context ) {
                    // console.warn(`No context found for collection item "${item}" in collection "${collectionName}" and language "${lang}". Skipping.`);
                    this.warn(`Skipping draft: ${lang}/${collectionName}/${item.slug}`);
                    this.warn('If this is unexpected, check the item\'s data file for a "draft" ' + 
                        'property set to true, or missing data files that should provide context for this item.');
                    continue;
                }
                this.info(`Building ${lang}/${collectionName}/${item}`);
                const htmlContent = this._renderTemplate(itemTemplate, context);
                if(this.isProduction) {
                    htmlContent = htmlMinifier.minify(htmlContent, HTML_MINIFY_OPTIONS);
                }
                await this.outputWriter.writeCollectionItem(lang, collectionName, item, htmlContent);
            }
        }
    }

    _renderTemplate(templateName, context) {
        try {
            return this.env.render(templateName, context);
        } catch (err) {
            this.error(`Error rendering template "${templateName}": ${err.message}`);
            throw err;
        }
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
}
