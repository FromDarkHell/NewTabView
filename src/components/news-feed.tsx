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
    <ul className="flex w-full max-w-md flex-col gap-3">
      {articles.map((article) => (
        <li key={article.uuid}>
          <NewsItem article={article} />
        </li>
      ))}
    </ul>
  );
}
