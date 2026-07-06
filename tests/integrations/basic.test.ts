import { describe, it, expect, beforeEach } from "vitest";

import { PyltraEngine } from "../../src/core/Engine.ts";
import { fixturePath, cleanDist, distExists, readDist } from "../helpers/fixture";
import type { CommandInput } from "../../src/interfaces/cli/CLIAdapter.ts";
import { Runtime } from "../../src/core/runtime/Runtime.ts";

const fixture = "basic";

describe("basic build", () => {
  beforeEach(async () => {
    await cleanDist(fixture);
  });

  it("builds index.html", async () => {
    const commandInput: CommandInput = {
      command: "build",
      args: {},
      options: {},
      flags: {
        env: "dev",
        silent: true,
        ci: true,
      },
      raw: ["build"],
    };

    const runtime = Runtime.fromCLI({
      command: commandInput.command,
      environment: commandInput.flags.env,
      debug: commandInput.flags.debug,
      verbose: commandInput.flags.verbose,
      silent: commandInput.flags.silent,
      watch: commandInput.flags.watch,
      ci: commandInput.flags.ci,
    });

    const engine = new PyltraEngine({
      runtime,
      cwd: fixturePath(fixture),
    });

    await engine.run(commandInput);

    expect(await distExists(fixture, "en/index.html")).toBe(true);

    const html = await readDist(fixture, "en/index.html");

    expect(html).toContain("Basic Site");
  });
});
