import { Suspense } from "react";
import { Clock } from "@/components/clock";
import { LayoutEditProvider, LayoutEditToggle } from "@/components/layout-edit";
import { NewsFeed } from "@/components/news-feed";
import { NtfyNotifications } from "@/components/ntfy-notifications";
import { SettingsMenu } from "@/components/settings-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrelloList } from "@/components/trello-list";
import { UptimeKumaStatus } from "@/components/uptime-kuma-status";
import { WidgetLayout } from "@/components/widget-layout";
import { getSessionUser } from "@/lib/auth";
import { getWidgetLayout } from "@/lib/layout";
import { resolveWidgetLayout } from "@/lib/widgets";

export default async function Home() {
  const user = await getSessionUser();
  const widgetLayout = user ? await getWidgetLayout(user.id) : resolveWidgetLayout([]);

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
              news: (
                <Suspense fallback={<p className="text-sm text-muted">Loading news</p>}>
                  <NewsFeed />
                </Suspense>
              ),
              trello: (
                <Suspense fallback={null}>
                  <TrelloList />
                </Suspense>
              ),
              "uptime-kuma": (
                <Suspense fallback={null}>
                  <UptimeKumaStatus />
                </Suspense>
              ),
              ntfy: (
                <Suspense fallback={null}>
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
