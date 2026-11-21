import "dotenv/config";

// Fetches recent headlines to give the LLM market context.
// Uses NewsAPI's "everything" endpoint; swap for GNews or another provider if you prefer.
export async function fetchNews(query, limit = 8) {
  if (!process.env.NEWS_API_KEY) return [];

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("apiKey", process.env.NEWS_API_KEY);

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.articles || []).map((a) => ({
    title: a.title,
    source: a.source?.name,
    date: a.publishedAt,
    description: a.description,
    url: a.url
  }));
}

export function formatNews(articles) {
  if (!articles.length) return "No recent news available.";
  return articles
    .map((a) => `- [${a.date?.slice(0, 10)}] ${a.title} (${a.source}): ${a.description ?? ""}`)
    .join("\n");
}
