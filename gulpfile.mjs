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
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import size from 'gulp-size';
import notify from 'gulp-notify';

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
    config = yaml.load(readFileSync('./config.yaml', 'utf8'));
    if (!config.languages) 
        throw new Error('Invalid config.yaml: Missing "languages"');
    if (!config.pages) 
        throw new Error('Invalid config.yaml: Missing "pages"');
} catch (e) {
    console.error('Error loading config.yaml:', e.message);
    process.exit(1);
}

const languages = config.languages.map(lang => lang.code);

// Load page data (keeps flat structure)
function loadPageData(lang, cwd = process.cwd()) {
    const res = [{ langs: config.languages }]; // Start with languages list
    const pages = config.pages;

    console.log(`Loading data for ${lang}...`);
    for (const [key, { file, fallback }] of Object.entries(pages)) {
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
    const tasks = languages.map(lang =>
        gulp.src(PATHS.templates)
            .pipe(data(file => {
                const filename = file.basename.replace('.html', '');
                const pageData = loadPageData(lang);
                console.log(`Building ${lang}/${filename}`);
                return pageData;
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
            .pipe(browserSyncInstance.stream())
    );

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
    
    return Promise.all([...tasks, ...bundleTasks]);
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