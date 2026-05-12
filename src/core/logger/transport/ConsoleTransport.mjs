import { Transport } from "./transport.mjs";

const COLORS = {
	debug: "\x1b[90m",
	info: "\x1b[36m",
	warn: "\x1b[33m",
	error: "\x1b[31m",
	reset: "\x1b[0m",
};

export class ConsoleTransport extends Transport {
	constructor(options = {}) {
		super();
		this.pretty = options.pretty ?? true;
		this.colors = options.colors ?? true;
	}

	formatPretty(event) {
		const indent = " ".repeat((event.indent || 0) * 2);
		const color = this.colors ? COLORS[event.level] : "";
		const reset = this.colors ? COLORS.reset : "";

		let line = `${indent}${color}${event.level.toUpperCase()}${reset} ${event.prefix} → ${event.message}`;

		if (event.meta && Object.keys(event.meta).length) {
		line += ` ${JSON.stringify(event.meta)}`;
		}

		return line;
	}

	formatJSON(event) {
		return JSON.stringify(event);
	}

	log(event) {
		const output = this.pretty
			? this.formatPretty(event)
			: this.formatJSON(event);

		if (event.level === "error") console.error(output);
			else if (event.level === "warn") console.warn(output);
			else console.log(output);
	}

	line(text, options = {}) {
		const indent = " ".repeat((options.indent || 0) * 2);
		console.log(indent + text);
	}
}
