import gulp from 'gulp';
// import browserSync from 'browser-sync';
import { PATHS, browserSyncInstance, Languages } from '../utils/config.mjs';

export const startServer = (done) => {
    const defaultLang = Languages().length > 0 ? Languages()[0] : 'en';
    const defaultPath = `/${defaultLang}/`;
    console.log(`Serving ${languages} from dist/`);
    browserSyncInstance.init({
        server: { baseDir: PATHS.dist },
        open: true,
        notify: true,
        startPath: defaultPath,
    }, () => console.log('BrowserSync serving from dist/'));
    done();
};

export const watch = () => {
    gulp.watch('src/templates/**/*.html', gulp.series('html'));
    gulp.watch('src/data/**/*.yaml', gulp.series('html'));
    gulp.watch('src/config.yaml', gulp.series('html'));
    gulp.watch(PATHS.assets.css, gulp.series('assets'));
    gulp.watch(PATHS.assets.js, gulp.series('assets'));
    gulp.watch(PATHS.assets.img, gulp.series('assets'));
    gulp.watch(PATHS.assets.other, gulp.series('assets'));
    gulp.watch(PATHS.assets.scss, gulp.series('scss'));
}