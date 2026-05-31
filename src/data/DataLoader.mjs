import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import yaml from 'js-yaml';

import { RuntimeAware } from '../core/runtime/RuntimeAware.mjs';

function clonePlainValue(value) {
    if (value === null || value === undefined) return value;
    return structuredClone(value);
}

/**
 * @feature CONFIG_LANGUAGE_TOKENS
 * @publicContract
 * @since 0.2.0
 *
 * Supports language placeholders inside config paths.
 *
 * @tokens
 * - {lang}
 * - {language}
 *
 * @docs docs/config-language.md#language-tokens
 * @tests tests/config/language-tokens.test.mjs
 */
function replaceLanguageToken(value, language) {
    return value
        .replaceAll('{lang}', language)
        .replaceAll('{language}', language);
}

function getExtension(fileName) {
    const ext = path.extname(fileName).slice(1).toLowerCase();
    return ext === 'yml' ? 'yaml' : ext;
}

function isDraft(data) {
    return data?.draft === true;
}

function filterDraftItems(items, isProd) {
    if (isProd) {
        return items.filter(item => !isDraft(item));
    }

    return items.map(item => ({
        ...item,
        _draft: isDraft(item)
    }));
}

/**
 * DataLoader
 * ----------
 * Loads language-aware page and collection data into the flat template context
 * used by the current renderer. It reads project data files for v2, while
 * keeping the boundary narrow enough to move filesystem reads behind an adapter
 * later.
 */
export class DataLoader extends RuntimeAware {
    /**
     * @param {Object|import('../project/Project.mjs').Project} options
     * @param {import('../project/Project.mjs').Project} [options.project]
     */
    constructor(options) {
        super({ runtime: options.runtime });

        this.project = options?.project || options;

        if (!this.project) {
            throw new Error('DataLoader requires a loaded Project instance.');
        }

        /** @type {Map<string, Object>} */
        this.cache = new Map();
    }

    /**
     * Loads the legacy flat template context for a language.
     *
     * @param {string} lang
     * @returns {Object}
     */
    load(lang) {
        this._assertLanguage(lang);

        if (this.cache.has(lang)) {
            if( !this.shouldLogVerbose ) {
                console.log(`Using cached data for "${lang}"`);
            }
            return clonePlainValue(this.cache.get(lang));
        }

        if( this.shouldLogVerbose ) {
            console.log(`Loading data for "${lang}"...`);
        }

        const config = this.project.getConfig();
        const pieces = [
            { langs: config.languages }
        ];

        for (const [pageName, pageConfig] of Object.entries(config.pages)) {
            pieces.push(this._loadPageData(pageName, pageConfig, lang));
        }

        const collections = this._loadCollectionsData(lang);
        if (Object.keys(collections).length > 0) {
            pieces.push(collections);
        }

        const context = Object.assign({}, ...pieces);
        this.cache.set(lang, context);

        return clonePlainValue(context);
    }

    /**
     * Clears cached data for a specific language, or all languages if omitted.
     *
     * @param {string} [lang]
     */
    invalidateCache(lang) {
        if (lang) {
            this.cache.delete(lang);
            return;
        }

        this.cache.clear();
    }

    /**
     * Builds context for one top-level page. Returns null for production drafts,
     * matching the old render task's skip behavior.
     *
     * @param {string} lang
     * @param {string} pageName
     * @returns {Object|null}
     */
    getPageContext(lang, pageName) {
        const pageData = this.load(lang);
        const page = pageData[pageName] || {};

        // TODO: consider moving this logic to a separate method and 
        // applying it to collections as well, for consistency. 
        // The old render task only skipped draft pages, 
        // but it might make sense to skip or flag draft collection 
        // items in the same way.
        // Also is it the right good behavior to return null for drafts,
        // or should we always return an object with a _draft flag?
        // For now, we can at least add a _draft flag to the item 
        // context so templates can handle it if needed.
        if (this.isProduction && isDraft(page)) {
            return null;
        }

        return {
            activePage: pageName,
            lang,
            ...pageData
        };
    }

    /**
     * Returns collection data with item draft handling applied for rendering.
     *
     * @param {string} lang
     * @param {string} collectionName
     * @returns {Object}
     */
    getCollection(lang, collectionName) {
        const pageData = this.load(lang);
        const collection = pageData[collectionName] || { items: [] };

        return {
            ...collection,
            items: filterDraftItems(collection.items || [], this.isProduction)
        };
    }

