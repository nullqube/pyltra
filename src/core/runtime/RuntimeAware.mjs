/**
 * RuntimeAware
 * ------------
 * Base class for services that require access
 * to the current runtime execution context.
 *
 * Provides:
 * - runtime reference
 * - logger shortcuts
 * - environment helpers
 * - diagnostics helpers
 * - timing helpers
 * - capability helpers
 */

export class RuntimeAware {
    /**
     * @param {Object} options
     * @param {Runtime} options.runtime
     */
    constructor({ runtime }) {
        if (!runtime) {
            throw new Error("RuntimeAware requires runtime");
        }

        this.runtime = runtime;

        // ---------------------------------------------------------------------
        // Optional internal timings
        // ---------------------------------------------------------------------

        this.createdAt = Date.now();
    }

    get command() {
        return this.runtime.command;
    }
    
    get logger() {
        return this.runtime.logger;
    }
    // -------------------------------------------------------------------------
    // Environment
    // -------------------------------------------------------------------------

    get environment() {
        return this.runtime.environment;
    }

    get isDevelopment() {
        return this.runtime.isDevelopment;
    }

    get isProduction() {
        return this.runtime.isProduction;
    }

    get isTest() {
        return this.runtime.isTest;
    }

    // -------------------------------------------------------------------------
    // Runtime Flags
    // -------------------------------------------------------------------------

    get canDebug() {
        return this.runtime.canDebug;
    }

    get isWatching() {
        return this.runtime.isWatching;
    }

    get isInteractive() {
        return this.runtime.isInteractive;
    }

    // -------------------------------------------------------------------------
    // Timing
    // -------------------------------------------------------------------------

    get uptime() {
        return this.runtime.uptime;
    }

    get lifetime() {
        return Date.now() - this.createdAt;
    }

    // -------------------------------------------------------------------------
    // Logging Shortcuts
    // -------------------------------------------------------------------------

    debug(...args) {
        this.logger?.debug(...args);
    }

    info(...args) {
        this.logger?.info(...args);
    }

    warn(...args) {
        this.logger?.warn(...args);
    }

    error(...args) {
        this.logger?.error(...args);
    }

    success(...args) {
        this.logger?.success?.(...args);
    }
}