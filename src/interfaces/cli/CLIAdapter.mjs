import { Command } from "commander";

// Only parse and normalize the cli input here, the actual command handling logic should be implemented in the engine
// 1. Parse the command and options using commander
// 2. Normalize the input into a consistent format
// 3. Pass the normalized input to the engine for handling
export class CLIAdapter {
    constructor({ name = "pyltra", version = "0.0.0" } = {}) {
        this.name = name;
        this.version = version;
        this.program = new Command();
    }

    async run(handler) {
        this.program
            .name(this.name)
            .version(this.version)
            .description("Pyltra static site runtime")
            .option("--env <environment>", "Runtime environment", "development")
            .option("--debug", "Enable debug mode", false)
            .option("--verbose", "Enable verbose logging", false)
            .option("--silent", "Silence output", false)
            .option("--ci", "Run in CI mode", false);

        this.registerBuild(handler);
        this.registerDev(handler);
        this.registerInit(handler);
        this.registerAdd(handler);

        await this.program.parseAsync(process.argv);
    }

    registerBuild(handler) {
        this.program
            .command("build")
            .description("Build the project")
            .option("--watch", "Watch files", false)
            .action(async (options, command) => {
                await handler(this.normalize(command, {
                    command: "build",
                    args: [],
                    flags: options,
                }));
            });
    }

    registerDev(handler) {
        this.program
            .command("dev")
            .description("Start development server")
            .option("--host <host>", "Dev server host", "localhost")
            .option("--port <port>", "Dev server port", parseInteger, 3000)
            .option("--watch", "Watch files", true)
            .action(async (options, command) => {
                await handler(this.normalize(command, {
                    command: "dev",
                    args: [],
                    flags: options,
                }));
            });
    }

    registerInit(handler) {
        this.program
            .command("init [name]")
            .description("Initialize a new Pyltra project")
            .action(async (name, options, command) => {
                await handler(this.normalize(command, {
                    command: "init",
                    args: name ? [name] : [],
                    flags: options,
                }));
            });
    }

    registerAdd(handler) {
        this.program
            .command("add <type> <name>")
            .description("Add project resource")
            .action(async (type, name, options, command) => {
                await handler(this.normalize(command, {
                    command: "add",
                    args: [type, name],
                    flags: options,
                }));
            });
    }

    normalize(commanderCommand, input) {
        return {
            command: input.command,
            args: input.args,
            flags: {
                ...commanderCommand.optsWithGlobals(),
                ...input.flags,
            },
            raw: process.argv.slice(2),
        };
    }
}

function parseInteger(value) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        throw new Error(`Invalid number: ${value}`);
    }

    return parsed;
}