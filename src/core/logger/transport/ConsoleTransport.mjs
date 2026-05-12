
/**
 * ConsoleTransport
 * ----------------
 * Writes structured log events to the terminal with optional pretty formatting
 * and ANSI color support.
 */

import { Transport } from "./transport.mjs";

const COLORS = {
	debug: "\x1b[90m",
	info: "\x1b[36m",
	warn: "\x1b[33m",
	error: "\x1b[31m",
	reset: "\x1b[0m",
};

const DEFAULT_INDENT_WIDTH = 2; // Means 2 spaces per indent level
export class ConsoleTransport extends Transport {
	/**
	 * @param {Object} [options]
	 * @param {boolean} [options.pretty=true]
	 * @param {boolean} [options.colors=true]
	 */
	constructor(options = {}) {
		super();
		this.pretty = options.pretty ?? true;
		this.colors = options.colors ?? true;
	}

	/**
	 * Render a single event as a human-readable console line.
	 * @param {Object} event
	 * @returns {string}
	 */
	formatPretty(event) {
		const indent = " ".repeat((event.indent || 0) * DEFAULT_INDENT_WIDTH);
		const color = this.colors ? COLORS[event.level] : "";
		const reset = this.colors ? COLORS.reset : "";
		const prefix = event.prefix ? ` ${event.prefix} →` : "";

		let line = `${indent}${color}${event.level.toUpperCase()}${reset}${prefix} ${event.message}`;

		if (event.meta && Object.keys(event.meta).length) {
			line += ` ${JSON.stringify(event.meta)}`;
		}

		return line;
	}

	/**
	 * Render a structured event as JSON.
	 * @param {Object} event
	 * @returns {string}
	 */
	formatJSON(event) {
		return JSON.stringify(event);
	}

	/**
	 * Output the log event to the appropriate console stream.
	 * @param {Object} event
	 */
	log(event) {
		const output = this.pretty
			? this.formatPretty(event)
			: this.formatJSON(event);

		if (event.level === "error") console.error(output);
		else if (event.level === "warn") console.warn(output);
		else console.log(output);
	}

	/**
	 * Render a separator line to console output.
	 * @param {string} text
	 * @param {Object} [options]
	 */
	line(text, options = {}) {
		const indent = " ".repeat((options.indent || 0) * 2);
		console.log(indent + text);
	}
}
