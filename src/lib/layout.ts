import { prisma } from "@/lib/prisma";
import { resolveWidgetLayout, type WidgetId, type WidgetLayout } from "@/lib/widgets";

// Which widgets will have something to render, so the page only shows loading skeletons for those
// instead of flashing one for an integration that then renders nothing.
export async function getConfiguredWidgets(userId: string | null): Promise<Record<WidgetId, boolean>> {
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          trelloAccount: { select: { listId: true } },
          uptimeKumaConfig: { select: { userId: true } },
          _count: { select: { ntfySubscriptions: true } },
        },
      })
    : null;

  return {
    news: true,
    trello: Boolean(user?.trelloAccount?.listId),
    "uptime-kuma": Boolean(user?.uptimeKumaConfig),
    ntfy: (user?._count.ntfySubscriptions ?? 0) > 0,
  };
}

export async function getWidgetLayout(userId: string): Promise<WidgetLayout> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { widgetLayout: true },
  });
  return resolveWidgetLayout(user?.widgetLayout);
}

export async function saveWidgetLayout(userId: string, layout: WidgetLayout): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { widgetLayout: layout },
  });
}
