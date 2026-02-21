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
      server: { baseDir: PATHS.dist },
      open: true,
      notify: true,
      startPath: defaultPath,
    },
    () => console.log('BrowserSync serving from dist/')
  );

  done();
};

export const watchFiles = () => {
  gulp.watch('src/templates/**/*.html', htmlTask);
  gulp.watch('src/data/**/*.yaml', htmlTask);
  gulp.watch('src/config.yaml', htmlTask);

  gulp.watch(PATHS.assets.scss, scssTask);

  gulp.watch(
    [
      PATHS.assets.css,
      PATHS.assets.js,
      PATHS.assets.img,
      ...PATHS.assets.other
    ],
    assetsTask
  );
};