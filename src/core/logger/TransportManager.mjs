/**
 * TransportManager
 * ----------------
 * Aggregates multiple transports and forwards log events and line output
 * commands to each configured transport.
 */

export class TransportManager {
	/**
	 * @param {Array} [transports]
	 */
	constructor(transports = []) {
		this.transports = transports;
	}

	/**
	 * Add a transport instance to the manager.
	 * @param {Object} transport
	 */
	add(transport) {
		this.transports.push(transport);
	}

	/**
	 * Dispatch a structured log event to every transport.
	 * @param {Object} event
	 */
	log(event) {
		for (const t of this.transports) {
			t.log(event);
		}
	}

	/**
	 * Forward a line command to transports that support it.
	 * @param {string} text
	 * @param {Object} [options]
	 */
	line(text, options = {}) {
		for (const transport of this.transports) {
			if (typeof transport.line === "function") {
				transport.line(text, options);
			}
		}
	}

	/**
	 * Close any transports that expose a close hook.
	 */
	close() {
		for (const t of this.transports) {
			t.close?.();
		}
	}
}