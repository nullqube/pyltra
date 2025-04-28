import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import cleanCSS from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import * as dartSass from 'sass'; // Import all from 'sass' to use dartSass
const sass = gulpSass(dartSass); // Bind `gulp-sass` to `dart-sass`
import notify from 'gulp-notify';
import through2 from 'through2';
import { PATHS, browserSyncInstance, isProd } from '../utils/config.mjs';

export const compileScss = (isProd) => {
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
}