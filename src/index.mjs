// import gulp from 'gulp';
// import nunjucksRender from 'gulp-nunjucks-render';
// import data from 'gulp-data';
// import { readFileSync } from 'fs';
// import { join } from 'path';
import clean from 'gulp-clean';
// import cleanCSS from 'gulp-clean-css';
// import uglify from 'gulp-uglify';
// import sourcemaps from 'gulp-sourcemaps';
// import htmlmin from 'gulp-htmlmin';
// import imagemin from 'gulp-imagemin';
// import mozjpeg from 'imagemin-mozjpeg';
// import optipng from 'imagemin-optipng';
// import browserSync from 'browser-sync';
// import minimist from 'minimist';
// import yaml from 'js-yaml';
// import through2 from 'through2';
// import autoprefixer from 'autoprefixer';
// import postcss from 'gulp-postcss';
// // import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import size from 'gulp-size';
import notify from 'gulp-notify';
// import {marked} from 'marked';
// import matter from 'gray-matter';
// import rename from 'gulp-rename';


import gulp from 'gulp';
import { languages, PATHS, isProd } from './utils/config.mjs';
import { buildHTML } from './tasks/html.mjs';
import { compileScss } from './tasks/scss.mjs';
import { processAssets } from './tasks/assets.mjs';
import { startServer, watchFiles } from './tasks/serve.mjs';




// Tasks
gulp.task('clean', () => gulp.src(PATHS.dist, { read: false, allowEmpty: true }).pipe(clean()));

gulp.task('html', async () => buildHTML(languages, isProd));

gulp.task('scss', () => compileScss(isProd));

gulp.task('assets', async () => processAssets(isProd));

gulp.task('serve', done => startServer());

gulp.task('watch', () => watchFiles());

gulp.task('build', gulp.series('clean', gulp.parallel('html', 'assets', 'scss'), () => {
    return gulp.src(`${PATHS.dist}/**/*`)
        .pipe(size({
            showFiles: true,
            gzip: true
        }));
}));
gulp.task('default', gulp.series('build', 'serve', 'watch'));