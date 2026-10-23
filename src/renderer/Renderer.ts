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

import { RuntimeAware } from "../core/runtime/RuntimeAware.ts";
import { FilesystemAdapter } from '../data/adapters/FilesystemAdapter.ts';
import { createNunjucksEnvironment } from './NunjucksEnvironment.ts';
import { TemplateRepository } from "./TemplateRepository.ts";
import { OutputWriter } from './OutputWriter.ts';
import { BuildArtifact } from '../core/diagnostics/BuildArtifact.ts';
import type { Project } from '../project/Project.ts';
import type { Runtime } from '../core/runtime/Runtime.ts';
import type { DataLoader } from '../data/DataLoader.ts';
import type { Environment } from 'nunjucks';

const HTML_MINIFY_OPTIONS = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export interface RendererDependencies {
    project?: Project;
    dataLoader?: DataLoader;
    environment?: Environment;
    runtime?: Runtime;
}

export class Renderer extends RuntimeAware {
  dataLoader: DataLoader;
  env: Environment;
  fsAdapter: FilesystemAdapter;
  outputWriter: OutputWriter;
  project: Project;
  templateRepository: TemplateRepository;
    constructor(input: Project | RendererDependencies, options: RendererDependencies = {}) {
        // Supports both new Renderer(project, options) and
        // new Renderer({ project, dataLoader, environment, runtime }).
        // If the first argument has a "project" property, treat it as the
        // dependency object; otherwise treat the first argument as the project
        // and read optional dependencies from the second argument.
        // `input` is polymorphic; view it as the dependency object when it carries deps.
        const hasProjectOption = input && Object.hasOwn(input, 'project');
        const deps = input as RendererDependencies;
        const runtime = hasProjectOption ? deps.runtime : options.runtime;
        const project = hasProjectOption ? deps.project : (input as Project);
        const dataLoader = hasProjectOption ? deps.dataLoader : options.dataLoader;
        const environment = hasProjectOption ? deps.environment : options.environment;

        super({ runtime });
        if (!project) {
            throw new Error('Renderer requires a loaded Project instance.');
        }

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
    async renderLanguage(lang: string) {
        await this.renderPages(lang);
        await this.renderCollections(lang);
    }

    /**
     * Renders top-level HTML templates to dist/<lang>/.
     *
     * @param {string} lang
     */
    async renderPages(lang: string) {
        const templates = await this.templateRepository.getPageTemplates();

        for( const template of templates ) {
            const result = this._getPageContext(lang, template.name);

            if (result.status === 'skip') {
                this.#warnSkippedPage(lang, template.name, result.reason);
                continue;
            }

            const context = result.context;
            if (!context) {
                throw new Error(`Renderer received an empty context for page "${template.name}".`);
            }
            this.info(`Building ${lang}/${template.name}`);
            let htmlContent = this._renderTemplate(template.fileName, context);
            htmlContent = this.#maybeMinify(htmlContent);

            this.diagnostics.recordArtifact(new BuildArtifact({
                type: 'page',
                lang,
                name: template.name,
                size: Buffer.byteLength(htmlContent, 'utf-8'),
                createdBy: 'Renderer'
            }));
            await this.outputWriter.writePage(lang, template.name, htmlContent);
        }
    }

    /**
     * Renders configured collection item pages to dist/<lang>/<collection>/.
     *
     * @param {string} lang
     */
    async renderCollections(lang: string) {
        const config = this.project.getConfig();
        for( const [collectionName, collectionConfig] of Object.entries(config.collections) ) {
            const {item_template: itemTemplate, items = []} = collectionConfig;
            if (!itemTemplate) {
                this.warn(`Skipping collection "${collectionName}" because item_template is missing.`);
                continue;
            }
            for( const item of items ) {
                // `slug` is item.slug; the `?? item` fallback is legacy, so treat it as a string.
                const slug = (item.slug ?? item) as string;
                if (!slug) {
                    // TODO: This should be a validation error, not a warning. 
                    //  The collection item is malformed and we can't render it at all,
                    //  so we should fail the build rather than silently skip it.
                    // Maybe we should make one with our default formula 
                    // something like: slug=collectionName + index, and warn that we're doing that?
                    this.warn(`Skipping invalid item in collection "${collectionName}".`);
                    continue;
                }
                const result = this.dataLoader.getCollectionItemContext(lang, collectionName, slug);
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
                if (!context) {
                    throw new Error(`Renderer received an empty context for "${collectionName}/${slug}".`);
                }
                this.info(`Building ${lang}/${collectionName}/${slug}`);
                let htmlContent = this._renderTemplate(itemTemplate, context);
                htmlContent = this.#maybeMinify(htmlContent);

                this.diagnostics.recordArtifact(new BuildArtifact({
                    type: 'collection-item',
                    lang,
                    name: `${collectionName}/${slug}`,
                    size: Buffer.byteLength(htmlContent, 'utf-8'),
                    createdBy: 'Renderer'
                }));
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
            content = this.#maybeMinify(content);
            this.diagnostics.recordArtifact(new BuildArtifact({
                type: 'bundle',
                name: fileName,
                size: Buffer.byteLength(content, 'utf-8'),
                createdBy: 'Renderer'
            }));
            await this.outputWriter.writeBundle(fileName, content);
        }
    }

    _renderTemplate(templateName: string, context: object) {
        try {
            return this.env.render(templateName, context);
        } catch (err) {
            throw new Error(
                `Renderer failed to render template "${templateName}": ${getErrorMessage(err)}`,
                { cause: err }
            );
        }
    }

    _getPageContext(lang: string, pageName: string) {
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

    #getCollectionsContext(lang: string) {
        const collectionConfigs = this.project.getConfig().collections ?? {};
        // Collections keyed dynamically by collection name.
        const collections: Record<string, unknown> = {};

        for (const collectionName of Object.keys(collectionConfigs)) {
            collections[collectionName] =
                this.dataLoader.getCollection(lang, collectionName);
        }

        return collections;
    }

    #maybeMinify(html: string): string {
        if (!this.isProduction) {
            return html;
        }

        return htmlMinifier.minify(html, HTML_MINIFY_OPTIONS);
    }

    #warnSkippedPage(lang: string, pageName: string, reason: string | null) {
        if (reason === 'draft') {
            this.warn(`Skipping draft page: ${lang}/${pageName}`);
            this.warn('If this is unexpected, check the page data file for draft=true.');
            return;
        }

        this.warn(`Skipping page: ${lang}/${pageName}`);
    }

    #warnSkippedCollectionItem(lang: string, collectionName: string, slug: string, reason: string | null) {
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
