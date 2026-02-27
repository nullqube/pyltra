import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { marked } from 'marked';
import { Config, PATHS } from './config.mjs';

// ---------------------------------------------------------------------------
// Cache — keyed by lang, invalidated explicitly on watch rebuilds
// ---------------------------------------------------------------------------

/** @type {Map<string, Object>} */
const pageDataCache = new Map();

/**
 * Clears cached data for a specific language, or all languages if omitted.
 * Call this from watch handlers before triggering htmlTask so stale data
 * isn't served.
 * @param {string} [lang]
 */
export function invalidateCache(lang) {
    if (lang) {
        pageDataCache.delete(lang);
    } else {
        pageDataCache.clear();
    }
}

// ---------------------------------------------------------------------------
// Content loaders
// ---------------------------------------------------------------------------

/**
 * @param {string} fileContent
 * @param {'md'|'json'|'yaml'} fileType
 * @returns {Object}
 */
function loadContent(fileContent, fileType) {
    if (fileType === 'md') {
        const { data, content } = matter(fileContent);
        return { ...data, content: marked(content) };
    }
    if (fileType === 'json') return JSON.parse(fileContent);
    if (fileType === 'yaml') return yaml.load(fileContent);
    throw new Error(`Unsupported file type: ${fileType}`);
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/**
 * @param {string} lang
 * @param {string} cwd
 * @returns {Object}
 */
function loadCollectionsData(lang, cwd) {
    const dataDir = PATHS().data;
    const result  = [];

    for (const [collectionName, { dataFile, items }] of Object.entries(Config().collections)) {
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

// ---------------------------------------------------------------------------
// Page data
// ---------------------------------------------------------------------------

/**
 * Loads and merges all page data for a given language.
 * Results are cached — call invalidateCache(lang) before rebuilding on watch.
 * @param {string} lang
 * @param {string} [cwd]
 * @returns {Object}
 */
export function loadPageData(lang, cwd = process.cwd()) {
    if (pageDataCache.has(lang)) {
        console.log(`Using cached data for "${lang}"`);
        return pageDataCache.get(lang);
    }

    const dataDir = PATHS().data;
    const result  = [{ langs: Config().languages }];

    console.log(`Loading data for "${lang}"...`);

    for (const [key, value] of Object.entries(Config().pages)) {
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
    pageDataCache.set(lang, pageData);
    return pageData;
}
