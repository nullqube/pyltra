import gulp from 'gulp';
import data from 'gulp-data';
import nunjucksRender from 'gulp-nunjucks-render';
import through2 from 'through2';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import { marked } from 'marked';
import notify from 'gulp-notify';
import { loadPageData } from '../utils/data.mjs';
import { PATHS, browserSyncInstance, Config } from '../utils/config.mjs';
import merge from 'merge-stream';

// ---------------------------------------------------------------------------
// Nunjucks environment setup — defined once, reused across all tasks
// ---------------------------------------------------------------------------

/**
 * Registers all custom filters on a nunjucks Environment.
 * Called via manageEnv so it runs once per nunjucksRender instance.
 * @param {import('nunjucks').Environment} env
 */
function setupNunjucksEnv(env) {
    env.addFilter('markdown', (content) => {
        if (!content) return '';
        return marked(content);
    });

    env.addFilter('date', (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    });

    env.addFilter('slugify', (str) => {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    });

    env.addFilter('truncate', (str, length) => {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.slice(0, length) + '...';
    });

    env.addFilter('tojson', (obj) => JSON.stringify(obj, null, 2));
}

// ---------------------------------------------------------------------------
// Shared minify options
// ---------------------------------------------------------------------------
const htmlminOptions = {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
};

// ---------------------------------------------------------------------------
// Draft helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the item is a draft and should be skipped.
 * Drafts are always included in dev, always skipped in prod.
 * @param {Object} itemData
 * @param {boolean} isProd
 * @returns {boolean}
 */
function isDraft(itemData, isProd) {
    return isProd && itemData?.draft === true;
}

/**
 * Filters or flags draft items in a collection.
 * In prod: removes drafts entirely.
 * In dev: keeps them but adds _draft:true so templates can show a "DRAFT" badge.
 * @param {Object[]} items
 * @param {boolean} isProd
 * @returns {Object[]}
 */
function filterDraftItems(items, isProd) {
    if (isProd) return items.filter(item => !item.draft);
    return items.map(item => ({ ...item, _draft: item.draft === true }));
}

// ---------------------------------------------------------------------------
// htmlTask
// ---------------------------------------------------------------------------

export const htmlTask = (languages, isProd) => {
    const paths = PATHS();
    const streams = [];

    for (const lang of languages) {
        const pageData = loadPageData(lang);

        // --------------------
        // Main pages
        // --------------------
        const pagesStream = gulp
            .src(paths.templates)
            .pipe(
                data((file) => {
                    const filename = file.basename.replace('.html', '');
                    const page = pageData[filename] || {};

                    if (isDraft(page, isProd)) {
                        console.log(`Skipping draft page: ${lang}/${filename}`);
                        return null;
                    }

                    console.log(`Building ${lang}/${filename}`);
                    return { activePage: filename, lang, ...pageData };
                })
            )
            // Filter out files where data() returned null (draft pages)
            .pipe(
                through2.obj(function (file, _, cb) {
                    if (file.data !== null) this.push(file);
                    cb();
                })
            )
            .pipe(
                nunjucksRender({
                    path: [`${paths.src}/templates`],
                    manageEnv: setupNunjucksEnv
                })
            )
            .on('error', (err) => {
                console.error(`HTML error (${lang}):`, err.message);
                process.exitCode = 1;
            })
            .on('error', notify.onError({
                title: 'HTML Compilation Error',
                message: '<%= error.message %>'
            }))
            .pipe(isProd ? htmlmin(htmlminOptions) : through2.obj())
            .pipe(gulp.dest(`${paths.dist}/${lang}`))
            .pipe(browserSyncInstance.stream());

        streams.push(pagesStream);

        // --------------------
        // Collection item pages
        // --------------------
        for (const [collectionName, { item_template, items }] of Object.entries(Config().collections)) {
            const collectionData = pageData[collectionName];

            // Filter drafts from collection listing so they don't appear in index pages
            if (collectionData?.items) {
                collectionData.items = filterDraftItems(collectionData.items, isProd);
            }

            for (const item of items) {
                const itemData = collectionData?.items?.find(i => i.slug === item.slug);

                if (isDraft(itemData, isProd)) {
                    console.log(`Skipping draft: ${lang}/${collectionName}/${item.slug}`);
                    continue;
                }

                const itemStream = gulp
                    .src(`${paths.src}/templates/${item_template}`, { allowEmpty: true })
                    .pipe(
                        data(() => ({
                            ...pageData,
                            lang,
                            article: itemData,
                            collection: collectionName
                        }))
                    )
                    .pipe(
                        nunjucksRender({
                            path: [`${paths.src}/templates`],
                            manageEnv: setupNunjucksEnv
                        })
                    )
                    .on('error', (err) => {
                        console.error(
                            `HTML error (${lang}/${collectionName}/${item.slug}):`,
                            err.message
                        );
                        process.exitCode = 1;
                    })
                    .on('error', notify.onError({
                        title: 'HTML Compilation Error',
                        message: '<%= error.message %>'
                    }))
                    .pipe(isProd ? htmlmin(htmlminOptions) : through2.obj())
                    .pipe(rename({ basename: item.slug }))
                    .pipe(gulp.dest(`${paths.dist}/${lang}/${collectionName}`))
                    .pipe(browserSyncInstance.stream());

                streams.push(itemStream);
            }
        }
    }

    // --------------------
    // Bundle files (404.html, etc.)
    // --------------------
    for (const fileName of Config().bundles) {
        streams.push(
            gulp
                .src(`${paths.src}/${fileName}`)
                .pipe(isProd ? htmlmin(htmlminOptions) : through2.obj())
                .pipe(gulp.dest(paths.dist))
                .pipe(browserSyncInstance.stream())
        );
    }

    return merge(...streams);
};
