#!/usr/bin/env node
// run-once.js — Run the bot a single time (useful for testing)
// Usage: node run-once.js [--dry-run]

require("dotenv").config();

const args = process.argv.slice(2);
if (args.includes("--dry-run")) {
  process.env.DRY_RUN = "true";
}

const { runBot } = require("./bot");
const logger = require("./logger");

logger.info("▶ Manual single run" + (process.env.DRY_RUN === "true" ? " (DRY RUN)" : ""));

runBot()
  .then((summary) => {
    logger.info("✓ Run complete.");
    process.exit(0);
  })
  .catch((e) => {
    logger.error(`Fatal: ${e.message}`);
    process.exit(1);
  });
