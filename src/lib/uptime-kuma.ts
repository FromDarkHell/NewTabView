import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const STATUS_CACHE_PREFIX = "uptime-kuma:status:";
const STATUS_CACHE_TTL_SECONDS = 60;
const HEARTBEAT_DISPLAY_COUNT = 30;

// Mirrors Uptime Kuma's heartbeat status values (src/util.ts: DOWN, UP, PENDING, MAINTENANCE)
export enum MonitorStatus {
  DOWN = 0,
  UP = 1,
  PENDING = 2,
  MAINTENANCE = 3,
}

export type UptimeKumaConfig = { baseUrl: string; slug: string };

export type UptimeMonitor = {
  id: number;
  name: string;
  status: MonitorStatus | null;
  ping: number | null;
  message: string;
  uptime24h: number | null;
  heartbeats: MonitorStatus[];
};

export type UptimeGroup = { id: number; name: string; monitors: UptimeMonitor[] };

export type UptimeStatusPage = {
  title: string;
  url: string;
  groups: UptimeGroup[];
};

// Response shapes of Uptime Kuma's public status page API (server/routers/status-page-router.js)
type StatusPageResponse = {
  config: { slug: string; title: string };
  publicGroupList: {
    id: number;
    name: string;
    monitorList: { id: number; name: string }[];
  }[];
};

type HeartbeatResponse = {
  heartbeatList: Record<
    string,
    { status: MonitorStatus; time: string; msg: string; ping: number | null }[]
  >;
  uptimeList: Record<string, number>;
};

export async function getConfig(userId: string): Promise<UptimeKumaConfig | null> {
  const config = await prisma.uptimeKumaConfig.findUnique({ where: { userId } });
  if (!config) return null;
  return { baseUrl: config.baseUrl, slug: config.slug };
}

export async function saveConfig(
  userId: string,
  config: UptimeKumaConfig,
): Promise<void> {
  await prisma.uptimeKumaConfig.upsert({
    where: { userId },
    create: { userId, ...config },
    update: config,
  });

  await redis.del(`${STATUS_CACHE_PREFIX}${userId}`).catch(() => {});
}

export async function clearConfig(userId: string): Promise<void> {
  await prisma.uptimeKumaConfig.deleteMany({ where: { userId } });
  await redis.del(`${STATUS_CACHE_PREFIX}${userId}`).catch(() => {});
}

async function kumaFetch<T>(baseUrl: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`Uptime Kuma request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchStatusPageTitle(config: UptimeKumaConfig): Promise<string> {
  const page = await kumaFetch<StatusPageResponse>(
    config.baseUrl,
    `/api/status-page/${encodeURIComponent(config.slug)}`,
  );
  return page.config.title;
}

async function fetchStatusPage(config: UptimeKumaConfig): Promise<UptimeStatusPage> {
  const slug = encodeURIComponent(config.slug);
  const [page, heartbeats] = await Promise.all([
    kumaFetch<StatusPageResponse>(config.baseUrl, `/api/status-page/${slug}`),
    kumaFetch<HeartbeatResponse>(config.baseUrl, `/api/status-page/heartbeat/${slug}`),
  ]);

  const groups = page.publicGroupList.map((group) => ({
    id: group.id,
    name: group.name,
    monitors: group.monitorList.map((monitor): UptimeMonitor => {
      // Heartbeat times are "YYYY-MM-DD HH:mm:ss" strings, so a string sort is chronological.
      const beats = [...(heartbeats.heartbeatList[monitor.id] ?? [])].sort((a, b) =>
        a.time < b.time ? -1 : a.time > b.time ? 1 : 0,
      );
      const latest = beats.at(-1);

      return {
        id: monitor.id,
        name: monitor.name,
        status: latest?.status ?? null,
        ping: latest?.ping ?? null,
        message: latest?.msg ?? "",
        uptime24h: heartbeats.uptimeList[`${monitor.id}_24`] ?? null,
        heartbeats: beats.slice(-HEARTBEAT_DISPLAY_COUNT).map((beat) => beat.status),
      };
    }),
  }));

  return {
    title: page.config.title,
    url: `${config.baseUrl}/status/${slug}`,
    groups,
  };
}

export async function getStatusPage(userId: string): Promise<UptimeStatusPage | null> {
  const config = await getConfig(userId);
  if (!config) return null;

  const cacheKey = `${STATUS_CACHE_PREFIX}${userId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as UptimeStatusPage;
    }
  } catch {
    console.warn("Failed to read Uptime Kuma cache; falling back to upstream fetch.");
  }

  const statusPage = await fetchStatusPage(config);

  await redis
    .set(cacheKey, JSON.stringify(statusPage), "EX", STATUS_CACHE_TTL_SECONDS)
    .catch(() => {});

  return statusPage;
}
