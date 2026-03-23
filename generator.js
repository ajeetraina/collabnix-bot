// generator.js — Generates Kubernetes tweets using OpenAI

const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the Kubetools Twitter account — the go-to source for Kubernetes practitioners discovering new tools.
Your tweets are sharp, technical, and developer-friendly. Never corporate, never fluffy.`;

async function generateTweet(item) {
  const scoreContext =
    item.source === "HackerNews"
      ? `HN Points: ${item.score}`
      : `GitHub Stars: ${item.score?.toLocaleString()}`;

  const prompt = `Write a single tweet (max 260 chars, leaving room for URL) announcing this Kubernetes tool to the community.

Tool: ${item.title}
Source: ${item.source}
${scoreContext}
URL: ${item.url}
${item.description ? `Description: ${item.description}` : ""}

Rules:
- Start with a relevant emoji (🔧 🚀 ⎈ 🛠️ 📦 🔍 🔐 🌐 ⚡ etc.)
- Be punchy and direct — lead with the value prop
- Include 2-3 of these hashtags: #Kubernetes #K8s #DevOps #CNCF #CloudNative #GitOps #Helm #OpenSource
- End with the full URL on its own line
- NO quotes, NO preamble, NO explanation — output ONLY the tweet text`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 300,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();

  if (!text) throw new Error("Empty response from OpenAI");
  if (text.length > 280) {
    console.warn(`  [Generator] Tweet too long (${text.length} chars), truncating`);
    return text.substring(0, 277) + "...";
  }

  return text;
}

async function generateTweets(items, delayMs = 1500) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`  [Generator] ${i + 1}/${items.length} → ${item.title}`);

    try {
      const tweet = await generateTweet(item);
      results.push({ ...item, tweet });
      console.log(`  [Generator] ✓ ${tweet.length} chars`);
    } catch (e) {
      console.error(`  [Generator] ✗ Failed: ${e.message}`);
      results.push({ ...item, tweet: null, error: e.message });
    }

    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}

module.exports = { generateTweet, generateTweets };
