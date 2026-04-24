#!/usr/bin/env node

import { CLI } from '../src/interfaces/cli/CLI.mjs';

/* -------------------- */
/* Setup                */
/* -------------------- */
const cli = new CLI();

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
cli.run(process.argv);