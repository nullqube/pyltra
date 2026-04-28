// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

/**
 * Validates the raw loaded config and throws with all errors listed at once.
 * @param {unknown} config
 */
export function validateConfig(config) {
    const errors = [];

    if (!config || typeof config !== 'object') {
        throw new Error('config.yaml must be a YAML object, got: ' + typeof config);
    }

    // languages
    if (!Array.isArray(config.languages) || config.languages.length === 0) {
        errors.push('"languages" must be a non-empty array');
    } else {
        config.languages.forEach((lang, i) => {
            if (!lang.code || typeof lang.code !== 'string')
                errors.push(`languages[${i}] is missing a valid "code" string`);
            if (!lang.name || typeof lang.name !== 'string')
                errors.push(`languages[${i}] is missing a valid "name" string`);
        });
    }

    // pages
    if (!config.pages || typeof config.pages !== 'object' || Array.isArray(config.pages)) {
        errors.push('"pages" must be an object');
    }

    // collections (optional)
    if (config.collections !== undefined) {
        if (typeof config.collections !== 'object' || Array.isArray(config.collections)) {
            errors.push('"collections" must be an object if defined');
        } else {
            Object.entries(config.collections).forEach(([name, col]) => {
                if (!col.template)
                    errors.push(`collections.${name} is missing "template"`);
                if (!col.item_template)
                    errors.push(`collections.${name} is missing "item_template"`);
                if (!col.dataFile)
                    errors.push(`collections.${name} is missing "dataFile"`);

                if (!Array.isArray(col.items)) {
                    errors.push(`collections.${name} "items" must be an array`);
                } else {
                    col.items.forEach((item, i) => {
                        if (!item.slug)
                            errors.push(`collections.${name}.items[${i}] is missing "slug"`);
                        if (!item.file)
                            errors.push(`collections.${name}.items[${i}] is missing "file"`);
                    });
                }
            });
        }
    }

    // bundles (optional)
    if (config.bundles !== undefined && !Array.isArray(config.bundles)) {
        errors.push('"bundles" must be an array if defined');
    }

    // paths (optional)
    if (config.paths !== undefined &&
        (typeof config.paths !== 'object' || Array.isArray(config.paths))) {
        errors.push('"paths" must be an object if defined');
    }

    if (errors.length > 0) {
        throw new Error(
            `config.yaml has ${errors.length} error(s):\n` +
            errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
        );
    }
}

// ---------------------------------------------------------------------------
// Merge defaults
// ---------------------------------------------------------------------------

/**
 * Deep merges defaults with user config. User values always win.
 * @param {SiteConfig} defaults
 * @param {SiteConfig} userConfig
 * @returns {SiteConfig}
 */
export function mergeWithDefaults(defaults, userConfig) {
    return {
        ...defaults,
        ...userConfig,
        paths: {
            ...defaults.paths,
            ...(userConfig.paths || {})
        },
        collections: {
            ...defaults.collections,
            ...(userConfig.collections || {})
        }
    };
}

// ---------------------------------------------------------------------------
// Build paths
// ---------------------------------------------------------------------------

/**
 * Derives PATHS from the merged config so users can override
 * src, dist, data, or templates in config.yaml.
 * @param {SiteConfig} config
 * @returns {PathsConfig}
 */
export function buildPaths(config) {
    const overrides = config.paths || {};

    const src  = overrides.src  || 'src';
    const dist = overrides.dist || 'dist';
    const data = overrides.data || `${src}/data`;

    return {
        src,
        dist,
        data,
        templates: overrides.templates || `${src}/templates/*.html`,
        assets: {
            scss: `${src}/assets/scss/**/*.scss`,
            css:  `${src}/assets/css/**/*.css`,
            js:   `${src}/assets/js/**/*.js`,
            img:  `${src}/assets/img/**/*`,
            other: [
                `${src}/assets/**/*`,
                `!${src}/assets/scss/**`,
                `!${src}/assets/css/**/*.css`,
                `!${src}/assets/js/**/*.js`,
                `!${src}/assets/img/**/*`
            ],
            // Allow full per-key asset override if needed
            ...(overrides.assets || {})
        }
    };
}