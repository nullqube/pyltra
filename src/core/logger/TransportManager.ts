/**
 * TransportManager
 * ----------------
 * Aggregates multiple transports and forwards log events and line output
 * commands to each configured transport.
 */

import type { Transport } from "./transports/Transport.ts";
import type { LogEvent } from "./types.ts";

export class TransportManager {
  transports: Transport[];
    constructor({
        transports = [],
    }: { transports?: Transport[] } = {}) {
        this.transports = [];

        for (const transport of transports) {
            this.add(transport);
        }
    }

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    add(transport: Transport) {
        if (!transport) {
            return;
        }

        this.transports.push(transport);

        return transport;
    }

    remove(transport: Transport) {
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

    emit(event: LogEvent) {
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

    handleTransportError(error: unknown, transport: Transport, event: LogEvent) {
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