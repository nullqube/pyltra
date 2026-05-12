export class TransportManager {
	constructor(transports = []) {
		this.transports = transports;
	}

	add(transport) {
		this.transports.push(transport);
	}

	log(event) {
		for (const t of this.transports) {
			t.log(event);
		}
	}

	line(text, options = {}) {
		for (const transport of this.transports) {
			if (typeof transport.line === "function") {
				transport.line(text, options);
			}
		}
	}

	close() {
		for (const t of this.transports) {
			t.close?.();
		}
	}
}