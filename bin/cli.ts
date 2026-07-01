#!/usr/bin/env node

import { createRequire } from "node:module";

import { CLIAdapter } from "../src/interfaces/cli/CLIAdapter.ts";
import { PyltraEngine } from "../src/core/Engine.ts";
import { Runtime } from "../src/core/runtime/Runtime.ts";
import { Logger } from "../src/core/logger/Logger.ts";
import { ConsoleTransport } from "../src/core/logger/transports/ConsoleTransport.ts";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

/* -------------------- */
/* Setup                */
/* -------------------- */
// const cli = new CLI();
const adapter = new CLIAdapter({
    name: "pyltra",
    version: pkg.version,
});
/* -------------------- */
/* Graceful shutdown    */
/* -------------------- */
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});
/* -------------------- */

/* -------------------- */
/* Run the CLI           */
/* -------------------- */
// cli.run(process.argv);
await adapter.run(async (commandInput) => {
    const logger = new Logger({
        debug: commandInput.flags.debug,
        verbose: commandInput.flags.verbose,
        silent: commandInput.flags.silent,
        environment: commandInput.flags.env,
        prefix: "pyltra",
        transports: [
            new ConsoleTransport({
                level: "debug",
                timestamp: true,
                useColors: true,
            }),
        ],
    });
    const runtime = Runtime.fromCLI({
        command: commandInput.command,
        environment: commandInput.flags.env,
        debug: commandInput.flags.debug,
        verbose: commandInput.flags.verbose,
        silent: commandInput.flags.silent,
        watch: commandInput.flags.watch,
        ci: commandInput.flags.ci,
        version: pkg.version,
        logger,
    });

    const engine = new PyltraEngine({
        runtime,
        cwd: process.cwd(),
    });

    try {
        await engine.run(commandInput);
    } catch (err) {
        logger.error(err.message);
        if (commandInput.flags.debug) console.error(err);
        process.exit(1);
    }
});
/* -------------------- */
