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

  close() {
    for (const t of this.transports) {
      t.close?.();
    }
  }
}