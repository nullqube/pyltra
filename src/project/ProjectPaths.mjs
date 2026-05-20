import path from 'path';

/**
 * ProjectPaths
 * ------------
 * Canonical project path container and resolver.
 */
export class ProjectPaths {
    /**
     * @param {Object} options
     * @param {string} options.root
     * @param {Object} options.paths
     */
    constructor({ root, paths }) {
        if (!root) {
            throw new Error('ProjectPaths requires "root".');
        }

        this.root = path.resolve(root);

        this.paths = Object.freeze(
            structuredClone(paths || {})
        );
    }

    /**
     * Returns raw configured path value.
     *
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        if (!this.has(key)) {
            throw new Error(`Unknown project path "${key}".`);
        }

        return structuredClone(this.paths[key]);
    }

    /**
     * Returns resolved absolute filesystem path.
     *
     * @param {string} key
     * @returns {string}
     */
    resolvePath(key) {
        const value = this.get(key);

        if (typeof value !== 'string') {
            throw new Error(
                `Project path "${key}" is not resolvable.`
            );
        }

        return path.isAbsolute(value)
            ? value
            : path.join(this.root, value);
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return Object.hasOwn(this.paths, key);
    }

    /**
     * Common helpers
     */
    getSourcePath() {
        return this.resolvePath('src');
    }

    getDistPath() {
        return this.resolvePath('dist');
    }

    getDataPath() {
        return this.resolvePath('data');
    }

    /**
     * Serializable snapshot
     *
     * @returns {Object}
     */
    toJSON() {
        return structuredClone(this.paths);
    }
}