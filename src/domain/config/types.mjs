


// ---------------------------------------------------------------------------
// JSDoc Types
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LanguageConfig
 * @property {string} code - Language code e.g. 'en'
 * @property {string} name - Display name e.g. 'English'
 */

/**
 * @typedef {Object} PageConfig
 * @property {string} [file] - Data file pattern e.g. '${lang}.index.yaml'
 * @property {Object} [fallback] - Fallback data if file is missing
 */

/**
 * @typedef {Object} CollectionItemConfig
 * @property {string} slug
 * @property {string} file
 * @property {Object} [fallback]
 */

/**
 * @typedef {Object} CollectionConfig
 * @property {string} template
 * @property {string} item_template
 * @property {string} dataFile
 * @property {CollectionItemConfig[]} items
 */

/**
 * @typedef {Object} AssetsPathsConfig
 * @property {string} scss
 * @property {string} css
 * @property {string} js
 * @property {string} img
 * @property {string[]} other
 */

/**
 * @typedef {Object} PathsConfig
 * @property {string} src
 * @property {string} dist
 * @property {string} data
 * @property {string} templates
 * @property {AssetsPathsConfig} assets
 */

/**
 * @typedef {Object} SiteConfig
 * @property {LanguageConfig[]} languages
 * @property {Object.<string, PageConfig>} pages
 * @property {Object.<string, CollectionConfig>} collections
 * @property {string[]} bundles
 * @property {Partial<PathsConfig>} [paths]
 */
