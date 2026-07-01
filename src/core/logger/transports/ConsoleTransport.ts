
/**
 * ConsoleTransport
 * ----------------
 * Writes structured log events to the terminal with optional pretty formatting
 * and ANSI color support.
 */

import { Transport } from "./Transport.ts";
import type { TransportOptions } from "./Transport.ts";
import type { LogEvent } from "../types.ts";
import chalk from "chalk";

export interface ConsoleTransportOptions extends TransportOptions {
    useColors?: boolean;
    timestamp?: boolean;
}

export class ConsoleTransport extends Transport {
  timestamp: boolean;
  useColors: boolean;
    constructor(options: ConsoleTransportOptions = {}) {
        super(options);

        this.useColors = options.useColors ?? true;
        this.timestamp = options.timestamp ?? false;
    }

    write(event: LogEvent) {
        const line = this.format(event);

        process.stdout.write(line + "\n");
    }

    format(event: LogEvent) {
        const parts = [];

        // ---------------------------------------------------------------------
        // Timestamp
        // ---------------------------------------------------------------------

        if (this.timestamp) {
            parts.push(
                chalk.dim(`[${this.formatTime(event.time)}]`)
            );
        }

        // ---------------------------------------------------------------------
        // Level
        // ---------------------------------------------------------------------

        parts.push(this.formatLevel(event.level));

        // ---------------------------------------------------------------------
        // Prefix
        // ---------------------------------------------------------------------

        if (event.prefix) {
            parts.push(
                chalk.cyan(`[${event.prefix}]`)
            );
        }

		// ---------------------------------------------------------------------
		// Meta
		// ---------------------------------------------------------------------	

		if (event.meta && Object.keys(event.meta).length) {
			parts.push(` ${JSON.stringify(event.meta)}`);
			// Later we can add options for pretty-printing meta objects, 
			// but for now we'll just append a JSON string of the meta data if it exists.
			// In the future, we may want to implement a more sophisticated way of including 
			// meta data in the console output, such as pretty-printing objects or allowing 
			// certain meta fields to be highlighted or formatted differently. 
			// parts.push(this.formatMeta(event.meta))
		}

        // ---------------------------------------------------------------------
        // Message
        // ---------------------------------------------------------------------

        const indent = "  ".repeat(event.depth || 0);

        parts.push(indent + event.message);

        return parts.join(" ");
    }

    formatTime(value: string) {
        return new Date(value).toLocaleTimeString();
    }

    formatLevel(level: string) {
        switch (level) {
            case "debug":
                return chalk.gray("DEBUG");

            case "info":
                return chalk.blue("INFO ");

            case "success":
                return chalk.green("DONE ");

            case "warn":
                return chalk.yellow("WARN ");

            case "error":
                return chalk.red("ERROR");

            case "line":
                return chalk.dim("─────");

            default:
                return chalk.white(level.toUpperCase());
        }
    }
}
