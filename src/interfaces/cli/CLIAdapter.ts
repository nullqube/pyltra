import { Command } from "commander";
import prompts from 'prompts';

/** Runtime/execution flags shared across commands. */
export interface CommandFlags {
    env?: string;
    debug?: boolean;
    verbose?: boolean;
    silent?: boolean;
    ci?: boolean;
    watch?: boolean;
}

/** Transport-agnostic command input consumed by the Engine. */
export interface CommandInput {
    command: string;
    args: Record<string, unknown>;
    options: Record<string, unknown>;
    flags: CommandFlags;
    raw: string[];
}

export type CommandHandler = (input: CommandInput) => Promise<void> | void;

type InitQuestion = {
    type: string;
    name: string;
    message: string;
    choices?: Array<{ title: string; value: string }>;
    initial?: number;
    validate?: (value: string) => true | string;
};

// Only parse and normalize the cli input here, the actual command handling logic should be implemented in the engine
// 1. Parse the command and options using commander
// 2. Normalize the input into a consistent format
// 3. Pass the normalized input to the engine for handling
export class CLIAdapter {
  name: string;
  program: Command;
  version: string;
    constructor({ name = "pyltra", version = "0.0.0" }: { name?: string; version?: string } = {}) {
        this.name = name;
        this.version = version;
        this.program = new Command();
    }

    async run(handler: CommandHandler) {
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
        this.registerServe(handler);
        this.registerInit(handler);
        this.registerAdd(handler);

        await this.program.parseAsync(process.argv);
    }

    registerBuild(handler: CommandHandler) {
        this.program
            .command("build")
            .description("Build the project")
            // Build options
            .option("--drafts", "Include draft content", false)
            .option("--minify", "Minify output", true)
            .option("--clean", "Clean output directory before build", true)
            .option("--language <lang>", "Build only one language")
            .option("--page <page>", "Build a specific page")
            .option("--collection <collection>", "Build a specific collection")
            .option("--item <slug>", "Build a specific collection item")
            .option("--watch", "Watch files", false)
            .option("--report-size","Show the report size of the output.", false)
            // commander types the option default as string; the numeric default is preserved at runtime.
            .option("--report-depth <depth>","The report size depth.", 1 as unknown as string)
            .action(async (options: Record<string, unknown>, command: Command) => {
                const { reportSize, reportDepth, ...restOptions } = options;
                await handler(this.normalize(command, {
                    command: "build",
                    args: {},
                    options: { 
                        ...restOptions,
                        report: {
                            size: reportSize,
                            // reportDepth comes from dynamic CLI options; it is a string/number.
                            depth: Number.parseInt(reportDepth as string, 10) || undefined
                        }
                    }
                }));
            });
    }

    registerServe(handler: CommandHandler) {
        this.program
            .command("serve")
            .description("Start development server")
            .option("--host <host>", "Dev server host", "localhost")
            .option("--port <port>", "Dev server port", parseInteger, 3000)
            .option("--watch", "Watch files", true)
            .action(async (options: Record<string, unknown>, command: Command) => {
                await handler(this.normalize(command, {
                    command: "serve",
                    args: { host: options.host, port: options.port },
                    options: { watch: options.watch }
                }));
            });
    }

    registerInit(handler: CommandHandler) {
        this.program
            .command("init [name]")
            .option('-t, --template <template>', 'Template to use', 'basic')
            .description("Initialize a new Pyltra project")
            .action(async (name: string | undefined, options: Record<string, unknown>, command: Command) => {
                const _name = name ?? options.name ?? null;
                const _template = options.template ?? null;
                const questions: InitQuestion[] = [];
                if (!_name) {
                    questions.push({
                        type: 'text',
                        name: 'name',
                        message: 'Enter the project name:',
                        validate: (v: string) => v.trim().length ? true : 'Project name is required'
                    });
                }
                if(!_template) {
                    questions.push({
                        type: "select",
                        name: "template",
                        message: "Template:",
                        choices: [
                            {
                                title: "empty",
                                value: "empty"
                            },
                            {
                                title: "basic",
                                value: "basic"
                            },
                            // {
                            //     title: "docs",
                            //     value: "docs"
                            // },
                            // {
                            //     title: "portfolio",
                            //     value: "portfolio"
                            // }
                        ],
                        initial: 0
                    }); 
                }
                const responses = await prompts(questions, {
                    onCancel: () => {
                        console.log('\nProject initialization cancelled.');
                        process.exit(0);
                    }
                });
                
                await handler(this.normalize(command, {
                    command: "init",
                    args: {
                        name: _name ?? responses.name,
                        template: _template ?? responses.template
                    },
                    options,
                }));
            });
    }

    registerAdd(handler: CommandHandler) {
        this.program
            .command("add <type> <name>")
            .description("Add project resource")
            .action(async (type: string, name: string, options: Record<string, unknown>, command: Command) => {
                await handler(this.normalize(command, {
                    command: "add",
                    args: { type, name },
                    options,
                }));
            });
    }

    /**
     * Normalize Commander.js input into Pyltra's internal command format.
     *
     * This method converts raw CLI input into a transport-agnostic structure
     * used by the Engine. The resulting object can later come from other
     * adapters such as REST, TUI, Web UI, or AI agents, not only the CLI.
     *
     * Result shape:
     *
     * {
     *     command,
     *     args,
     *     options,
     *     flags,
     *     raw
     * }
     *
     * Definitions:
     *
     * - command
     *   The operation to execute.
     *   Examples: "init", "build", "serve", "add".
     *
     * - args
     *   Primary inputs (subjects) of the command.
     *   They answer "What is this command acting on?".
     *   Without them, the command either cannot work or falls back to a default.
     *
     *   Examples:
     *
     *   pyltra init my-site
     *   args: { name: "my-site" }
     *
     *   pyltra add page about
     *   args: { type: "page", name: "about" }
     *
     * - options
     *   Command-specific behavior and features.
     *   They answer "How should this command perform its task?".
     *   They are part of the command's domain and meaning.
     *
     *   Examples:
     *
     *   pyltra init my-site --template blog
     *   options: { template: "blog" }
     *
     *   pyltra build --drafts --minify
     *   options: { drafts: true, minify: true }
     *
     * - flags
     *   Runtime and execution behavior.
     *   They are not part of the command itself but affect how it runs.
     *   These flags are usually shared between commands.
     *
     *   Examples:
     *
     *   pyltra build --watch --verbose
     *   flags: { watch: true, verbose: true }
     *
     * - raw
     *   Original command-line arguments for debugging and diagnostics.
     *
     * Example:
     *
     * pyltra init my-site --template blog --verbose
     *
     * becomes:
     *
     * {
     *     command: "init",
     *     args: { name: "my-site" },
     *     options: { template: "blog" },
     *     flags: { verbose: true, ... },
     *     raw: process.argv.slice(2)
     * }
     *
     * @param {Command} commanderCommand Commander.js command instance.
     * @param {Object} input Normalized command parts supplied by the adapter.
     * @returns {Object} Internal command input consumed by the Engine.
     */
    normalize(commanderCommand: Command, input: { command: string; args?: Record<string, unknown>; options?: Record<string, unknown> }): CommandInput {
        const globalOpts = this.program.opts();
        const res: CommandInput = {
            command: input.command,
            args: { ...input.args },        // required domain inputs
            options: input.options ?? {},   // command features (optional)
            flags: {
                ...globalOpts,
            },
            raw: process.argv.slice(2),
        };
        console.log(res)
        return res;
    }
}

function parseInteger(value: string) {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
        throw new Error(`Invalid number: ${value}`);
    }

    return parsed;
}
