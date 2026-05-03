//
// DataLoader
// ----------
// Loads YAML data files for given language.
// 

import { join } from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { marked } from 'marked';
export class DataLoader {

    constructor(project) {
        this.project = project;

        /**
         * Cache — keyed by lang, invalidated explicitly on watch rebuilds 
         * @type {Map<string, Object>} */
        this.cache = new Map();
    }

    /**
     * Public API
     * Loads and merges all page data for a given language.
     * Results are cached — call invalidateCache(lang) before rebuilding on watch.
     * @param {string} lang
     * @returns {Object}
     */
    load(lang) {
        // load data for the given language
        if (this.cache.has(lang)) {
            console.log(`Using cached data for "${lang}"`);
            return this.cache.get(lang);
        }

        const data = {
            langs: this.project.getLanguages(),
            pages: this._loadPages(lang),
            collections: this._loadCollectionsData(lang) // 
        };

        this.cache.set(lang, data);
        return data;
    }

    /**
     * Clears cached data for a specific language, or all languages if omitted.
     * Call this from watch handlers before triggering htmlTask so stale data
     * isn't served.
     * @param {string} [lang]
     */
    invalidateCache(lang) {
        if (lang) {
            this.cache.delete(lang);
        } else {
            this.cache.clear();
        }
    }

    _loadPages(lang) {
        const config = this.project.getConfig();
        const paths = this.project.getPaths();
        const result = {};

        // key is the page name in the key:value manner like: about, services, ...
        // value is the page properties like: file, fallback, ...
        for (const [key, value] of Object.entries(config.pages)) {
            const { file = '', fallback = {} } = value ?? {};

            const fileName = file 
                ? file.replace('${lang}', lang)
                : `${lang}/${key}.yaml`;

            const filePath = join(this.project.cwd, paths.data, fileName);
    
            try {
                const loaded = yaml.load(readFileSync(filePath, 'utf8'));
                console.log(`  Loaded ${fileName}`);
                result[key] = 
                    key === 'shared' 
                        ? (loaded[lang] || fallback) 
                        : loaded;
            } catch (e) {
                result[key] = fallback;
            }
        }

        return result;
    }

    /**
     * @param {string} lang
     * @returns {Object}
     */
    _loadCollectionsData(lang) {
        const config = this.project.getConfig();
        const paths = this.project.getPaths();
        const result  = {};
    
        for (const [collectionName, { dataFile, items }] of Object.entries(config.collections)) {
            const collectionFileName = dataFile.replace('${lang}', lang);
            const collectionFilePath = join(this.project.cwd, paths.data, collectionFileName);
    
            try {
                const collectionData = yaml.load(readFileSync(collectionFilePath, 'utf8'));
    
                const itemsData = items.map(item => {
                    const itemFileName = item.file.replace('${lang}', lang);
                    const itemFilePath = join(this.project.cwd, paths.data, itemFileName);
                    const fileExt      = itemFileName.split('.').pop();
    
                    try {
                        const parsed = loadContent(readFileSync(itemFilePath, 'utf8'), fileExt);
                        return { slug: item.slug, ...parsed };
                    } catch (e) {
                        // console.warn(`Warning: Missing or invalid item file "${itemFileName}" for lang "${lang}"`);
                        // console.warn(`  → ${e.message}`);
                        return { slug: item.slug, ...(item.fallback || {}) };
                    }
                });
    
                result[collectionName] = { ...collectionData, items: itemsData };
            } catch (e) {
                // console.warn(`Warning: Missing or invalid collection file "${collectionFileName}" for lang "${lang}"`);
                // console.warn(`  → ${e.message}`);
                result[collectionName] = { items: [] };
            }
        }
    
        return result;
    }

    /**
     * Content loaders
     * @param {string} content
     * @param {'md'|'json'|'yaml'} type
     * @returns {Object}
     */
    loadContent(content, type) {
        if (type === 'md') {
            const { data, content: body } = matter(content);
            return { ...data, content: marked(body) };
        }
        if (type === 'json') return JSON.parse(content);
        if (type === 'yaml') return yaml.load(content);
        throw new Error(`Unsupported file type: ${type}`);
    }
}