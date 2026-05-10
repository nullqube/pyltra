


// ---------------------------------------------------------------------------
// Defaults — merged with user config so consumers never need || {}
// ---------------------------------------------------------------------------

/** @type {SiteConfig} */
export const CONFIG_DEFAULTS = {
    site: {
        title: 'Pyltra Site'
    },
    languages:   [
        { code: 'en', name: 'English' }
    ],
    pages:       {},
    collections: {},
    paths:       {
        src: 'src',
        dist: 'dist',
        data: 'src/data'
    },
    bundles:     []
};