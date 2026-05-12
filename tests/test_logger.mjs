import { Logger, ConsoleTransport } from "../src/core/logger/index.mjs";

export const logger = new Logger({
//   prefix: "pyltra",
  transports: [
    new ConsoleTransport({ pretty: true })
  ]
});

logger.group("Build");

logger.info("Loading config");
logger.group("Pages");
logger.debug("Parsing home.md");
logger.debug("Parsing about.md");
logger.groupEnd("Pages");

logger.groupEnd("Build");


logger.line();

await logger.withGroup("Build2", async () => {
  await logger.withGroup("Load Config", async () => {
    logger.debug("Reading config.yaml");
  });

  await logger.withGroup("Render Pages", async () => {
    logger.debug("Rendering home");
    logger.debug("Rendering blog");
  });
});