/**
 * Transport
 * ---------
 * Base contract for logger transports. Concrete transport classes should
 * implement log() and may override close() if they need cleanup logic.
 */

export class Transport {
	/**
	 * Emit a log event.
	 * @param {Object} event
	 */
	log(event) {
		throw new Error("Transport.log() must be implemented");
	}

	/**
	 * Optional transport cleanup.
	 */
	close() {
		// optional override
	}
}