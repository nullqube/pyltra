/**
 * TransportManager
 * ----------------
 * Aggregates multiple transports and forwards log events and line output
 * commands to each configured transport.
 */

export class TransportManager {
    constructor({
        runtime,
        transports = [],
    } = {}) {
        this.runtime = runtime;

        this.transports = [];

        for (const transport of transports) {
            this.add(transport);
        }
    }

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    add(transport) {
        if (!transport) {
            return;
        }

        this.transports.push(transport);

        return transport;
    }

    remove(transport) {
        this.transports = this.transports.filter(
            t => t !== transport
        );
    }

    clear() {
        this.transports = [];
    }

    // -------------------------------------------------------------------------
    // Event Dispatch
    // -------------------------------------------------------------------------

    emit(event) {
        for (const transport of this.transports) {
            try {
                transport.emit(event);

            } catch (error) {
                this.handleTransportError(error, transport, event);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Error Isolation
    // -------------------------------------------------------------------------

    handleTransportError(error, transport, event) {
        // Never allow logging failures
        // to crash runtime execution.

        try {
            console.error(
                `[TransportError:${transport.constructor.name}]`,
                error
            );

        } catch {
            // Final safeguard.
        }
    }
}