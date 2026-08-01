import { Suspense } from "react";
import { Clock } from "@/components/clock";
import { NewsFeed } from "@/components/news-feed";
import { SettingsMenu } from "@/components/settings-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrelloList } from "@/components/trello-list";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <header className="flex justify-end gap-1 p-4">
        <SettingsMenu />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center gap-10 px-6 pb-24 pt-8">
        <Clock />

        <div className="flex w-full justify-between flex-row gap-2">
          <Suspense fallback={<p className="text-sm text-muted">Loading news</p>}>
            <NewsFeed />
          </Suspense>

          <Suspense fallback={null} >
            <TrelloList />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
