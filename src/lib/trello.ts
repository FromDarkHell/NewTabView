import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const CARDS_CACHE_PREFIX = "trello:cards:";
const CARDS_CACHE_TTL_SECONDS = 60;

const TRELLO_API_URL = "https://api.trello.com/1";

export type TrelloBoard = { id: string; name: string };
export type TrelloList = { id: string; name: string };
export type TrelloCard = {
  id: string;
  name: string;
  url: string;
  due: string | null;
  dueComplete: boolean;
  labels: { id: string; name: string; color: string | null }[];
  badges: { description: boolean; attachments: number };
};

export type TrelloSelection = {
  boardId: string;
  boardName: string;
  listId: string;
  listName: string;
};

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_TRELLO_API_KEY is not set");
  }
  return apiKey;
}

export async function saveToken(userId: string, token: string): Promise<void> {
  await prisma.trelloAccount.upsert({
    where: { userId },
    create: { userId, token },
    update: { token },
  });
}

export async function getToken(userId: string): Promise<string | null> {
  const account = await prisma.trelloAccount.findUnique({ where: { userId } });
  return account?.token ?? null;
}

export async function clearTrelloState(userId: string): Promise<void> {
  await prisma.trelloAccount.deleteMany({ where: { userId } });
}

export async function getSelection(
  userId: string,
): Promise<TrelloSelection | null> {
  const account = await prisma.trelloAccount.findUnique({ where: { userId } });
  if (!account?.boardId || !account.boardName || !account.listId || !account.listName) {
    return null;
  }
  return {
    boardId: account.boardId,
    boardName: account.boardName,
    listId: account.listId,
    listName: account.listName,
  };
}

export async function saveSelection(
  userId: string,
  selection: TrelloSelection,
): Promise<void> {
  await prisma.trelloAccount.update({
    where: { userId },
    data: selection,
  });

  await redis.del(`${CARDS_CACHE_PREFIX}${userId}:${selection.listId}`).catch(() => {});
}

async function trelloFetch<T>(path: string, token: string): Promise<T> {
  const url = new URL(`${TRELLO_API_URL}${path}`);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("token", token);

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`Trello request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchBoards(token: string): Promise<TrelloBoard[]> {
  return trelloFetch<TrelloBoard[]>("/members/me/boards?fields=name", token);
}

export async function fetchLists(
  token: string,
  boardId: string,
): Promise<TrelloList[]> {
  return trelloFetch<TrelloList[]>(
    `/boards/${boardId}/lists?fields=name`,
    token,
  );
}

export async function getListCards(userId: string): Promise<{
  selection: TrelloSelection;
  cards: TrelloCard[];
}> {
  const [token, selection] = await Promise.all([
    getToken(userId),
    getSelection(userId),
  ]);
  if (!token || !selection) {
    throw new Error("Trello is not connected");
  }

  const cacheKey = `${CARDS_CACHE_PREFIX}${userId}:${selection.listId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return { selection, cards: JSON.parse(cached) as TrelloCard[] };
    }
  } catch {
    console.warn("Failed to read Trello cache; falling back to upstream fetch.");
  }

  const cards = await trelloFetch<TrelloCard[]>(
    `/lists/${selection.listId}/cards?fields=name,url,due,dueComplete,labels,badges`,
    token,
  );

  await redis
    .set(cacheKey, JSON.stringify(cards), "EX", CARDS_CACHE_TTL_SECONDS)
    .catch(() => {});

  return { selection, cards };
}
