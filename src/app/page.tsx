import { Suspense } from "react";
import { Clock } from "@/components/clock";
import { NewsFeed } from "@/components/news-feed";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <header className="flex justify-end p-4">
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center gap-10 px-6 pb-24 pt-8">
        <Clock />
        <Suspense fallback={<p className="text-sm text-muted">Loading news…</p>}>
          <NewsFeed />
        </Suspense>
      </main>
    </div>
  );
}
