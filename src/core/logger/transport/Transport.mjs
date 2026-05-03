export class Transport {
  log(event) {
    throw new Error("Transport.log() must be implemented");
  }

  close() {
    // optional override
  }
}