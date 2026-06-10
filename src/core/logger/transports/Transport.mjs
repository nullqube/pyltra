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
        this.enabled = enabled;
        this.level = level;
        this.silent = silent;
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
