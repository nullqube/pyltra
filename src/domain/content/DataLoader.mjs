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
        this.pageDataCache = new Map();
    }

    load(lang) {
        // load data for the given language
        // this is where you would implement your data loading logic,
        // e.g. reading from JSON/YAML files, fetching from APIs, etc.
        return {};
    }

    /**
     * Clears cached data for a specific language, or all languages if omitted.
     * Call this from watch handlers before triggering htmlTask so stale data
     * isn't served.
     * @param {string} [lang]
     */
    invalidateCache(lang) {
        if (lang) {
            this.pageDataCache.delete(lang);
        } else {
            this.pageDataCache.clear();
        }
    }

    /**
     * Content loaders
     * @param {string} fileContent
     * @param {'md'|'json'|'yaml'} fileType
     * @returns {Object}
     */
    loadContent(fileContent, fileType) {
        if (fileType === 'md') {
            const { data, content } = matter(fileContent);
            return { ...data, content: marked(content) };
        }
        if (fileType === 'json') return JSON.parse(fileContent);
        if (fileType === 'yaml') return yaml.load(fileContent);
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    /**
     * @param {string} lang
     * @param {string} cwd
     * @returns {Object}
     */
    loadCollectionsData(lang, cwd) {
        const dataDir = this.project.getPaths().data;
        const result  = [];
    
        for (const [collectionName, { dataFile, items }] of Object.entries(this.project.getConfig().collections)) {
            const collectionFileName = dataFile.replace('${lang}', lang);
            const collectionFilePath = join(cwd, dataDir, collectionFileName);
    
            try {
                const collectionData = yaml.load(readFileSync(collectionFilePath, 'utf8'));
    
                const itemsData = items.map(item => {
                    const itemFileName = item.file.replace('${lang}', lang);
                    const itemFilePath = join(cwd, dataDir, itemFileName);
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
    
                result.push({ [collectionName]: { ...collectionData, items: itemsData } });
            } catch (e) {
                // console.warn(`Warning: Missing or invalid collection file "${collectionFileName}" for lang "${lang}"`);
                // console.warn(`  → ${e.message}`);
                result.push({ [collectionName]: { items: [] } });
            }
        }
    
        return Object.assign({}, ...result);
    }

    /**
     * Loads and merges all page data for a given language.
     * Results are cached — call invalidateCache(lang) before rebuilding on watch.
     * @param {string} lang
     * @param {string} [cwd]
     * @returns {Object}
     */
    loadPageData(lang, cwd = process.cwd()) {
        if (this.pageDataCache.has(lang)) {
            console.log(`Using cached data for "${lang}"`);
            return this.pageDataCache.get(lang);
        }
    
        const dataDir = this.project.getPaths().data;
        const result  = [{ langs: this.project.getConfig().languages }];
    
        console.log(`Loading data for "${lang}"...`);
    
        for (const [key, value] of Object.entries(this.project.getConfig().pages)) {
            const { file = '', fallback = {} } = value ?? {};
            const fileName = file ? file.replace('${lang}', lang) : `${lang}/${key}.yaml`;
            const filePath = join(cwd, dataDir, fileName);
    
            try {
                const loaded = yaml.load(readFileSync(filePath, 'utf8'));
                console.log(`  Loaded ${fileName}`);
                result.push(key === 'shared' ? (loaded[lang] || fallback) : { [key]: loaded });
            } catch (e) {
                // console.warn(`Warning: Missing or invalid "${fileName}" for lang "${lang}"`);
                // console.warn(`  → ${e.message}`);
                result.push({ [key]: fallback });
            }
        }
    
        const collections = loadCollectionsData(lang, cwd);
        if (Object.keys(collections).length > 0) {
            result.push(collections);
        }
    
        const pageData = Object.assign({}, ...result);
        this.pageDataCache.set(lang, pageData);
        return pageData;
    }
}