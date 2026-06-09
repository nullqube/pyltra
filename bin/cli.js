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
adapter.run();