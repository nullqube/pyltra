
import { Runtime } from "../src/core/runtime/Runtime.mjs";

import { Logger } from "../src/core/logger/Logger.mjs";
import { ConsoleTransport } from "../src/core/logger/transports/ConsoleTransport.mjs";
import { FileTransport } from "../src/core/logger/transports/FileTransport.mjs";

import { Reporter } from "../src/core/reporter/Reporter.mjs";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const runtime = Runtime.fromCLI({
    environment: "development",
    command: "logger-reporter-demo",
    debug: true,
    verbose: true,
    silent: false,
    watch: false,
    ci: false,
    version: "0.0.0-demo",
});

const logger = new Logger({
    runtime,
    prefix: "pyltra",
    transports: [
        new ConsoleTransport({
            runtime,
            level: "debug",
            timestamp: true,
            useColors: true,
        }),

        new FileTransport({
            runtime,
            file: "logs/demo.log.jsonl",
            pretty: false,
            maxFileSize: 1024 * 1024,
            maxFiles: 3,
        }),
    ],
});

runtime.setLogger(logger);

const reporter = new Reporter({ runtime });

runtime.setReporter(reporter);

logger.line();
logger.info("Logger demo started", {
    command: runtime.command,
    environment: runtime.environment,
});

logger.debug("Debug message visible in development/debug mode", {
    verbose: runtime.verbose,
});

logger.info("Normal info message");

logger.success("Success message");

logger.warn("Warning message", {
    reason: "This is only a demo warning",
});

logger.error("Error message example", {
    code: "DEMO_ERROR",
});

logger.line();

await logger.withGroup("Grouped logging", async ({ groupId }) => {
    logger.info("Loading config", { groupId });
    await sleep(300);

    logger.info("Resolving project paths", { groupId });
    await sleep(300);

    logger.success("Grouped logging complete", { groupId });
});

// logger.line();

// await reporter.withTask("Loading project", async task => {
//     await sleep(400);

//     task.update("Reading config file");
//     await sleep(400);

//     task.update("Building project paths");
//     await sleep(400);
// });

// const buildTask = reporter.task("Building pages").start();

// await sleep(400);
// buildTask.setProgress(25).update("Building home page");

// await sleep(400);
// buildTask.setProgress(50).update("Building about page");

// await sleep(400);
// buildTask.setProgress(75).update("Building blog pages");

// await sleep(400);
// buildTask.setProgress(100).succeed("Pages built");

// const assetTask = reporter.task("Copying assets").start();

// await sleep(400);
// assetTask.warn("Assets copied with minor warning");

// const failTask = reporter.task("Optimizing images").start();

// await sleep(400);
// failTask.fail("Image optimization failed in demo");

// logger.line();
// logger.info("Reporter demo finished");

// logger.info("Runtime snapshot", runtime.toJSON());

// logger.line();