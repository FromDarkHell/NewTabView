import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { isHttpUrl } from "@/lib/url";

const FEED_CACHE_PREFIX = "ntfy:feed:";
const FEED_CACHE_TTL_SECONDS = 30;
const MESSAGE_DISPLAY_COUNT = 20;

export const DEFAULT_NTFY_SERVER = "https://ntfy.sh";

// Topic names as ntfy accepts them (server/server.go: topicRegex)
const TOPIC_PATTERN = /^[-_A-Za-z0-9]{1,64}$/;

// Mirrors ntfy's message priorities (https://docs.ntfy.sh/publish/#message-priority)
export enum NtfyPriority {
  MIN = 1,
  LOW = 2,
  DEFAULT = 3,
  HIGH = 4,
  URGENT = 5,
}

export const NTFY_PRIORITY_LABELS: Record<NtfyPriority, string> = {
  [NtfyPriority.MIN]: "Min",
  [NtfyPriority.LOW]: "Low",
  [NtfyPriority.DEFAULT]: "Default",
  [NtfyPriority.HIGH]: "High",
  [NtfyPriority.URGENT]: "Urgent",
};

// What the settings UI sees; the access token never leaves the server.
export type NtfySubscriptionSummary = {
  id: string;
  serverUrl: string;
  topic: string;
  hasToken: boolean;
};

export type NtfyMessage = {
  key: string;
  time: number;
  serverUrl: string;
  topic: string;
  title: string | null;
  message: string;
  priority: NtfyPriority;
  tags: string[];
  click: string | null;
  attachmentName: string | null;
};

export type NtfyFeed = {
  messages: NtfyMessage[];
  failedTopics: string[];
  topicCount: number;
};

// One line of ntfy's JSON stream (https://docs.ntfy.sh/subscribe/api/#json-message-format)
type NtfyStreamEvent = {
  id: string;
  time: number;
  event: "open" | "keepalive" | "message" | "poll_request";
  topic: string;
  title?: string;
  message?: string;
  priority?: NtfyPriority;
  tags?: string[];
  click?: string;
  attachment?: { name: string };
};

type NtfyEndpoint = { serverUrl: string; topic: string; token: string | null };

export function isValidTopic(topic: string): boolean {
  return TOPIC_PATTERN.test(topic);
}

function feedCacheKey(userId: string): string {
  return `${FEED_CACHE_PREFIX}${userId}`;
}

export async function listSubscriptions(userId: string): Promise<NtfySubscriptionSummary[]> {
  const subscriptions = await prisma.ntfySubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return subscriptions.map((subscription) => ({
    id: subscription.id,
    serverUrl: subscription.serverUrl,
    topic: subscription.topic,
    hasToken: Boolean(subscription.token),
  }));
}

export async function findSubscription(
  userId: string,
  serverUrl: string,
  topic: string,
): Promise<boolean> {
  const existing = await prisma.ntfySubscription.findUnique({
    where: { userId_serverUrl_topic: { userId, serverUrl, topic } },
  });
  return Boolean(existing);
}

export async function addSubscription(
  userId: string,
  endpoint: NtfyEndpoint,
): Promise<NtfySubscriptionSummary> {
  const subscription = await prisma.ntfySubscription.create({
    data: { userId, ...endpoint },
  });

  await redis.del(feedCacheKey(userId)).catch(() => {});

  return {
    id: subscription.id,
    serverUrl: subscription.serverUrl,
    topic: subscription.topic,
    hasToken: Boolean(subscription.token),
  };
}

export async function removeSubscription(userId: string, id: string): Promise<void> {
  await prisma.ntfySubscription.deleteMany({ where: { id, userId } });
  await redis.del(feedCacheKey(userId)).catch(() => {});
}

// Polls the topic's cached messages instead of holding a stream open (https://docs.ntfy.sh/subscribe/api/#poll-for-messages)
async function fetchTopicMessages(endpoint: NtfyEndpoint, since: string): Promise<NtfyStreamEvent[]> {
  const url = `${endpoint.serverUrl}/${encodeURIComponent(endpoint.topic)}/json?poll=1&since=${since}`;
  const res = await fetch(url, {
    headers: endpoint.token ? { Authorization: `Bearer ${endpoint.token}` } : undefined,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`ntfy request failed: ${res.status}`);
  }

  const body = await res.text();
  return body
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as NtfyStreamEvent)
    .filter((event) => event.event === "message");
}

export async function verifyEndpoint(endpoint: NtfyEndpoint): Promise<void> {
  await fetchTopicMessages(endpoint, "1m");
}

export async function getFeed(userId: string): Promise<NtfyFeed | null> {
  const subscriptions = await prisma.ntfySubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return null;

  const cacheKey = feedCacheKey(userId);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as NtfyFeed;
    }
  } catch {
    console.warn("Failed to read ntfy cache; falling back to upstream fetch.");
  }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) => fetchTopicMessages(subscription, "all")),
  );

  const messages: NtfyMessage[] = [];
  const failedTopics: string[] = [];

  results.forEach((result, idx) => {
    const subscription = subscriptions[idx];
    if (result.status === "rejected") {
      console.error(`Failed to fetch ntfy topic ${subscription.topic}:`, result.reason);
      failedTopics.push(subscription.topic);
      return;
    }

    for (const event of result.value) {
      messages.push({
        key: `${subscription.serverUrl}/${event.id}`,
        time: event.time,
        serverUrl: subscription.serverUrl,
        topic: event.topic,
        title: event.title ?? null,
        message: event.message ?? "",
        priority: event.priority ?? NtfyPriority.DEFAULT,
        tags: event.tags ?? [],
        // Anyone can publish to a public topic, so only plain web links are kept.
        click: event.click && isHttpUrl(event.click) ? event.click : null,
        attachmentName: event.attachment?.name ?? null,
      });
    }
  });

  const feed: NtfyFeed = {
    messages: messages.sort((a, b) => b.time - a.time).slice(0, MESSAGE_DISPLAY_COUNT),
    failedTopics,
    topicCount: subscriptions.length,
  };

  await redis
    .set(cacheKey, JSON.stringify(feed), "EX", FEED_CACHE_TTL_SECONDS)
    .catch(() => {});

  return feed;
}
