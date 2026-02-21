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
    .src(PATHS.dist, { read: false, allowEmpty: true })
    .pipe(clean());
}

function generateHTML(cb) {
  htmlTask(Languages(), IsProd());
  cb();
}

function compileStyles(cb) {
  scssTask(IsProd());
  cb();
}

function processResources(cb) {
  assetsTask(IsProd());
  cb();
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
  () =>
    gulp
      .src(`${PATHS.dist}/**/*`)
      .pipe(size({ showFiles: true, gzip: true }))
);

export const serve = startServer;
export const watchTask = watchFiles;
export const initialize = initProject;

/* -------------------- */
/* Default Gulp Task    */
/* -------------------- */

export default gulp.series(build, serve, watchTask);