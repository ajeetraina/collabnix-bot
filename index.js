#!/usr/bin/env node
// index.js — Kubetools Twitter Bot entry point
// Runs on a cron schedule defined by CRON_SCHEDULE env var

require("dotenv").config();

const cron = require("node-cron");
const { runBot } = require("./bot");
const logger = require("./logger");

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 */6 * * *";

// ─── Validate cron expression ────────────────────────────────
if (!cron.validate(CRON_SCHEDULE)) {
  logger.error(`Invalid CRON_SCHEDULE: "${CRON_SCHEDULE}"`);
  logger.error('Example valid schedules:');
  logger.error('  "0 */6 * * *"   → every 6 hours');
  logger.error('  "0 9,17 * * *"  → 9am and 5pm daily');
  logger.error('  "0 9 * * 1-5"   → 9am on weekdays');
  process.exit(1);
}

// ─── Validate required env vars ──────────────────────────────
const requiredEnvVars = ["ANTHROPIC_API_KEY"];
if (process.env.DRY_RUN !== "true") {
  requiredEnvVars.push(
    "TWITTER_APP_KEY",
    "TWITTER_APP_SECRET",
    "TWITTER_ACCESS_TOKEN",
    "TWITTER_ACCESS_SECRET"
  );
}

const missing = requiredEnvVars.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(", ")}`);
  logger.error("Copy .env.example to .env and fill in your credentials.");
  process.exit(1);
}

// ─── Banner ───────────────────────────────────────────────────
logger.info("╔═══════════════════════════════════════════╗");
logger.info("║   🐳  Kubetools Twitter Bot  ⎈            ║");
logger.info("╚═══════════════════════════════════════════╝");
logger.info(`Schedule  : ${CRON_SCHEDULE}`);
logger.info(`Sources   : ${process.env.SOURCES || "both"}`);
logger.info(`Per run   : ${process.env.TWEETS_PER_RUN || "3"} tweets`);
logger.info(`Dry run   : ${process.env.DRY_RUN === "true" ? "YES (no real posts)" : "NO (live posting)"}`);

// ─── Run immediately on start ─────────────────────────────────
logger.info("Running immediately on startup...");
runBot().catch((e) => logger.error(`Unhandled error: ${e.message}`));

// ─── Schedule recurring runs ──────────────────────────────────
logger.info(`Scheduling recurring runs: ${CRON_SCHEDULE}`);

cron.schedule(CRON_SCHEDULE, () => {
  logger.info("Cron triggered — starting run...");
  runBot().catch((e) => logger.error(`Unhandled error: ${e.message}`));
});

logger.info("Bot is running. Press Ctrl+C to stop.");

// ─── Graceful shutdown ────────────────────────────────────────
process.on("SIGINT", () => {
  logger.info("Received SIGINT — shutting down gracefully.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM — shutting down gracefully.");
  process.exit(0);
});
