import { redis } from "@/lib/redis";

export type NewsArticle = {
  uuid: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string;
};

const CACHE_KEY = "news:top";
const CACHE_TTL_SECONDS = 60 * 60;
const NEWS_API_URL = "https://api.thenewsapi.com/v1/news/top";

type TheNewsApiArticle = {
  uuid: string;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  source: string;
  published_at: string;
};

type TheNewsApiResponse = {
  data: TheNewsApiArticle[];
};

function toArticle(raw: TheNewsApiArticle): NewsArticle {
  return {
    uuid: raw.uuid,
    title: raw.title,
    description: raw.description,
    url: raw.url,
    imageUrl: raw.image_url,
    source: raw.source,
    publishedAt: raw.published_at,
  };
}

const ARTICLES_PER_PAGE = 3;
const PAGE_COUNT = 3;

async function fetchPage(apiKey: string, page: number): Promise<NewsArticle[]> {
  const url = new URL(NEWS_API_URL);
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("language", "en");
  url.searchParams.set("locale", "us");

  url.searchParams.set("exclude_categories", "sports");

  url.searchParams.set("limit", String(ARTICLES_PER_PAGE));
  url.searchParams.set("page", String(page));

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`thenewsapi.com request failed: ${res.status}`);
  }

  const body = (await res.json()) as TheNewsApiResponse;
  return body.data.map(toArticle);
}

async function fetchFromUpstream(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error("NEWS_API_KEY is not set");
  }

  const pages = await Promise.all(
    Array.from({ length: PAGE_COUNT }, (_, i) => fetchPage(apiKey, i + 1)),
  );

  return pages.flat();
}

export async function getTopNews(): Promise<NewsArticle[]> {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as NewsArticle[];
    }
  } catch {
    console.warn(
      "Failed to read from Redis cache; falling back to upstream fetch.",
    );
  }

  const articles = await fetchFromUpstream();

  await redis.set(CACHE_KEY, JSON.stringify(articles), "EX", CACHE_TTL_SECONDS);

  return articles;
}
