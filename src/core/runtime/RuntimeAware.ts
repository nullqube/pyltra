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

import type { Runtime } from "./Runtime.ts";
import type { LogMeta } from "../logger/types.ts";

export class RuntimeAware {
  createdAt: number;
  runtime: Runtime;
    /**
     * @param {Object} options
     * @param {Runtime} options.runtime
     */
    constructor({ runtime }: { runtime?: Runtime } = {}) {
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

    get diagnostics() {
        return this.runtime.getDiagnostics();
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

    get shouldLogVerbose() {
        return this.runtime.shouldLogVerbose;
    }

    get shouldSilenceOutput() {
        return this.runtime.shouldSilenceOutput;
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

    debug(...args: [message: string, meta?: LogMeta]) {
        this.logger?.debug(...args);
    }

    info(...args: [message: string, meta?: LogMeta]) {
        this.logger?.info(...args);
    }

    warn(...args: [message: string, meta?: LogMeta]) {
        this.logger?.warn(...args);
    }

    error(...args: [message: string, meta?: LogMeta]) {
        this.logger?.error(...args);
    }

    success(...args: [message: string, meta?: LogMeta]) {
        this.logger?.success?.(...args);
    }
}