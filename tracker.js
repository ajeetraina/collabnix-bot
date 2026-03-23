// tracker.js — Tracks already-posted tool IDs to avoid duplicates

const fs = require("fs");
const path = require("path");

const STORE_FILE = path.join(__dirname, ".posted-ids.json");
const MAX_AGE_DAYS = 30; // Forget IDs older than this

/**
 * Load the posted IDs store
 * @returns {{ ids: { [id: string]: string } }} Map of id → ISO timestamp
 */
function load() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
    }
  } catch (e) {
    console.warn(`[Tracker] Could not load store: ${e.message}`);
  }
  return { ids: {} };
}

/**
 * Save the store back to disk
 */
function save(store) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error(`[Tracker] Could not save store: ${e.message}`);
  }
}

/**
 * Prune IDs older than MAX_AGE_DAYS
 */
function prune(store) {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  for (const [id, ts] of Object.entries(store.ids)) {
    if (new Date(ts).getTime() < cutoff) {
      delete store.ids[id];
    }
  }
  return store;
}

/**
 * Check if an item has already been posted
 */
function isPosted(id) {
  const store = load();
  return Boolean(store.ids[id]);
}

/**
 * Mark an item as posted
 */
function markPosted(id) {
  let store = load();
  store = prune(store);
  store.ids[id] = new Date().toISOString();
  save(store);
}

/**
 * Filter out already-posted items from a list
 */
function filterNew(items) {
  const store = prune(load());
  return items.filter((item) => !store.ids[item.id]);
}

/**
 * Get count of tracked IDs
 */
function count() {
  const store = load();
  return Object.keys(store.ids).length;
}

module.exports = { isPosted, markPosted, filterNew, count };
