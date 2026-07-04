import ora from "ora";
import chalk from "chalk";

import { RuntimeAware } from "../runtime/RuntimeAware.ts";
import type { Runtime } from "../runtime/Runtime.ts";

import { ReporterTask } from "./ReporterTask.ts";
import { TerminalRenderer } from "./TerminalRenderer.ts";

export class Reporter extends RuntimeAware {
  renderer: TerminalRenderer;
  tasks: ReporterTask[];
    constructor({ runtime }: { runtime?: Runtime } = {}) {
        super({ runtime });

        this.renderer = new TerminalRenderer();

        this.tasks = [];
    }

    task(message: string) {
        const task = new ReporterTask(this, message);

        this.tasks.push(task);

        return task;
    }

    render() {
        // ---------------------------------------------------------------------
        // Simple v1 implementation
        // ---------------------------------------------------------------------

        // Future:
        // centralized terminal ownership.

        this.renderer.rewrite(
            this.tasks.map(task => {
                return this.formatTask(task);
            })
        );
    }

    formatTask(task: ReporterTask) {
        switch (task.status) {
            case "running":
                return chalk.blue("◌") + " " + task.message;

            case "success":
                return chalk.green("✔") + " " + task.message;

            case "error":
                return chalk.red("✖") + " " + task.message;

            case "warn":
                return chalk.yellow("▲") + " " + task.message;

            case "stopped":
                return chalk.gray("■") + " " + task.message;

            default:
                return chalk.gray("•") + " " + task.message;
        }
    }

    async withTask<T>(message: string, fn: (task: ReporterTask) => Promise<T> | T) {
        const task = this.task(message);

        task.start();

        try {
            const result = await fn(task);

            task.succeed();

            return result;

        } catch (error) {
            task.fail(error instanceof Error ? error.message : String(error));

            throw error;
        }
    }
}
