import readline from "node:readline";

export class TerminalRenderer {
    clear() {
        readline.cursorTo(process.stdout, 0, 0);

        readline.clearScreenDown(process.stdout);
    }

    write(line = "") {
        process.stdout.write(line + "\n");
    }

    rewrite(lines = []) {
        this.clear();

        for (const line of lines) {
            this.write(line);
        }
    }
}