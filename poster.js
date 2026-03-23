// poster.js — Posts tweets via Twitter API v2

const { TwitterApi } = require("twitter-api-v2");

let _client = null;

function getClient() {
  if (_client) return _client;

  const required = [
    "TWITTER_APP_KEY",
    "TWITTER_APP_SECRET",
    "TWITTER_ACCESS_TOKEN",
    "TWITTER_ACCESS_SECRET",
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing Twitter credentials: ${missing.join(", ")}`);
  }

  _client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  return _client;
}

/**
 * Post a single tweet
 * @param {string} text - Tweet content
 * @param {boolean} dryRun - If true, log but don't post
 * @returns {{ id: string, text: string } | null}
 */
async function postTweet(text, dryRun = false) {
  if (dryRun) {
    console.log(`  [Poster] DRY RUN — would post:\n  "${text}"\n`);
    return { id: `dry-run-${Date.now()}`, text };
  }

  const client = getClient();
  const rwClient = client.readWrite;
  const result = await rwClient.v2.tweet(text);
  return result.data;
}

/**
 * Post multiple tweets with a delay between each
 * @param {Array} items - items with .tweet property
 * @param {number} delayMs - delay between posts (ms) — Twitter recommends >1s
 * @param {boolean} dryRun
 * @returns {Array} results
 */
async function postTweets(items, delayMs = 2000, dryRun = false) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.tweet) {
      console.log(`  [Poster] Skipping ${item.id} — no tweet text`);
      continue;
    }

    console.log(`  [Poster] ${i + 1}/${items.length} → Posting...`);

    try {
      const result = await postTweet(item.tweet, dryRun);
      results.push({ ...item, tweetId: result?.id, posted: true });
      console.log(`  [Poster] ✓ Tweet ID: ${result?.id}`);
    } catch (e) {
      console.error(`  [Poster] ✗ Failed: ${e.message}`);
      results.push({ ...item, posted: false, postError: e.message });
    }

    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}

module.exports = { postTweet, postTweets };
