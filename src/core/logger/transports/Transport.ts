/**
 * Transport
 * ---------
 * Base contract for logger transports. Concrete transport classes should
 */

import type { LogEvent } from "../types.ts";

export interface TransportOptions {
    enabled?: boolean;
    level?: string;
    silent?: boolean;
}

export class Transport {
  enabled: boolean;
  level: string;
  silent: boolean;
    constructor({
        enabled = true,
        level = "debug",
        silent = false,
    }: TransportOptions = {}) {
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
    }: TransportOptions = {}) {
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

    emit(event: LogEvent) {
        if (!this.shouldEmit(event)) {
            return;
        }

        this.write(event);
    }

    // -------------------------------------------------------------------------
    // Filtering
    // -------------------------------------------------------------------------

    shouldEmit(event: LogEvent) {
        if (!this.enabled) {
            return false;
        }

        if (this.silent) {
            return false;
        }

        return this.allowsLevel(event.level);
    }

    allowsLevel(level: string) {
        return this.levelWeight(level) >= this.levelWeight(this.level);
    }

    levelWeight(level: string) {
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

    write(event: LogEvent) {
        throw new Error(
            `${this.constructor.name}.write() must be implemented`
        );
    }
}

