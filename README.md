# ⎈ Kubetools Twitter Bot

Automatically discover the latest Kubernetes tools from **Hacker News** and **GitHub**, generate developer-friendly tweets with **Claude AI**, and post them to the [@Kubetools](https://twitter.com/kubetools) account on a configurable schedule.

---

## How it works

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐    ┌─────────────┐
│  HN Algolia │───▶│              │    │                │    │             │
│  GitHub API │───▶│  Fetch Tools │───▶│ Claude AI      │───▶│ Twitter v2  │
│             │    │  (deduplicate│    │ (generate tweet│    │ (post tweet)│
│             │    │   + filter)  │    │  per tool)     │    │             │
└─────────────┘    └──────────────┘    └────────────────┘    └─────────────┘
```

1. **Fetch** — Pulls latest k8s tool stories from HN (Algolia API) and recently updated repos from GitHub
2. **Filter** — Deduplicates against a local tracker to never tweet the same tool twice (30-day window)
3. **Generate** — Calls Claude to write a sharp, emoji-prefixed, hashtag-rich tweet per tool
4. **Post** — Posts to Twitter via API v2 with rate-limit-safe delays between posts

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Twitter Developer account with **Elevated access** (for v2 write permissions)
- Anthropic API key

### 2. Clone & install

```bash
git clone <your-repo>
cd kubetools-bot
npm install
```

### 3. Configure credentials

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Twitter API v2 — from https://developer.twitter.com/en/portal/dashboard
TWITTER_APP_KEY=...
TWITTER_APP_SECRET=...
TWITTER_ACCESS_TOKEN=...        # Your account's access token (not app-only)
TWITTER_ACCESS_SECRET=...

# Bot settings
SOURCES=both                    # "hn", "github", or "both"
TWEETS_PER_RUN=3                # How many tweets to post per run
CRON_SCHEDULE=0 */6 * * *      # Every 6 hours
DRY_RUN=false                   # Set to "true" to test without posting
```

### 4. Test it (dry run)

```bash
npm run dry
```

This will fetch tools, generate tweets, and log them — without posting anything.

### 5. Run for real

```bash
# One-time manual run
npm run once

# Start the scheduled bot (keeps running)
npm start
```

---

## Cron schedule examples

| Schedule | Meaning |
|---|---|
| `0 */6 * * *` | Every 6 hours |
| `0 9,17 * * *` | 9am and 5pm daily |
| `0 9 * * 1-5` | 9am on weekdays only |
| `0 */3 * * *` | Every 3 hours |
| `*/30 * * * *` | Every 30 minutes |

---

## Docker deployment

### Run with Docker Compose (recommended)

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

Data (tracker + logs) is persisted in `./data/`.

### Run with Docker directly

```bash
docker build -t kubetools-bot .
docker run -d \
  --name kubetools-bot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  kubetools-bot
```

---

## Deploy to a VPS / Cloud VM

```bash
# On your server (Ubuntu/Debian example)
sudo apt install nodejs npm git

git clone <your-repo> && cd kubetools-bot
npm install
cp .env.example .env
# Fill in .env with your credentials

# Run with PM2 for process management
npm install -g pm2
pm2 start index.js --name kubetools-bot
pm2 save
pm2 startup
```

---

## File structure

```
kubetools-bot/
├── index.js          # Entry point + cron scheduler
├── bot.js            # Core run logic (fetch → generate → post)
├── fetcher.js        # HN + GitHub API clients
├── generator.js      # Claude AI tweet generation
├── poster.js         # Twitter API v2 client
├── tracker.js        # Posted-ID deduplication store
├── logger.js         # Structured logging
├── run-once.js       # Manual one-shot runner
├── .env.example      # Environment variable template
├── Dockerfile
├── docker-compose.yml
└── .posted-ids.json  # Auto-created — tracks posted tool IDs
```

---

## Getting Twitter API credentials

1. Go to [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)
2. Create a new Project + App
3. Apply for **Elevated access** (required for v2 write)
4. Under **User authentication settings**, enable OAuth 1.0a with **Read and Write** permissions
5. Generate your **Access Token and Secret** (must match the @Kubetools account)
6. Copy all four keys into your `.env`

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `Missing Twitter credentials` | Check all 4 Twitter keys are in `.env` |
| `401 Unauthorized` | Regenerate Access Token after enabling write permissions |
| `No new tools found` | All recently fetched items were already posted — wait or clear `.posted-ids.json` |
| Tweet >280 chars | Claude auto-truncates; review with `npm run dry` first |
| Rate limit errors | Increase `delayMs` in `poster.js` (default: 2500ms) |
