/**
 * Transport
 * ---------
 * Base contract for logger transports. Concrete transport classes should
 */

export class Transport {
    constructor({
        enabled = true,
        level = "debug",
        silent = false,
    } = {}) {
        this.setConfig({
            enabled,
            level,
            silent,
        });
    }

    /**
     * Update transport configuration.
     *
     * @param {Object} [config]
     * @param {boolean} [config.enabled] - Whether this transport is active.
     * @param {string} [config.level] - Minimum log level to emit.
     * @param {boolean} [config.silent] - Silence this transport.
     * @returns {Transport}
     */
    setConfig({
        enabled,
        level,
        silent,
    } = {}) {
        if (enabled !== undefined) {
            this.enabled = enabled;
        }

        if (level !== undefined) {
            this.level = level;
        }

        if (silent !== undefined) {
            this.silent = silent;
        }

        return this;
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    emit(event) {
        if (!this.shouldEmit(event)) {
            return;
        }

        this.write(event);
    }

    // -------------------------------------------------------------------------
    // Filtering
    // -------------------------------------------------------------------------

    shouldEmit(event) {
        if (!this.enabled) {
            return false;
        }

        if (this.silent) {
            return false;
        }

        return this.allowsLevel(event.level);
    }

    allowsLevel(level) {
        return this.levelWeight(level) >= this.levelWeight(this.level);
    }

    levelWeight(level) {
        switch (level) {
            case "debug":
                return 10;

            case "info":
                return 20;

            case "success":
                return 25;

            case "warn":
                return 30;

            case "error":
                return 40;

            default:
                return 0;
        }
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    // -------------------------------------------------------------------------
    // Abstract
    // -------------------------------------------------------------------------

    write() {
        throw new Error(
            `${this.constructor.name}.write() must be implemented`
        );
    }
}

