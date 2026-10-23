/**
 * Runtime
 * -------
 * Central execution context for the current Pyltra process.
 *
 * Responsibilities:
 * - execution environment
 * - runtime flags
 * - diagnostics state
 * - logger access
 * - current command context
 * - runtime capabilities
 *
 * Notes:
 * - One Runtime instance should exist per engine execution.
 * - Runtime is NOT a global singleton module.
 * - Runtime represents execution state, not project state.
 */

import { Diagnostics } from "../diagnostics/Diagnostics.ts";
import type { Logger } from "../logger/Logger.ts";
import type { Reporter } from "../reporter/Reporter.ts";

export interface RuntimeOptions {
  environment?: string;
  command?: string | null;
  logger?: Logger | null;
  reporter?: Reporter | null;
  debug?: boolean;
  verbose?: boolean;
  silent?: boolean;
  watch?: boolean;
  interactive?: boolean;
  ci?: boolean;
  version?: string | null;
  startTime?: number;
}

export class Runtime {
  ci: boolean;
  command: string | null;
  debug: boolean;
  diagnostics: Diagnostics;
  environment: string;
  interactive: boolean;
  logger: Logger | null;
  reporter: Reporter | null;
  silent: boolean;
  startTime: number;
  verbose: boolean;
  version: string | null;
  watch: boolean;
    /**
     * @param {Object} options
     * @param {string} [options.environment="development"] - Execution environment (development, production, test, staging)
     * @param {string} [options.command=null] - Current command being executed
     * @param {Object} [options.logger=null] - Logger instance
     * @param {boolean} [options.debug=false] - Debug mode flag
     * @param {boolean} [options.verbose=false] - Verbose logging flag
     * @param {boolean} [options.silent=false] - Silence all output
     * @param {boolean} [options.watch=false] - Watch mode flag for file changes
     * @param {boolean} [options.interactive=true] - Allow interactive prompts
     * @param {boolean} [options.ci=false] - Continuous integration mode flag; true when running in CI/CD environment
     * @param {string} [options.version=null] - Application version
     * @param {number} [options.startTime=Date.now()] - Process start time in milliseconds
     */
    constructor({
        environment = "development",
        command = null,
        logger = null,
        reporter = null,
        debug = false,
        verbose = false,
        silent = false,
        watch = false,
        interactive = true,
        ci = false,
        version = null,
        startTime = Date.now(),
    }: RuntimeOptions = {}) {
        this.environment = environment; // "development", "production", "test", "staging"
        this.command = command; // Current command being executed, if applicable
        this.logger = logger;
        this.reporter = reporter;
        this.debug = debug; // Debug implies development, but not vice versa
        this.verbose = verbose; // Verbose implies debug, but not vice versa
        this.silent = silent; // Silent mode overrides all logging
        this.watch = watch;
        this.interactive = ci ? false : interactive; // Force non-interactive in CI environments
        this.ci = ci ?? Boolean(process.env.CI); // CI mode implies non-interactive, but not vice versa
        this.version = version; // Application version, if available
        this.startTime = startTime; // Timestamp when the process started, used for uptime calculations

        this.diagnostics = new Diagnostics();
    }

    setLogger(logger: Logger) {
        this.logger = logger;
        return this;
    }

    setReporter(reporter: Reporter) {
        this.reporter = reporter;
        return this;
    }

    getDiagnostics() {
        return this.diagnostics;
    }

    // ---------------------------------------------------------------------------
    // Environment
    // ---------------------------------------------------------------------------
    
    get isDevelopment() {
        return this.environment === "development";
    }

    get isProduction() {
        return this.environment === "production";
    }

    get isTest() {
        return this.environment === "test";
    }

    get isStaging() {
        return this.environment === "staging";
    }

    // ---------------------------------------------------------------------------
    // Logging / Diagnostics
    // ---------------------------------------------------------------------------

    get canDebug() {
        return !this.silent && (this.debug || this.isDevelopment);
    }

    get shouldLogVerbose() {
        return !this.silent && (this.verbose || this.debug);
    }

    get shouldSilenceOutput() {
        return this.silent;
    }

    // ---------------------------------------------------------------------------
    // Runtime Capabilities
    // ---------------------------------------------------------------------------

    get isWatching() {
        return this.watch;
    }

    get isInteractive() {
        return this.interactive && !this.ci;
    }

    get isCI() {
        return this.ci;
    }

    // ---------------------------------------------------------------------------
    // Timing
    // ---------------------------------------------------------------------------

    get uptime() {
        return Date.now() - this.startTime;
    }

    // ---------------------------------------------------------------------------
    // Serialization
    // ---------------------------------------------------------------------------

    toJSON() {
        return {
            environment: this.environment,
            command: this.command,
            debug: this.debug,
            verbose: this.verbose,
            silent: this.silent,
            watch: this.watch,
            interactive: this.interactive,
            ci: this.ci,
            version: this.version,
            uptime: this.uptime,
        };
    }

    // ---------------------------------------------------------------------------
    // Factory Helpers
    // ---------------------------------------------------------------------------

    static fromCLI(options: RuntimeOptions = {}) {
        return new Runtime({
            environment: options.environment,
            command: options.command,
            debug: options.debug,
            verbose: options.verbose,
            silent: options.silent,
            watch: options.watch,
            ci: options.ci,
            interactive: process.stdout.isTTY,
            version: options.version,
            logger: options.logger,
            reporter: options.reporter,
        });
    }
}