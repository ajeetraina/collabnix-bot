// logger.js — Structured run logging to file + console

const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "bot.log");
const MAX_LOG_LINES = 5000;

function timestamp() {
  return new Date().toISOString();
}

function write(level, message) {
  const line = `[${timestamp()}] [${level.padEnd(5)}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
    trimLog();
  } catch {}
}

function trimLog() {
  try {
    const content = fs.readFileSync(LOG_FILE, "utf8");
    const lines = content.split("\n");
    if (lines.length > MAX_LOG_LINES) {
      fs.writeFileSync(LOG_FILE, lines.slice(-MAX_LOG_LINES).join("\n"));
    }
  } catch {}
}

function logRun(summary) {
  const divider = "─".repeat(60);
  const lines = [
    divider,
    `RUN COMPLETE @ ${timestamp()}`,
    `  Fetched   : ${summary.fetched}`,
    `  New       : ${summary.newItems}`,
    `  Generated : ${summary.generated}`,
    `  Posted    : ${summary.posted}`,
    `  Failed    : ${summary.failed}`,
    `  Dry run   : ${summary.dryRun}`,
    divider,
  ];
  lines.forEach((l) => write("INFO", l));
}

module.exports = {
  info: (msg) => write("INFO", msg),
  warn: (msg) => write("WARN", msg),
  error: (msg) => write("ERROR", msg),
  logRun,
};
