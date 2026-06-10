/**
 * Logger
 * ------
 * Structured logging facade for Pyltra.
 *
 * Responsibilities:
 * - Create structured events with level, timestamp, message, and metadata
 * - Support nested logging groups with automatic depth tracking
 * - Route events to configured transports (console, file, etc.)
 * - Respect logger settings (silence, verbosity, debug mode)
 *
 * Event Structure:
 * - time: ISO timestamp
 * - level: "debug", "info", "warn", "error", "success", "line"
 * - message: text to log
 * - prefix: optional logger name/prefix
 * - meta: optional metadata object
 * - scope: optional scope identifier for categorization
 * - depth: current nesting depth (0 = root)
 * - groupId: unique group identifier for hierarchical tracking
 * - parentId: parent group ID (for future use)
 * 
 * 
 * sample usage:
 * const runtime = Runtime.fromCLI(options);
 *
 * const logger = new Logger({
 *   debug: options.debug,
 *   verbose: options.verbose,
 *   silent: options.silent,
 *   environment: options.environment,
 *   transports: [
 *     new ConsoleTransport(),
 *     new FileTransport(),
 *   ],
 * });
 *
 * runtime.setLogger(logger);
 */
import { TransportManager } from "./TransportManager.mjs";

export class Logger {
    /**
     * @param {Object} [options]
     * @param {boolean} [options.debug=false] - Debug mode flag.
     * @param {boolean} [options.debugEnabled] - Debug mode flag alias.
     * @param {boolean} [options.verbose=false] - Verbose logging flag.
     * @param {boolean} [options.silent=false] - Silence all output.
     * @param {string} [options.environment="development"] - Execution environment.
     * @param {string} [options.prefix] - Optional logger prefix/namespace.
     * @param {string} [options.level] - Minimum log level to emit.
     * @param {Array} [options.transports] - Transport instances to send events to.
     */
    constructor({
        debug = false,
        debugEnabled,
        verbose = false,
        silent = false,
        environment = "development",
        prefix = "",
        level = "debug",
        transports = [],
    } = {}) {
        this.setConfig({
            debug,
            debugEnabled,
            verbose,
            silent,
            environment,
            prefix,
        });
		// For future use when implementing log level filtering.
		// this.level will represent the minimum log level to emit (e.g., "info" would emit "info", "warn", "error", but not "debug").
		// For now, all events are emitted regardless of level, and filtering can be handled by transports or the runtime configuration.
		// this.level = level is reserved for future log level filtering logic. Currently, all levels are emitted and transports can decide how to handle them.
		// In the future, we may implement logic in emit() to check this.level against the event level and skip emitting if the event level is below the configured threshold.
        this.level = level;

        // Temporary compatibility until real hierarchy metadata exists.
        this.depth = 0;

        this.transports = new TransportManager({
            transports,
        });
    }

    /**
     * Update logger configuration without requiring a Runtime reference.
     *
     * @param {Object} [config]
     * @param {boolean} [config.debug] - Alias for debugEnabled.
     * @param {boolean} [config.debugEnabled] - Debug mode flag.
     * @param {boolean} [config.verbose] - Verbose logging flag.
     * @param {boolean} [config.silent] - Silence all output.
     * @param {string} [config.environment] - Execution environment.
     * @param {string} [config.prefix] - Optional logger prefix/namespace.
     * @param {string} [config.level] - Minimum log level to emit.
     * @returns {Logger}
     */
    setConfig({
        debug,
        debugEnabled,
        verbose,
        silent,
        environment,
        prefix,
        level,
    } = {}) {
        if (debug !== undefined) {
            this.debugEnabled = debug;
        }

        if (debugEnabled !== undefined) {
            this.debugEnabled = debugEnabled;
        }

        if (verbose !== undefined) {
            this.verbose = verbose;
        }

        if (silent !== undefined) {
            this.silent = silent;
        }

        if (environment !== undefined) {
            this.environment = environment;
        }

        if (prefix !== undefined) {
            this.prefix = prefix;
        }

        if (level !== undefined) {
            this.level = level;
        }

        return this;
    }

