import gulp from 'gulp';
import browserSync from 'browser-sync';
import { PATHS, browserSyncInstance, isProd } from '../utils/config.mjs';

export const startServer = () => {
    browserSyncInstance.init({
        server: { baseDir: PATHS.dist },
        open: true,
        notify: true
    }, () => console.log('BrowserSync serving from dist/'));
    done();
};

export const watchFiles = () => {
    gulp.watch('src/templates/**/*.html', gulp.series('html'));
    gulp.watch('src/data/**/*.yaml', gulp.series('html'));
    gulp.watch('src/config.yaml', gulp.series('html'));
    gulp.watch(PATHS.assets.css, gulp.series('assets'));
    gulp.watch(PATHS.assets.js, gulp.series('assets'));
    gulp.watch(PATHS.assets.img, gulp.series('assets'));
    gulp.watch(PATHS.assets.other, gulp.series('assets'));
    gulp.watch(PATHS.assets.scss, gulp.series('scss'));
}