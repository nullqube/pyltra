export function handleError(error, options = {}) {
  const debug = options.debug || process.env.DEBUG;

  if (debug) {
    console.error(error);
  } else {
    console.error(`❌ ${error.message}`);
  }

  process.exit(1);
}