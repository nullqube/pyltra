#!/usr/bin/env node

import { createRequire } from "node:module";

import { CLIAdapter } from "../src/interfaces/cli/CLIAdapter.mjs";
import { PyltraEngine } from "../src/core/Engine.mjs";
import { Runtime } from "../src/core/runtime/Runtime.mjs";
import { Logger } from "../src/core/logger/Logger.mjs";
import { ConsoleTransport } from "../src/core/logger/transports/ConsoleTransport.mjs";

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

    await engine.run(commandInput);
});
/* -------------------- */
