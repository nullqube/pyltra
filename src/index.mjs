import gulp from 'gulp';
import { IsProd, Languages, PATHS } from './utils/config.mjs';
import { buildHTML } from './tasks/html.mjs';
import { compileScss } from './tasks/scss.mjs';
import { processAssets } from './tasks/assets.mjs';
import { startServer, watch } from './tasks/serve.mjs';
import { initProject } from './tasks/init.mjs';
import clean from 'gulp-clean';
import size from 'gulp-size';

// Private Task: Clean the `dist` folder
function cleanup(cb) {
    return gulp.src(PATHS.dist, { read: false, allowEmpty: true }).pipe(clean());
}

// Private Task: Generate HTML files
function generateHTML(cb) {
    buildHTML(Languages(), IsProd());
    cb();
}

// Private Task: Compile SCSS files
function compileStyles(cb) {
    compileScss(IsProd);
    cb();
}

// Private Task: Process assets (images, fonts, etc.)
function processResources(cb) {
    processAssets(IsProd);
    cb();
}

// Public Task: Initialize the project
export const initialize = initProject;

// Public Task: Serve the development server
export const serve = startServer;


// Public Task: Build the project
export const build = gulp.series(
    cleanup,
    gulp.parallel(generateHTML, compileStyles, processResources),
    () => {
        return gulp.src(`${PATHS.dist}/**/*`)
            .pipe(size({
                showFiles: true,
                gzip: true
            }));
    }
);

// Default Task: Run `build`, then `serve`, and `watch`
export default gulp.series(build, serve, watch);