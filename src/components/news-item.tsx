import Image from "next/image";
import type { NewsArticle } from "@/lib/news";

export function NewsItem({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg px-3 py-2 transition-colors card"
    >
      {article.imageUrl ? (
        <Image
          src={article.imageUrl}
          alt=""
          height={128}
          width={128}
          className="w-32 h-32 shrink-0 rounded-md object-cover"
          unoptimized
          loading="lazy"
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-md bg-foreground/10" />
      )}
      <div className="flex flex-col justify-between overflow-hidden">
        <div className="min-w-0 flex flex-col gap-0.5">
          <p className="text-sm font-medium leading-snug">{article.title}</p>
          <p className="text-sm">{article.description}</p>
        </div>

        <p className="mt-0.5 text-xs text-muted">{article.source}</p>
      </div>
    </a>
  );
}
