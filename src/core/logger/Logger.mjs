/**
 * Logger
 * ------
 * Facade for structured logging in Pyltra. A Logger creates events with
 * level, prefix, optional metadata, and nested indentation state, then
 * delegates dispatch to one or more transports.
 */
import { TransportManager } from "./TransportManager.mjs";


export class Logger {
	/**
	 * @param {Object} [options]
	 * @param {string} [options.prefix] - Optional prefix to include on every log event.
	 * @param {string} [options.level] - Log level threshold.
	 * @param {Array} [options.transports] - Array of transport instances.
	 */
	constructor(options = {}) {
		this.prefix = options.prefix ?? "";
		this.level = options.level || "debug";

		this.indentLevel = 0;

		this.transport = new TransportManager(options.transports || []);
	}

	/**
	 * Build a structured log event payload.
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
			indent: this.indentLevel,
		};
	}

	/**
	 * Dispatch a log event via configured transports.
	 * @param {string} level
	 * @param {string} message
	 * @param {Object} [meta]
	 */
	log(level, message, meta) {
		const event = this.createEvent(level, message, meta);
		this.transport.log(event);
	}

	debug(m, meta) {
		this.log("debug", m, meta);
	}

	info(m, meta) {
		this.log("info", m, meta);
	}

	warn(m, meta) {
		this.log("warn", m, meta);
	}

	error(m, meta) {
		this.log("error", m, meta);
	}

	/**
	 * Start a log group and increase indentation for nested messages.
	 * @param {string} label
	 */
	group(label) {
		this.info(`▶ ${label}`);
		this.indentLevel++;
	}

	/**
	 * End the current log group and decrease indentation.
	 * @param {string} label
	 */
	groupEnd(label) {
		this.indentLevel = Math.max(0, this.indentLevel - 1);
		this.info(`◀ ${label}`);
	}

	/**
	 * Run an async callback inside a named log group.
	 * @param {string} label
	 * @param {Function} fn
	 */
	async withGroup(label, fn) {
		this.group(label);
		try {
			return await fn();
		} finally {
			this.groupEnd(label);
		}
	}

	/**
	 * Emit a separator line through transports.
	 * @param {string} [char]
	 * @param {number} [length]
	 */
	line(char = "─", length = 23) {
		const text = char.repeat(length);

		this.transport.line(text, {
			indent: this.indentLevel,
		}); 
	}
}
