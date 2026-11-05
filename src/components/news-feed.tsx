import { getTopNews } from "@/lib/news";
import { NewsItem } from "@/components/news-item";
import { Skeleton, WidgetSkeleton } from "@/components/skeleton";

export function NewsFeedSkeleton() {
  return (
    <WidgetSkeleton label="news">
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, idx) => (
          <li key={idx} className="card flex gap-3 rounded-lg px-3 py-2">
            <Skeleton className="h-32 w-32 shrink-0 rounded-md" />
            <div className="flex grow flex-col justify-between py-1">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </li>
        ))}
      </ul>
    </WidgetSkeleton>
  );
}

export async function NewsFeed() {
  let articles;
  try {
    articles = await getTopNews();
  } catch {
    return (
      <p className="text-sm text-muted">News is unavailable right now.</p>
    );
  }

  if (articles.length === 0) {
    return <p className="text-sm text-muted">No news to show.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm text-center font-semibold text-muted">
        News
      </h2>
      <ul className="flex flex-col gap-3">
        {articles.map((article) => (
          <li key={article.uuid}>
            <NewsItem article={article} />
          </li>
        ))}
      </ul>
    </div>
  );
}
