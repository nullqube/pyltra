import gulp from 'gulp';
import nunjucksRender from 'gulp-nunjucks-render';
import data from 'gulp-data';
import { readFileSync } from 'fs';
import { join } from 'path';
import clean from 'gulp-clean';
import cleanCSS from 'gulp-clean-css';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import htmlmin from 'gulp-htmlmin';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import optipng from 'imagemin-optipng';
import browserSync from 'browser-sync';
import minimist from 'minimist';
import yaml from 'js-yaml';
import through2 from 'through2';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
// import dartSass from 'sass';
import * as dartSass from 'sass'; // Import all from 'sass' to use dartSass
import gulpSass from 'gulp-sass';
import size from 'gulp-size';
import notify from 'gulp-notify';
import {marked} from 'marked';
import matter from 'gray-matter';
import rename from 'gulp-rename';
import fs from 'fs';

const sass = gulpSass(dartSass); // Bind `gulp-sass` to `dart-sass`

// Constants
const PATHS = {
    templates: 'src/templates/*.html',
    data: 'src/data',
    assets: {
        scss: 'src/assets/scss/**/*.scss',
        css: 'src/assets/css/**/*.css',
        js: 'src/assets/js/**/*.js',
        img: 'src/assets/img/**/*',
        other: [
            'src/assets/**/*',
            '!src/assets/scss/**',
            '!src/assets/css/**/*.css',
            '!src/assets/js/**/*.js',
            '!src/assets/img/**/*'
        ]
    },
    dist: 'dist'
};

// CLI args
const args = minimist(process.argv.slice(2));
const isProd = args.prod || false;
console.log(`Running in ${isProd ? 'production' : 'development'} mode`);

const browserSyncInstance = browserSync.create();

// Load and validate config
let config;


try {
    if (fs.existsSync('./config.yaml')) {
        config = yaml.load(readFileSync('./config.yaml', 'utf8'));
        if (!config.languages) 
            throw new Error('Invalid config.yaml: Missing "languages"');
        if (!config.dataSources) 
            throw new Error('Invalid config.yaml: Missing "datsSources"');
    } else {
        console.log('config.yaml does not exist');
    }
} catch (e) {
    console.error('Error loading config.yaml:', e.message);
    process.exit(1);
}

