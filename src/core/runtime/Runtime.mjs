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

export class Runtime {
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
        debug = false,
        verbose = false,
        silent = false,
        watch = false,
        interactive = true,
        ci = false,
        version = null,
        startTime = Date.now(),
    } = {}) {
        this.environment = environment;
        this.command = command;
        this.logger = logger;
        this.debug = debug;
        this.verbose = verbose;
        this.silent = silent;
        this.watch = watch;
        this.interactive = interactive;
        this.ci = ci;
        this.version = version;
        this.startTime = startTime;
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
        return this.debug || this.isDevelopment;
    }

    get shouldLogVerbose() {
        return this.verbose || this.debug;
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
        return this.interactive;
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

    static fromCLI(options = {}) {
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
        });
    }
}
