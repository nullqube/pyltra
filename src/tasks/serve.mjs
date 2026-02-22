import gulp from 'gulp';
import { PATHS, browserSyncInstance, Languages } from '../utils/config.mjs';
import { htmlTask } from './html.mjs';
import { assetsTask } from './assets.mjs';
import { scssTask } from './scss.mjs';

export const startServer = (done = () => {}) => {
    const langs = Languages();
    const defaultLang = langs.length > 0 ? langs[0] : 'en';
    const defaultPath = `/${defaultLang}/`;

    console.log(`Serving ${langs.join(', ')} from dist/`);

    browserSyncInstance.init(
        {
            server: { baseDir: PATHS().dist },
            open: true,
            notify: true,
            startPath: defaultPath,
        },
        () => console.log('BrowserSync serving from dist/')
    );

    done();
};

export const watchFiles = () => {
    const paths = PATHS(); // resolve once for this call

    gulp.watch(paths.templates,          htmlTask);
    gulp.watch(`${paths.data}/**/*.yaml`, htmlTask);
    gulp.watch(`${paths.src}/config.yaml`, htmlTask);
    gulp.watch(paths.assets.scss,         scssTask);

    // Flatten all asset globs, filter out any undefined/empty values
    const assetsGlobs = [
        paths.assets.css,
        paths.assets.js,
        paths.assets.img,
        ...paths.assets.other
    ].filter(Boolean);

    if (assetsGlobs.length > 0) {
        gulp.watch(assetsGlobs, assetsTask);
    }
};
