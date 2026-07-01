/**
 * FileTransport
 * ----------------
 * Writes structured log events to a file in newline-delimited JSON format.
 * Supports automatic file rotation when size limit is reached.
 *
 * Features:
 * - Appends events to a JSON Lines file (.jsonl)
 * - Rotates log files when max size is exceeded
 * - Keeps a configurable number of rotated archives
 * - Optional pretty-printed JSON (larger file size, more readable)
 */

import { Transport } from "./Transport.ts";
import fs from "node:fs";
import path from "node:path";

export class FileTransport extends Transport {
  file: any;
  maxFileSize: any;
  maxFiles: any;
  pretty: any;
    /**
     * @param {Object} [options]
     * @param {string} [options.file] - Path to the log file. Default: "logs/pyltra.log.jsonl".
     * @param {boolean} [options.pretty] - Pretty-print JSON (more readable, larger files).
     * @param {number} [options.maxFileSize] - Rotate when file exceeds this size in bytes. Default: 5MB.
     * @param {number} [options.maxFiles] - Keep this many rotated log files. Default: 5.
     */
    constructor({
        file = "logs/pyltra.log.jsonl",
        pretty = false,
        maxFileSize = 1024 * 1024 * 5, // 5MB
        maxFiles = 5,
        ...transportOptions
    } = {}) {
        super(transportOptions);

        this.file = file;
        this.pretty = pretty;
        this.maxFileSize = maxFileSize;
        this.maxFiles = maxFiles;

        this.ensureDirectory();
    }

    /**
     * Write a log event to the file.
     * @param {Object} event
     */
    write(event?: any) {
        this.rotateIfNeeded();

        fs.appendFileSync(
            this.file,
            this.serialize(event) + "\n",
            "utf8"
        );
    }

    /**
     * Ensure the directory for the log file exists.
     */
    ensureDirectory() {
        fs.mkdirSync(path.dirname(this.file), {
            recursive: true,
        });
    }

    /**
     * Rotate log files if current file exceeds max size.
     * Renamed files: file.1, file.2, ..., file.maxFiles
     * Files beyond maxFiles are deleted.
     */
    rotateIfNeeded() {
        if (!fs.existsSync(this.file)) {
            return;
        }

        const { size } = fs.statSync(this.file);

        if (size < this.maxFileSize) {
            return;
        }

		// Remove overflow first
		const oldest = `${this.file}.${this.maxFiles}`;

		if (fs.existsSync(oldest)) {
			fs.rmSync(oldest);
		}

        // Shift existing rotated files: .5 → .6 (delete), .4 → .5, etc.
        for (let i = this.maxFiles - 1; i >= 1; i--) {
            const from = `${this.file}.${i}`;
            const to = `${this.file}.${i + 1}`;

            if (fs.existsSync(from)) {
                fs.renameSync(from, to);
            }
        }

        // Move current file to .1
        fs.renameSync(this.file, `${this.file}.1`);
    }

    /**
     * Serialize a log event to JSON.
     * Falls back gracefully if serialization fails.
     *
     * @param {Object} event
     * @returns {string}
     */
    serialize(event) {
        try {
            return this.pretty
                ? JSON.stringify(event, null, 2)
                : JSON.stringify(event);
        } catch {
            return JSON.stringify({
                time: new Date().toISOString(),
                level: "error",
                message: "Failed to serialize log event",
            });
        }
    }
}