    /**
     * Builds context for one collection item page. Returns null for production
     * drafts, matching the old render task's skip behavior.
     *
     * @param {string} lang
     * @param {string} collectionName
     * @param {string} slug
     * @returns {Object|null}
     */
    getCollectionItemContext(lang, collectionName, slug) {
        const pageData = this.load(lang);
        const rawCollection = pageData[collectionName] || { items: [] };
        const rawItem = rawCollection.items.find(candidate => candidate.slug === slug);

        if (!rawItem || (this.isProduction && isDraft(rawItem))) {
            return null;
        }

        const collection = this.getCollection(lang, collectionName);
        const item = collection.items.find(candidate => candidate.slug === slug);

        return {
            ...pageData,
            [collectionName]: collection,
            lang,
            article: item,
            collection: collectionName
        };
    }

    /**
     * Parses supported content file formats.
     *
     * @param {string} content
     * @param {'md'|'json'|'yaml'|'yml'} type
     * @returns {Object}
     */
    loadContent(content, type) {
        const normalizedType = type === 'yml' ? 'yaml' : type;

        if (normalizedType === 'md') {
            const { data, content: body } = matter(content);
            return { ...data, content: marked(body) };
        }

        if (normalizedType === 'json') return JSON.parse(content);
        if (normalizedType === 'yaml') return yaml.load(content);

        throw new Error(`Unsupported file type: ${type}`);
    }

    /**
     * @feature CONFIG_PAGE_DATA_SHORTHAND
     * @publicContract
     * @since 0.2.0
     *
     * Allows page data config to be written in shorthand form.
     *
     * Full form:
     *   pages:
     *     about:
     *       file: data/{lang}.about.yaml
     *       fallback: {}
     *
     * Shorthand form:
     *   pages:
     *     about: data/{lang}.about.yaml
     *
     * Contract:
     * - If pageConfig is a string, it is treated as `{ file: pageConfig }`.
     * - `{lang}` and `{language}` tokens are supported inside the file path.
     * - If no file is provided, Pyltra falls back to `${lang}/${pageName}.yaml`.
     * - If loading fails, fallback data is returned.
     *
     * Docs:
     * - docs/config-language.md#page-data-shorthand
     *
     * Tests:
     * - tests/config/page-data-shorthand.test.mjs
     */
    _loadPageData(pageName, pageConfig, lang) {
        const normalizedConfig = typeof pageConfig === 'string'
            ? { file: pageConfig }
            : pageConfig ?? {};
        const { file = '', fallback = {} } = normalizedConfig;
        const fileName = file
            ? replaceLanguageToken(file, lang)
            : `${lang}/${pageName}.yaml`;
        const filePath = path.join(this.project.getDataPath(), fileName);

        try {
            const loaded = yaml.load(fs.readFileSync(filePath, 'utf8'));
            
            if (this.shouldLogVerbose) {
                console.log(`  Loaded ${fileName}`);
            }

            if (pageName === 'shared') {
                return loaded?.[lang] || fallback;
            }

            return { [pageName]: loaded };
        } catch {
            return { [pageName]: fallback };
        }
    }

    _loadCollectionsData(lang) {
        const config = this.project.getConfig();
        const result = [];

        for (const [collectionName, collectionConfig] of Object.entries(config.collections)) {
            result.push({
                [collectionName]: this._loadCollection(collectionName, collectionConfig, lang)
            });
        }

        return Object.assign({}, ...result);
    }

    _loadCollection(collectionName, collectionConfig, lang) {
        const { dataFile, items = [] } = collectionConfig;
        const collectionFileName = replaceLanguageToken(dataFile, lang);
        const collectionFilePath = path.join(this.project.getDataPath(), collectionFileName);

        try {
            const collectionData = yaml.load(fs.readFileSync(collectionFilePath, 'utf8'));

            return {
                ...collectionData,
                items: items.map(item => this._loadCollectionItem(collectionName, item, lang))
            };
        } catch {
            return { items: [] };
        }
    }

    _loadCollectionItem(collectionName, item, lang) {
        const itemFileName = replaceLanguageToken(item.file, lang);
        const itemFilePath = path.join(this.project.getDataPath(), itemFileName);
        const fileType = getExtension(itemFileName);

        try {
            const parsed = this.loadContent(fs.readFileSync(itemFilePath, 'utf8'), fileType);
            return { slug: item.slug, ...parsed };
        } catch {
            return { slug: item.slug, ...(item.fallback || {}) };
        }
    }

    _assertLanguage(lang) {
        const languages = this.project.getLanguages();

        if (!languages.includes(lang)) {
            throw new Error(
                `Unknown language "${lang}". Expected one of: ${languages.join(', ')}.`
            );
        }
    }
}
