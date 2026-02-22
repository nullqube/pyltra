import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import cleanCSS from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import through2 from 'through2';
import notify from 'gulp-notify';
import * as dartSass from 'sass';
import { PATHS, browserSyncInstance } from '../utils/config.mjs';

const sass = gulpSass(dartSass);

export const scssTask = (isProd) => {
    const paths   = PATHS();
    const mapsDir = `${paths.dist}/maps`; // derived from config, not hardcoded

    return gulp
        .src(paths.assets.scss)
        .pipe(isProd ? through2.obj() : sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .on('error', notify.onError({
            title: 'SCSS Compilation Error',
            message: '<%= error.message %>'
        }))
        .pipe(postcss([autoprefixer()]))
        .pipe(isProd ? cleanCSS() : through2.obj())
        .pipe(isProd ? through2.obj() : sourcemaps.write(mapsDir))
        .pipe(gulp.dest(`${paths.dist}/assets/css`))
        .pipe(browserSyncInstance.stream());
};
