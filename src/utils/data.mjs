import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';
import { marked } from 'marked';
import { PATHS, config, languages } from './config.mjs';

function loadContent(fileContent, fileType) {
    if (fileType === 'md') {
        const {data, content} = matter(fileContent);
        return {
            ...data,
            content: marked(content)
        };
     } // Convert Markdown to HTML
    if (fileType === 'json') return JSON.parse(fileContent); // Parse JSON
    if (fileType === 'yaml') return yaml.load(fileContent); // Load YAML
    throw new Error(`Unsupported file type: ${fileType}`);
}

// Load collections data 
function loadCollectionsData(lang, cwd) {
    const res = [];
    if (config.collections) {
        for (const [collectionName, { dataFile, items }] of Object.entries(config.collections)) {
            const collectionDataFile = dataFile.replace('${lang}', lang);
            const collectionDataFilePath = join(cwd, PATHS.data, collectionDataFile);

            try {
                const collectionData = yaml.load(readFileSync(collectionDataFilePath, 'utf8'));

                const itemsData = items.map(item => {
                    const itemFileName = item.file.replace('${lang}', lang);
                    const itemFilePath = join(cwd, PATHS.data, itemFileName);
                    try {
                        const itemContent = readFileSync(itemFilePath, 'utf8');
                        const fileExt = item.file.split('.').pop();
                        const parsedContent = loadContent(itemContent, fileExt);

                        return { slug: item.slug, ...parsedContent };
                    } catch (e) {
                        console.warn(`Warning: Missing or invalid item file ${itemFileName} for ${lang}`);
                        console.warn(e.message);
                    
                        return { slug: item.slug, ...item.fallback };
                    }
                });

                // console.log('---------------------------');
                // console.log(itemsData);
                // console.log('---------------------------');

                res.push({ [collectionName]: { ...collectionData, items: itemsData } });
            } catch (e) {
                console.warn(`Warning: Missing or invalid collection data file ${collectionDataFile} for ${lang}`);
                console.warn(e.message);
                // Push an empty collection if the data file is missing or invalid
                res.push({ [collectionName]: { items: [] } });
            }
        }
    }

    return Object.assign({}, ...res);
}

// Load page data (keeps flat structure)
export function loadPageData(lang, cwd = process.cwd()) {
    const res = [{ langs: config.languages }]; // Start with languages list
    const datsSources = config.dataSources;

    console.log(`Loading data for ${lang}...`);
    for (const [key, { file, fallback }] of Object.entries(datsSources)) {
        const fileName = file ? file.replace('${lang}', lang) : `${lang}.${key}.yaml`;
        const filePath = join(cwd, PATHS.data, fileName);

        try {
            const loadedData = yaml.load(readFileSync(filePath, 'utf8'));
            console.log(`Loaded ${fileName}`);
            res.push(key === 'shared' ? loadedData[lang] || fallback : loadedData);
        } catch (e) {
            console.warn(`Warning: Missing or invalid ${fileName} for ${lang}`);
            res.push({ [key]: fallback });
        }
    }
    const collectionRes = loadCollectionsData(lang, cwd);
    res.push( collectionRes);

    // console.log( collectionRes.articles );
    return Object.assign({}, ...res); // Flatten into { title, nav, footer, ... }
}