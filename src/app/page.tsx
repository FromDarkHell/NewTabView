import { Suspense } from "react";
import { Clock } from "@/components/clock";
import { LayoutEditProvider, LayoutEditToggle } from "@/components/layout-edit";
import { NewsFeed, NewsFeedSkeleton } from "@/components/news-feed";
import { NtfyNotifications, NtfyNotificationsSkeleton } from "@/components/ntfy-notifications";
import { SettingsMenu } from "@/components/settings-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrelloList, TrelloListSkeleton } from "@/components/trello-list";
import { UptimeKumaStatus, UptimeKumaStatusSkeleton } from "@/components/uptime-kuma-status";
import { WidgetLayout } from "@/components/widget-layout";
import { getSessionUser } from "@/lib/auth";
import { getConfiguredWidgets, getWidgetLayout } from "@/lib/layout";
import { resolveWidgetLayout } from "@/lib/widgets";

export default async function Home() {
  const user = await getSessionUser();
  const [widgetLayout, configured] = await Promise.all([
    user ? getWidgetLayout(user.id) : resolveWidgetLayout([]),
    getConfiguredWidgets(user?.id ?? null),
  ]);

  return (
    <LayoutEditProvider>
      <div className="flex flex-1 flex-col bg-background font-sans">
        <header className="flex justify-end gap-1 p-4">
          {user && <LayoutEditToggle />}
          <SettingsMenu />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 flex-col items-center gap-10 px-6 pb-24 pt-8">
          <Clock />

          <WidgetLayout
            initialLayout={widgetLayout}
            widgets={{
              news: configured.news && (
                <Suspense fallback={<NewsFeedSkeleton />}>
                  <NewsFeed />
                </Suspense>
              ),
              trello: configured.trello && (
                <Suspense fallback={<TrelloListSkeleton />}>
                  <TrelloList />
                </Suspense>
              ),
              "uptime-kuma": configured["uptime-kuma"] && (
                <Suspense fallback={<UptimeKumaStatusSkeleton />}>
                  <UptimeKumaStatus />
                </Suspense>
              ),
              ntfy: configured.ntfy && (
                <Suspense fallback={<NtfyNotificationsSkeleton />}>
                  <NtfyNotifications />
                </Suspense>
              ),
            }}
          />
        </main>
      </div>
    </LayoutEditProvider>
  );
}
