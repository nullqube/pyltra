import gulp from 'gulp';
import clean from 'gulp-clean';
import size from 'gulp-size';
import { IsProd, Languages, PATHS } from './utils/config.mjs';
import { htmlTask } from './tasks/html.mjs';
import { scssTask } from './tasks/scss.mjs';
import { assetsTask } from './tasks/assets.mjs';
import { startServer, watchFiles } from './tasks/serve.mjs';
import { initProject } from './tasks/init.mjs';

/* -------------------- */
/* Private Gulp Tasks   */
/* -------------------- */
function cleanup() {
    return gulp
        .src(PATHS().dist, { read: false, allowEmpty: true })
        .pipe(clean());
}

function generateHTML() {
    return htmlTask(Languages(), IsProd());
}

function compileStyles() {
    return scssTask(IsProd());
}

function processResources() {
    return assetsTask(IsProd());
}

function reportSize() {
    return gulp
        .src(`${PATHS().dist}/**/*`)
        .pipe(size({ showFiles: true, gzip: true, title: 'Build output' }));
}

/* -------------------- */
/* Public Tasks         */
/* -------------------- */
export const build = gulp.series(
    cleanup,
    gulp.parallel(
        generateHTML,
        compileStyles,
        processResources
    ),
    reportSize
);

export const serve     = startServer;
export const watchTask = watchFiles;
export const initialize = initProject;

/* -------------------- */
/* Default Gulp Task    */
/* -------------------- */
export default gulp.series(build, serve, watchTask);
