// fetcher.js — Pulls latest Kubernetes tools from HN and GitHub

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "kubetools-bot/1.0",
};

/**
 * Fetch Kubernetes tool stories from Hacker News (Algolia API)
 */
async function fetchHackerNews(limit = 15) {
  const url =
    "https://hn.algolia.com/api/v1/search?" +
    new URLSearchParams({
      query: "kubernetes tool",
      tags: "story",
      hitsPerPage: String(limit * 2),
    });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN API error: ${res.status}`);
  const data = await res.json();

  return (data.hits || [])
    .filter((h) => h.url && h.title && h.title.length > 10)
    .slice(0, limit)
    .map((h) => ({
      id: `hn-${h.objectID}`,
      title: h.title,
      url: h.url,
      source: "HackerNews",
      description: "",
      score: h.points || 0,
      fetchedAt: new Date().toISOString(),
    }));
}

/**
 * Fetch recently updated Kubernetes tool repos from GitHub
 */
async function fetchGitHub(limit = 15) {
  const url =
    "https://api.github.com/search/repositories?" +
    new URLSearchParams({
      q: "kubernetes tool stars:>100",
      sort: "updated",
      per_page: String(limit),
    });

  const res = await fetch(url, { headers: GITHUB_HEADERS });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();

  return (data.items || []).slice(0, limit).map((r) => ({
    id: `gh-${r.id}`,
    title: r.full_name,
    url: r.html_url,
    source: "GitHub",
    description: r.description || "",
    score: r.stargazers_count || 0,
    fetchedAt: new Date().toISOString(),
  }));
}

/**
 * Fetch tools from configured sources, deduplicated and shuffled
 */
async function fetchTools(sources = "both", limit = 20) {
  const results = [];
  const errors = [];

  if (sources === "hn" || sources === "both") {
    try {
      const items = await fetchHackerNews(limit);
      results.push(...items);
      console.log(`  [HN] Fetched ${items.length} items`);
    } catch (e) {
      errors.push(`HN: ${e.message}`);
      console.error(`  [HN] Error: ${e.message}`);
    }
  }

  if (sources === "github" || sources === "both") {
    try {
      const items = await fetchGitHub(limit);
      results.push(...items);
      console.log(`  [GitHub] Fetched ${items.length} items`);
    } catch (e) {
      errors.push(`GitHub: ${e.message}`);
      console.error(`  [GitHub] Error: ${e.message}`);
    }
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(`All sources failed: ${errors.join(", ")}`);
  }

  // Shuffle for variety
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }

  return results;
}

module.exports = { fetchTools, fetchHackerNews, fetchGitHub };
