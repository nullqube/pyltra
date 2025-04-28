import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import optipng from 'imagemin-optipng';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import { PATHS, browserSyncInstance, isProd } from '../utils/config.mjs';

// Helper for asset processing
function processAsset(src, dest, plugin) {
    let stream = gulp.src(src);
    if (!isProd) stream = stream.pipe(sourcemaps.init());
    if (plugin) stream = stream.pipe(plugin());
    if (!isProd) stream = stream.pipe(sourcemaps.write('../maps'));
    return stream.pipe(gulp.dest(dest)).pipe(browserSyncInstance.stream());
}

export const processAssets = (isProd) => {
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
}
