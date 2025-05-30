import gulp from "gulp";
import data from "gulp-data";
import nunjucksRender from "gulp-nunjucks-render";
import through2 from "through2";
import rename from "gulp-rename";
import htmlmin from "gulp-htmlmin";
import { marked } from "marked";
import notify from "gulp-notify";
import { loadPageData } from "../utils/data.mjs";
import { PATHS, browserSyncInstance, Config } from "../utils/config.mjs";

export const buildHTML = (languages, isProd) => {
  const tasks = languages.map((lang) => {
    const pageData = loadPageData(lang);
    const pagesTasks = gulp
      .src(PATHS.templates)
      .pipe(
        data((file) => {
          const filename = file.basename.replace(".html", "");
          console.log(`Building ${lang}/${filename}`);
          return { activePage: filename, ...pageData };
        })
      )
      .pipe(
        nunjucksRender({
          path: ["src/templates"],
          manageEnv: (env) => {
            env.addFilter("markdown", (content) => {
              if (!content) return "";
              return marked(content);
            });
            env.addFilter("date", (date, format) => {
              if (!date) return "";
              const options = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              };
              return new Date(date).toLocaleDateString("en-US", options);
            });
            env.addFilter("slugify", (str) => {
              if (!str) return "";
              return str
                .toString()
                .toLowerCase()
                .replace(/\s+/g, "-") // Replace spaces with -
                .replace(/[^\w\-]+/g, "") // Remove all non-word chars
                .replace(/\-\-+/g, "-") // Replace multiple - with single -
                .replace(/^-+/, "") // Trim - from start of text
                .replace(/-+$/, ""); // Trim - from end of text
            });
            env.addFilter("truncate", (str, length) => {
              if (!str) return "";
              if (str.length <= length) return str;
              return str.slice(0, length) + "...";
            });
            env.addFilter("tojson", (obj) => JSON.stringify(obj, null, 2));
          },
        })
      )
      .on("error", (err) =>
        console.error(`Nunjucks error for ${lang}: ${err.message}`)
      )
      .on(
        "error",
        notify.onError({
          title: "HTML Compilation Error",
          message: "<%= error.message %>",
        })
      )
      .pipe(
        isProd
          ? htmlmin({
              collapseWhitespace: true,
              removeComments: true,
              minifyCSS: true,
              minifyJS: true,
            })
          : through2.obj()
      ) // Minify in production or pass through
      .pipe(gulp.dest(`${PATHS.dist}/${lang}`))
      .pipe(browserSyncInstance.stream());

    // Process collections
    const collectionTasks = Object.entries(Config().collections || {}).flatMap(
      ([collectionName, { template, item_template, items }]) => {
        const collectionData = pageData[collectionName];

        // Main collection page
        // const mainPageTask = gulp.src(`src/templates/${template}`, { allowEmpty: true })
        //     .pipe(data(() => ({ lang, ...collectionData, collection: collectionName })))
        //     .pipe(nunjucksRender({
        //         path: ['src/templates'],
        //         manageEnv: env => env.addFilter('tojson', obj => JSON.stringify(obj, null, 2))
        //     }))
        //     .pipe(isProd ? htmlmin({
        //         collapseWhitespace: true,
        //         removeComments: true,
        //         minifyCSS: true,
        //         minifyJS: true
        //     }) : through2.obj())
        //     .pipe(gulp.dest(`${PATHS.dist}/${lang}`))
        //     .pipe(browserSyncInstance.stream());

        // Individual item pages
        const itemTasks = items.map((item) => {
          const itemData = collectionData.items.find(
            (i) => i.slug === item.slug
          );
          // console.log({...pageData, ...{ lang, article: itemData, collection: collectionName }})
          return gulp
            .src(`src/templates/${item_template}`, { allowEmpty: true })
            .pipe(
              data(() => ({
                ...pageData,
                ...{ lang, article: itemData, collection: collectionName },
              }))
            )
            .pipe(
              nunjucksRender({
                path: ["src/templates"],
                manageEnv: (env) =>
                  env.addFilter("tojson", (obj) =>
                    JSON.stringify(obj, null, 2)
                  ),
              })
            )
            .pipe(
              isProd
                ? htmlmin({
                    collapseWhitespace: true,
                    removeComments: true,
                    minifyCSS: true,
                    minifyJS: true,
                  })
                : through2.obj()
            )
            .pipe(rename({ basename: item.slug })) // Set the output filename here
            .pipe(gulp.dest(`${PATHS.dist}/${lang}/${collectionName}`))
            .pipe(browserSyncInstance.stream());
        });
        return [...itemTasks];
      }
    );

    return [pagesTasks, ...collectionTasks];
  });

  // New tasks for Config().bundle files
  let bundleTasks = [];
  if (Array.isArray(Config().bundles) && Config().bundles.length > 0) {
    bundleTasks = Config().bundles.map(
      (fileName) =>
        gulp
          .src(`src/${fileName}`) // Read each file pattern
          .pipe(
            isProd
              ? htmlmin({
                  collapseWhitespace: true,
                  removeComments: true,
                  minifyCSS: true,
                  minifyJS: true,
                })
              : through2.obj()
          ) // Minify in production or write directly
          // through2.obj() : act as no-op transform stream
          .pipe(gulp.dest(PATHS.dist)) // Write to the output directory
          .pipe(browserSyncInstance.stream()) // Stream changes to the browser
    );
  }

  // Return all tasks as a promise
  return Promise.all([...tasks.flat(), ...bundleTasks]);
};