    get isDevelopment() {
        return this.environment === "development";
    }

    get canDebug() {
        return !this.silent && (this.debugEnabled || this.isDevelopment);
    }

    get shouldLogVerbose() {
        return !this.silent && (this.verbose || this.debugEnabled);
    }

    get shouldSilenceOutput() {
        return this.silent;
    }

    /**
     * Build a structured log event payload.
     *
     * @param {string} level
     * @param {string} message
     * @param {Object} [meta]
     * @returns {Object}
     */
    createEvent(level, message, meta = {}) {
        return {
            time: new Date().toISOString(),
            level,
            message,
            prefix: this.prefix,
            meta,

            // Canonical future hierarchy fields.
            scope: meta.scope ?? null,
            depth: meta.depth ?? this.depth,
            groupId: meta.groupId ?? null,
            parentId: meta.parentId ?? null,
        };
    }

    /**
     * Emit a structured log event to transports (respecting runtime silence).
     *
     * @param {string} level
     * @param {string} message
     * @param {Object} [meta]
     */
    emit(level, message, meta = {}) {
        if (this.shouldSilenceOutput) {
            return;
        }

        const event = this.createEvent(level, message, meta);
        this.transports.emit(event);
    }

    /**
     * Debug-level log (only if debug or verbose mode is enabled).
     *
     * @param {string} message
     * @param {Object} [meta]
     */
    debug(message, meta = {}) {
        if (!this.canDebug && !this.shouldLogVerbose) {
            return;
        }

        this.emit("debug", message, meta);
    }

    /**
     * Info-level log.
     *
     * @param {string} message
     * @param {Object} [meta]
     */
    info(message, meta = {}) {
        this.emit("info", message, meta);
    }

    /**
     * Warning-level log.
     *
     * @param {string} message
     * @param {Object} [meta]
     */
    warn(message, meta = {}) {
        this.emit("warn", message, meta);
    }

    /**
     * Error-level log.
     *
     * @param {string} message
     * @param {Object} [meta]
     */
    error(message, meta = {}) {
        this.emit("error", message, meta);
    }

    /**
     * Success-level log (custom level for positive outcomes).
     *
     * @param {string} message
     * @param {Object} [meta]
     */
    success(message, meta = {}) {
        this.emit("success", message, meta);
    }

    /**
     * Start a nested log group and increase depth.
     * Emits a visual group start marker and returns a group ID for tracking.
     *
     * @param {string} label
     * @param {Object} [meta]
     * @returns {string} groupId
     */
    group(label, meta = {}) {
        const groupId = meta.groupId ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

        this.info(`▶ ${label}`, {
            ...meta,
            groupId,
            depth: this.depth,
        });

        this.depth++;

        return groupId;
    }

    /**
     * End the current nested log group and decrease depth.
     *
     * @param {string} label
     * @param {Object} [meta]
     */
    groupEnd(label, meta = {}) {
        this.depth = Math.max(0, this.depth - 1);

        this.info(`◀ ${label}`, {
            ...meta,
            depth: this.depth,
        });
    }

    /**
     * Run an async callback inside a named log group with automatic cleanup.
     *
     * @param {string} label
     * @param {Function} fn - Async callback that receives {groupId}.
     * @param {Object} [meta]
     * @returns {*}
     */
    async withGroup(label, fn, meta = {}) {
        const groupId = this.group(label, meta);

        try {
            return await fn({ groupId });
        } finally {
            this.groupEnd(label, { groupId });
        }
    }

    /**
     * Emit a separator line.
     *
     * @param {string} [char] - Character to repeat.
     * @param {number} [length] - Number of repetitions.
     */
    line(char = "─", length = 23) {
        this.emit("line", char.repeat(length), {
            depth: this.depth,
        });
    }
}
