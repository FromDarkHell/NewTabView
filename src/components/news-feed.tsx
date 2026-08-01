import { getTopNews } from "@/lib/news";
import { NewsItem } from "@/components/news-item";

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
    <div className="flex flex-col gap-3 max-w-1/2">
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