const languages = config.languages.map(lang => lang.code);


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
function loadPageData(lang, cwd = process.cwd()) {
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

// Helper for asset processing
function processAsset(src, dest, plugin) {
    let stream = gulp.src(src);
    if (!isProd) stream = stream.pipe(sourcemaps.init());
    if (plugin) stream = stream.pipe(plugin());
    if (!isProd) stream = stream.pipe(sourcemaps.write('../maps'));
    return stream.pipe(gulp.dest(dest)).pipe(browserSyncInstance.stream());
}

// Tasks
gulp.task('clean', () => gulp.src(PATHS.dist, { read: false, allowEmpty: true }).pipe(clean()));

gulp.task('html', async () => {
    const tasks = languages.map(lang => {
        const pageData = loadPageData(lang);
        const pagesTasks = gulp.src(PATHS.templates)
            .pipe(data(file => {
                const filename = file.basename.replace('.html', '');
                console.log(`Building ${lang}/${filename}`);
                return { activePage: filename, ...pageData };
            }))
            .pipe(nunjucksRender({
                path: ['src/templates'],
                manageEnv: env => env.addFilter('tojson', obj => JSON.stringify(obj, null, 2))
            }))
            .on('error', err => console.error(`Nunjucks error for ${lang}: ${err.message}`))
            .on('error', notify.onError({
                title: 'HTML Compilation Error',
                message: '<%= error.message %>'
            }))
            .pipe(isProd ? htmlmin({
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true
            }) : through2.obj()) // Minify in production or pass through
            .pipe(gulp.dest(`${PATHS.dist}/${lang}`))
            .pipe(browserSyncInstance.stream());
        
        // Process collections
        const collectionTasks = Object.entries(config.collections || {}).flatMap(([collectionName, { template, item_template,items }]) => {
            const collectionData = pageData[collectionName];

            // Main collection page
            // const mainPageTask = gulp.src(`src/templates/${template}`, { allowEmpty: true })
            //     .pipe(data(() => ({ lang, ...collectionData, collection: collectionName })))
            //     .pipe(nunjucksRender({
            //         path: ['src/templates'],
            //         manageEnv: env => env.addFilter('tojson', obj => JSON.stringify(obj, null, 2))
            //     }))
            //     .pipe(isProd ? htmlmin({
            //         collapseWhitespace: true,
            //         removeComments: true,
            //         minifyCSS: true,
            //         minifyJS: true
            //     }) : through2.obj())
            //     .pipe(gulp.dest(`${PATHS.dist}/${lang}`))
            //     .pipe(browserSyncInstance.stream());

            // Individual item pages
            const itemTasks = items.map(item => {
                const itemData = collectionData.items.find(i => i.slug === item.slug);
                // console.log({...pageData, ...{ lang, article: itemData, collection: collectionName }})
                return gulp.src(`src/templates/${item_template}`, { allowEmpty: true })
                    .pipe(data(() => ({...pageData, ...{ lang, article: itemData, collection: collectionName }})))
                    .pipe(nunjucksRender({
                        path: ['src/templates'],
                        manageEnv: env => env.addFilter('tojson', obj => JSON.stringify(obj, null, 2))
                    }))
                    .pipe(isProd ? htmlmin({
                        collapseWhitespace: true,
                        removeComments: true,
                        minifyCSS: true,
                        minifyJS: true
                    }) : through2.obj())
                    .pipe(rename({ basename: item.slug })) // Set the output filename here
                    .pipe(gulp.dest(`${PATHS.dist}/${lang}/${collectionName}`))
                    .pipe(browserSyncInstance.stream());
            });
            return [...itemTasks];
        });

        return [pagesTasks, ...collectionTasks];
    });

    // New tasks for config.bundle files
    let bundleTasks = [];
    if (Array.isArray(config.bundles) && config.bundles.length > 0) {
        bundleTasks = config.bundles.map(fileName =>
            gulp.src(`src/${fileName}`) // Read each file pattern
                .pipe(isProd ? htmlmin({
                    collapseWhitespace: true,
                    removeComments: true,
                    minifyCSS: true,
                    minifyJS: true
                }) : through2.obj()) // Minify in production or write directly
                // through2.obj() : act as no-op transform stream
                .pipe(gulp.dest(PATHS.dist)) // Write to the output directory
                .pipe(browserSyncInstance.stream()) // Stream changes to the browser
        );
    }

    // Return all tasks as a promise
    return Promise.all([...tasks.flat(), ...bundleTasks]);
});

// SCSS Task
gulp.task('scss', () => {
    const plugins = [autoprefixer()];

    return gulp.src(PATHS.assets.scss)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .on('error', notify.onError({
            title: 'SCSS Compilation Error',
            message: '<%= error.message %>'
        }))
        .pipe(postcss(plugins))
        .pipe(isProd ? cleanCSS() : through2.obj())
        .pipe(!isProd ? sourcemaps.write('../maps') : through2.obj())
        .pipe(gulp.dest(`${PATHS.dist}/assets/css`))
        .pipe(browserSyncInstance.stream());
});

gulp.task('assets', async () => {
    const tasks = [
        processAsset(PATHS.assets.css, `${PATHS.dist}/assets/css`, cleanCSS),
        processAsset(PATHS.assets.js, `${PATHS.dist}/assets/js`, uglify),
        gulp.src(PATHS.assets.img)
            .pipe(imagemin([mozjpeg({ quality: 75, progressive: true }), optipng({ optimizationLevel: 5 })]))
            .pipe(gulp.dest(`${PATHS.dist}/assets/img`)),
        gulp.src(PATHS.assets.other)
            .pipe(gulp.dest(`${PATHS.dist}/assets`))
    ];
    return Promise.all(tasks);
});

gulp.task('serve', done => {
    browserSyncInstance.init({
        server: { baseDir: PATHS.dist },
        open: true,
        notify: true
    }, () => console.log('BrowserSync serving from dist/'));
    done();
});

gulp.task('watch', () => {
    gulp.watch('src/templates/**/*.html', gulp.series('html'));
    gulp.watch('src/data/**/*.yaml', gulp.series('html'));
    gulp.watch('src/config.yaml', gulp.series('html'));
    gulp.watch(PATHS.assets.css, gulp.series('assets'));
    gulp.watch(PATHS.assets.js, gulp.series('assets'));
    gulp.watch(PATHS.assets.img, gulp.series('assets'));
    gulp.watch(PATHS.assets.other, gulp.series('assets'));
    gulp.watch(PATHS.assets.scss, gulp.series('scss'));
});

gulp.task('build', gulp.series('clean', gulp.parallel('html', 'assets', 'scss'), () => {
    return gulp.src(`${PATHS.dist}/**/*`)
        .pipe(size({
            showFiles: true,
            gzip: true
        }));
}));
gulp.task('default', gulp.series('build', 'serve', 'watch'));