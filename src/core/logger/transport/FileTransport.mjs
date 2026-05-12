import { Transport } from "./transport.mjs";
import fs from "fs";

export class FileTransport extends Transport {
	constructor(filePath) {
		super();
		this.filePath = filePath;
	}

	log(event) {
		const line = JSON.stringify(event) + "\n";
		fs.appendFileSync(this.filePath, line);
	}
}