import gulp from 'gulp';
import { PATHS, browserSyncInstance, Languages, IsProd } from '../utils/config.mjs';
import { htmlTask } from './html.mjs';
import { assetsTask } from './assets.mjs';
import { scssTask } from './scss.mjs';
import { invalidateCache } from '../utils/data.mjs';

// ---------------------------------------------------------------------------
// Path parser — figures out what changed and returns a BuildFilter
// ---------------------------------------------------------------------------

/**
 * Parses a changed file path and returns the most specific BuildFilter possible.
 *
 * Examples:
 *   src/data/en/footer.yaml             → { lang: 'en' }
 *   src/data/en/articles/article-1.md  → { lang: 'en', collection: 'articles', slug: 'article-1' }
 *   src/data/shared.yaml               → {}  (rebuild all)
 *   src/templates/index.html           → {}  (rebuild all)
 *
 * @param {string} filePath - changed file path
 * @param {string[]} languages
 * @returns {{ lang?: string, collection?: string, slug?: string }}
 */
function parseChangedFile(filePath, languages) {
    const paths      = PATHS();
    const normalized = filePath.replace(/\\/g, '/');
    const dataDir    = paths.data.replace(/\\/g, '/');

    // Only data files can be language/collection specific
    if (!normalized.includes(dataDir)) {
        return {}; // template or config change — rebuild all
    }

    const relative = normalized.split(dataDir + '/')[1];
    if (!relative) return {};

    const parts = relative.split('/');
    const lang  = parts[0];

    if (!languages.includes(lang)) {
        return {}; // shared or unknown — rebuild all
    }

    // e.g. src/data/en/articles/article-1.md
    if (parts.length === 3) {
        const collection = parts[1];
        const slug       = parts[2].replace(/\.[^/.]+$/, ''); // strip extension
        return { lang, collection, slug };
    }

    // e.g. src/data/en/footer.yaml
    return { lang };
}

// ---------------------------------------------------------------------------
// Rebuild helper
// ---------------------------------------------------------------------------

/**
 * Invalidates cache and triggers an incremental HTML rebuild.
 * @param {string} filePath
 * @param {string[]} languages
 */
async function rebuildHTML(filePath, languages) {
    const filter = parseChangedFile(filePath, languages);

    invalidateCache(filter.lang || undefined);

    const label = filter.slug
        ? `${filter.lang}/${filter.collection}/${filter.slug}`
        : filter.lang
            ? filter.lang
            : 'all languages';

    console.log(`\n● File changed: ${filePath}`);
    console.log(`↻ Rebuilding: ${label}\n`);

    try {
        await htmlTask(languages, IsProd(), filter);
    } catch (e) {
        console.error(`Rebuild error: ${e.message}`);
    }
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export const startServer = (done = () => {}) => {
    const langs       = Languages();
    const defaultLang = langs.length > 0 ? langs[0] : 'en';
    const defaultPath = `/${defaultLang}/`;

    console.log(`Serving ${langs.join(', ')} from dist/`);

    browserSyncInstance.init(
        {
            server:    { baseDir: PATHS().dist },
            open:      true,
            notify:    true,
            startPath: defaultPath,
        },
        () => console.log('BrowserSync serving from dist/')
    );

    done();
};

// ---------------------------------------------------------------------------
// Watch
// ---------------------------------------------------------------------------

export const watchFiles = () => {
    const paths     = PATHS();
    const languages = Languages();

    // Data files — incremental rebuild via path parsing
    const dataWatcher = gulp.watch([
        `${paths.data}/**/*.yaml`,
        `${paths.data}/**/*.md`
    ]);
    dataWatcher.on('change', (filePath) => rebuildHTML(filePath, languages));
    dataWatcher.on('add',    (filePath) => rebuildHTML(filePath, languages));

    // Templates — rebuild all (can't know which lang is affected)
    gulp.watch(paths.templates, async (done) => {
        console.log('\n● Template changed — rebuilding all\n');
        invalidateCache();
        try {
            await htmlTask(languages, IsProd());
        } catch (e) {
            console.error(e.message);
        }
        done();
    });

    // Config — rebuild all
    gulp.watch('./config.yaml', async (done) => {
        console.log('\n● config.yaml changed — rebuilding all\n');
        invalidateCache();
        try {
            await htmlTask(languages, IsProd());
        } catch (e) {
            console.error(e.message);
        }
        done();
    });

    // Styles
    gulp.watch(paths.assets.scss, () => scssTask(IsProd()));

    // Flatten all asset globs, filter out any undefined/empty values
    const assetsGlobs = [
        paths.assets.css,
        paths.assets.js,
        paths.assets.img,
        ...paths.assets.other
    ].filter(Boolean); // Remove any falsy values (undefined, null, empty string)
    // (Boolean is the constructor function of the class, so it converts everything
    //  to boolean then null become false and filter remove it)
    // This is a common JavaScript technique to remove any falsy values from an array. 
    // In this context, it ensures that if any of the asset paths (css, js, img, other) are undefined, null, or empty strings,
    // they will be filtered out before we attempt to set up a watcher on them. 
    // This prevents errors that would occur if gulp.watch is given invalid paths.

    if (assetsGlobs.length > 0) {
        gulp.watch(assetsGlobs, () => assetsTask(IsProd()));
    }
};
