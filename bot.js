// bot.js — Core bot run logic (single execution)

require("dotenv").config();

const { fetchTools } = require("./fetcher");
const { generateTweets } = require("./generator");
const { postTweets } = require("./poster");
const { filterNew, markPosted } = require("./tracker");
const logger = require("./logger");

const SOURCES = process.env.SOURCES || "both";
const TWEETS_PER_RUN = parseInt(process.env.TWEETS_PER_RUN || "3", 10);
const DRY_RUN = process.env.DRY_RUN === "true";

/**
 * Run one full cycle: fetch → filter → generate → post
 */
async function runBot() {
  logger.info(`━━━ Kubetools Bot — Starting run (sources=${SOURCES}, n=${TWEETS_PER_RUN}, dry=${DRY_RUN})`);

  const summary = {
    fetched: 0,
    newItems: 0,
    generated: 0,
    posted: 0,
    failed: 0,
    dryRun: DRY_RUN,
  };

  // 1. Fetch tools
  logger.info("Step 1: Fetching tools...");
  let tools;
  try {
    tools = await fetchTools(SOURCES, 30);
    summary.fetched = tools.length;
    logger.info(`  Fetched ${tools.length} tools total`);
  } catch (e) {
    logger.error(`  Fatal: Could not fetch tools — ${e.message}`);
    return summary;
  }

  // 2. Filter already-posted
  logger.info("Step 2: Filtering already-posted items...");
  const newTools = filterNew(tools).slice(0, TWEETS_PER_RUN);
  summary.newItems = newTools.length;
  logger.info(`  ${newTools.length} new items to process`);

  if (newTools.length === 0) {
    logger.warn("  No new tools found — consider expanding sources or lowering star threshold");
    logger.logRun(summary);
    return summary;
  }

  // 3. Generate tweets via Claude
  logger.info("Step 3: Generating tweets with Claude...");
  const withTweets = await generateTweets(newTools, 1500);
  summary.generated = withTweets.filter((i) => i.tweet).length;

  // 4. Post to Twitter
  logger.info("Step 4: Posting to Twitter...");
  const posted = await postTweets(
    withTweets.filter((i) => i.tweet),
    2500,
    DRY_RUN
  );

  for (const item of posted) {
    if (item.posted) {
      markPosted(item.id);
      summary.posted++;
    } else {
      summary.failed++;
    }
  }

  logger.logRun(summary);
  return summary;
}

module.exports = { runBot };
