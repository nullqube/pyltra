/**
 * Logger
 * ------
 * Structured logging facade for Pyltra that integrates with the Runtime context.
 *
 * Responsibilities:
 * - Create structured events with level, timestamp, message, and metadata
 * - Support nested logging groups with automatic depth tracking
 * - Route events to configured transports (console, file, etc.)
 * - Respect runtime settings (silence, verbosity, debug mode)
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
 *   runtime,
 *   transports: [
 *     new ConsoleTransport({ runtime }),
 *     new FileTransport({ runtime }),
 *   ],
 * });
 *
 * runtime.setLogger(logger);
 */
import { RuntimeAware } from "../runtime/RuntimeAware.mjs";
import { TransportManager } from "./TransportManager.mjs";

export class Logger extends RuntimeAware {
    /**
     * @param {Object} [options]
     * @param {import('../runtime/Runtime.mjs').Runtime} [options.runtime] - Runtime context.
     * @param {string} [options.prefix] - Optional logger prefix/namespace.
     * @param {string} [options.level] - Minimum log level to emit.
     * @param {Array} [options.transports] - Transport instances to send events to.
     */
    constructor({
        runtime,
        prefix = "",
        level = "debug",
        transports = [],
    } = {}) {
        super({ runtime });

        this.prefix = prefix;
        this.level = level;

        // Temporary compatibility until real hierarchy metadata exists.
        this.depth = 0;

        this.transports = new TransportManager({
            runtime,
            transports,
        });
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
        if (this.runtime.shouldSilenceOutput) {
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
        if (!this.runtime.canDebug && !this.runtime.shouldLogVerbose) {
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