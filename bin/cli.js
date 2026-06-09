#!/usr/bin/env node

import { CLIAdapter } from '../src/interfaces/cli/CLIAdapter.mjs';

/* -------------------- */
/* Setup                */
/* -------------------- */
// const cli = new CLI();
const adapter = new CommanderCLIAdapter({
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
                runtime,
                prefix: "pyltra",
                transports: [
                    new ConsoleTransport({
                        runtime,
                        level: "debug",
                        timestamp: true,
                        useColors: true,
                    })
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