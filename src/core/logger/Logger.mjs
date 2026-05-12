import { TransportManager } from "./TransportManager.mjs";


export class Logger {
	constructor(options = {}) {
		this.prefix = options.prefix || "pyltra";
		this.level = options.level || "debug";

		this.indentLevel = 0;

		this.transport = new TransportManager(options.transports || []);
	}

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

	group(label) {
		this.info(`▶ ${label}`);
		this.indentLevel++;
	}

	groupEnd(label) {
		this.indentLevel = Math.max(0, this.indentLevel - 1);
		this.info(`◀ ${label}`);
	}

	async withGroup(label, fn) {
		this.group(label);
		try {
			return await fn();
		} finally {
			this.groupEnd(label);
		}
	}

	line(char = "─", length = 23) {
		const text = char.repeat(length);

		this.transport.line(text, {
			indent: this.indentLevel,
		}); 
	}
}
