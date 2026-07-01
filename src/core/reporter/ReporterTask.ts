import type { Reporter } from "./Reporter.ts";

export class ReporterTask {
  endTime: number | null;
  message: string;
  progress: number;
  reporter: Reporter;
  startTime: number | null;
  status: string;
    constructor(reporter: Reporter, message: string) {
        this.reporter = reporter;

        this.message = message;

        this.status = "idle";

        this.progress = 0;

        this.startTime = null;
        this.endTime = null;
    }

    start(message: string = this.message) {
        this.status = "running";

        this.message = message;

        this.startTime = Date.now();

        this.reporter.render();

        return this;
    }

    update(message: string) {
        this.message = message;

        this.reporter.render();

        return this;
    }

    setProgress(value: number) {
        this.progress = value;

        this.reporter.render();

        return this;
    }

    succeed(message: string = this.message) {
        this.status = "success";

        this.message = message;

        this.endTime = Date.now();

        this.reporter.render();

        return this;
    }

    fail(message: string = this.message) {
        this.status = "error";

        this.message = message;

        this.endTime = Date.now();

        this.reporter.render();

        return this;
    }

    warn(message: string = this.message) {
        this.status = "warn";

        this.message = message;

        this.endTime = Date.now();

        this.reporter.render();

        return this;
    }

    stop() {
        this.status = "stopped";

        this.endTime = Date.now();

        this.reporter.render();

        return this;
    }

    get duration() {
        if (!this.startTime) {
            return 0;
        }

        return (this.endTime || Date.now()) - this.startTime;
    }
}