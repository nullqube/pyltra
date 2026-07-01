


import type { SiteConfig } from './types.ts';

// ---------------------------------------------------------------------------
// Defaults — merged with user config so consumers never need || {}
// ---------------------------------------------------------------------------

export const CONFIG_DEFAULTS: SiteConfig = {
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