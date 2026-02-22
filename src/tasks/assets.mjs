import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import optipng from 'imagemin-optipng';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import through2 from 'through2';
import { PATHS, browserSyncInstance } from '../utils/config.mjs';
import merge from 'merge-stream';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Processes a single asset type with optional sourcemaps and transform plugin.
 * Sourcemaps are only initialised when a plugin is present (i.e. something
 * actually transforms the file) — no-op streams don't need them.
 *
 * @param {boolean}  isProd
 * @param {string}   src
 * @param {string}   dest
 * @param {Function} [plugin] - optional gulp transform (uglify, cleanCSS, …)
 * @returns {NodeJS.ReadWriteStream}
 */
function processAsset(isProd, src, dest, plugin) {
    let stream = gulp.src(src, { allowEmpty: true });

    if (plugin) {
        if (!isProd) stream = stream.pipe(sourcemaps.init());
        stream = stream.pipe(plugin());
        if (!isProd) stream = stream.pipe(sourcemaps.write('../maps'));
    }

    return stream
        .pipe(gulp.dest(dest))
        .pipe(browserSyncInstance.stream());
}

// ---------------------------------------------------------------------------
// assetsTask
// ---------------------------------------------------------------------------

export const assetsTask = (isProd) => {
    const paths = PATHS();

    const cssTask = processAsset(
        isProd,
        paths.assets.css,
        `${paths.dist}/assets/css`,
        cleanCSS
    );

    const jsTask = processAsset(
        isProd,
        paths.assets.js,
        `${paths.dist}/assets/js`,
        uglify
    );

    // Images — error handler prevents a single corrupt file crashing the build
    const imgTask = gulp
        .src(paths.assets.img, { allowEmpty: true })
        .pipe(
            imagemin(
                [
                    mozjpeg({ quality: 75, progressive: true }),
                    optipng({ optimizationLevel: 5 })
                ],
                { verbose: true }
            )
        )
        .on('error', (err) => console.error(`imagemin error: ${err.message}`))
        .pipe(gulp.dest(`${paths.dist}/assets/img`))
        .pipe(browserSyncInstance.stream());

    // Other assets (fonts, etc.) — copy as-is
    const otherTask = gulp
        .src(paths.assets.other, { allowEmpty: true })
        .pipe(gulp.dest(`${paths.dist}/assets`))
        .pipe(browserSyncInstance.stream());

    return merge(cssTask, jsTask, imgTask, otherTask);
};
