import readline from "node:readline";

export class TerminalRenderer {
    clear() {
        readline.cursorTo(process.stdout, 0, 0);

        readline.clearScreenDown(process.stdout);
    }

    write(line: string = "") {
        process.stdout.write(line + "\n");
    }

    rewrite(lines: string[] = []) {
        this.clear();

        for (const line of lines) {
            this.write(line);
        }
    }
}