export class ReporterTask {
  endTime: any;
  message: any;
  progress: any;
  reporter: any;
  startTime: any;
  status: string;
    constructor(reporter, message) {
        this.reporter = reporter;

        this.message = message;

        this.status = "idle";

        this.progress = 0;

        this.startTime = null;
        this.endTime = null;
    }

    start(message = this.message) {
        this.status = "running";

        this.message = message;

        this.startTime = Date.now();

        this.reporter.render();

        return this;
    }

    update(message) {
        this.message = message;

        this.reporter.render();

        return this;
    }

    setProgress(value) {
        this.progress = value;

        this.reporter.render();

        return this;
    }

    succeed(message = this.message) {
        this.status = "success";

        this.message = message;

        this.endTime = Date.now();

        this.reporter.render();

        return this;
    }

    fail(message = this.message) {
        this.status = "error";

        this.message = message;

        this.endTime = Date.now();

        this.reporter.render();

        return this;
    }

    warn(message = this.message) {
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