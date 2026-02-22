import gulp from 'gulp';
import { PATHS, browserSyncInstance, Languages, IsProd } from '../utils/config.mjs';
import { htmlTask } from './html.mjs';
import { assetsTask } from './assets.mjs';
import { scssTask } from './scss.mjs';
import { invalidateCache } from '../utils/data.mjs';

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

    gulp.watch(`${paths.data}/**/*.yaml`, (done) => {
        invalidateCache(); // clear all, or pass a specific lang
        htmlTask(Languages(), IsProd());
        done();
    });

    //If htmlTask throws (bad YAML, bad template), watcher can die silently.
    //fix: Wrap in try/catch inside watch callback:
    gulp.watch(paths.templates, async (done) => {
        try {
            await htmlTask(Languages(), IsProd());
        } catch (e) {
            console.error(e);
        }
        done();
    });
    gulp.watch(`${paths.src}/config.yaml`, async (done) => {
        try {
            await htmlTask(Languages(), IsProd());
        } catch (e) {
            console.error(e);
        }
        done();
    });

    gulp.watch(paths.assets.scss,          () => scssTask(IsProd()));

    // Flatten all asset globs, filter out any undefined/empty values
    const assetsGlobs = [
        paths.assets.css,
        paths.assets.js,
        paths.assets.img,
        ...paths.assets.other
    ].filter(Boolean); // Remove any falsy values (undefined, null, empty string)
    // (Boolean is the constructor function of the class, so it converts everything
    //  to boolean then null become false and filter remove it)
    // This is a common JavaScript technique to remove any falsy values from an array. 
    // In this context, it ensures that if any of the asset paths (css, js, img, other) are undefined, null, or empty strings,
    // they will be filtered out before we attempt to set up a watcher on them. 
    // This prevents errors that would occur if gulp.watch is given invalid paths.

    if (assetsGlobs.length > 0) {
        gulp.watch(assetsGlobs, () => assetsTask(IsProd()));
    }
};
