import { prisma } from "@/lib/prisma";
import { resolveWidgetLayout, type WidgetLayout } from "@/lib/widgets";

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
