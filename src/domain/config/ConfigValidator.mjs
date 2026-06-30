// 
// 
// 



// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------


import { RuntimeAware } from '../../core/runtime/RuntimeAware.mjs';
export default class ConfigValidator extends RuntimeAware {
    constructor(runtime, project) {
        super({ runtime });
        this.project = project;
    }

    async validate() {
        // console.log(this.project.config)
        try {
            if( this.validateConfig().length == 0 )
                this.info("validation passed");
        } catch(e) {
            this.error(e)
        }
        return true;
    }

    /**
     * Validates the raw loaded config and throws with all errors listed at once.
     * @param {unknown} config
     */
    validateConfig() {
        const config = this.project.config;
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

        return errors;
    }
}
