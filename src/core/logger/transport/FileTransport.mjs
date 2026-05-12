/**
 * FileTransport
 * -------------
 * Appends structured log events to a file in newline-delimited JSON format.
 */

import { Transport } from "./transport.mjs";
import fs from "fs";

export class FileTransport extends Transport {
	/**
	 * @param {string} filePath
	 */
	constructor(filePath) {
		super();
		this.filePath = filePath;
	}

	/**
	 * Append a log event to the configured file.
	 * @param {Object} event
	 */
	log(event) {
		const line = JSON.stringify(event) + "\n";
		fs.appendFileSync(this.filePath, line);
	}
}