import { Paperclip } from "@deemlol/next-icons";
import { getSessionUser } from "@/lib/auth";
import {
  NTFY_PRIORITY_LABELS,
  NtfyPriority,
  getFeed,
  type NtfyMessage,
} from "@/lib/ntfy";
import { COLOR_TOKEN, labelBackground, labelTextColor } from "@/lib/trello-colors";
import {
  NtfyClearAllButton,
  NtfyClearButton,
  NtfyDismissible,
  NtfyReadState,
} from "@/components/ntfy-read-controls";
import { Skeleton, WidgetSkeleton } from "@/components/skeleton";

export function NtfyNotificationsSkeleton() {
  return (
    <WidgetSkeleton label="notifications">
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, idx) => (
          <li key={idx} className="card flex flex-col gap-2 py-3">
            <div className="flex justify-between gap-2 pr-6">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </li>
        ))}
      </ul>
    </WidgetSkeleton>
  );
}

const PRIORITY_STYLES: Partial<Record<NtfyPriority, { backgroundColor: string; color: string }>> = {
  [NtfyPriority.HIGH]: { backgroundColor: "var(--ds-background-warning-bold)", color: "#1f1f21" },
  [NtfyPriority.URGENT]: { backgroundColor: "var(--ds-background-danger-bold)", color: "#1f1f21" },
};

function formatAge(unixSeconds: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));
  if (seconds < 60) return "just now";
  if (seconds < 60 * 60) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 24 * 60 * 60) return `${Math.floor(seconds / (60 * 60))}h ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function NtfyMessageCard({ message, bShowTopic }: { message: NtfyMessage; bShowTopic: boolean }) {
  const priorityStyle = PRIORITY_STYLES[message.priority];
  const bHasFooter = bShowTopic || priorityStyle || message.tags.length > 0 || message.attachmentName;

  function simpleHash(str: string) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
  }

  const topicColor = Object.keys(COLOR_TOKEN)[simpleHash(message.topic) % Object.keys(COLOR_TOKEN).length];

  const content = (
    <>
      {/* Right padding leaves room for the clear button, which sits outside the (possibly linked) card. */}
      <div className="flex items-baseline justify-between gap-2 pr-6">
        <p className="min-w-0 truncate text-sm font-medium">{message.title ?? message.topic}</p>
        <span className="shrink-0 text-xs text-muted">{formatAge(message.time)}</span>
      </div>

      {message.message && (
        <p className="mt-1 line-clamp-4 whitespace-pre-line wrap-break-word text-sm">{message.message}</p>
      )}

      {bHasFooter && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {priorityStyle && (
            <span style={priorityStyle} className="rounded px-1.5 py-0.5 text-xs font-medium">
              {NTFY_PRIORITY_LABELS[message.priority]}
            </span>
          )}
          {bShowTopic && (
            <span
              style={{ backgroundColor: labelBackground(topicColor), color: labelTextColor(topicColor) }}
              className="rounded px-1.5 py-0.5 text-xs font-medium"
            >
              {message.topic}
            </span>
          )}
          {message.tags.map((tag) => (
            <span key={tag} className="text-xs text-muted">
              #{tag}
            </span>
          ))}
          {message.attachmentName && (
            <span className="flex min-w-0 items-center gap-1 text-xs text-muted">
              <Paperclip size={12} />
              <span className="truncate">{message.attachmentName}</span>
            </span>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="relative">
      {message.click ? (
        <a
          href={message.click}
          target="_blank"
          rel="noopener noreferrer"
          className="card block py-3 transition-colors hover:opacity-80"
        >
          {content}
        </a>
      ) : (
        <div className="card py-3">{content}</div>
      )}
      <div className="absolute right-2 top-2.5">
        <NtfyClearButton
          messageKey={message.key}
          subscriptionId={message.subscriptionId}
          messageId={message.id}
          messageTime={message.time}
        />
      </div>
    </div>
  );
}

export async function NtfyNotifications() {
  const user = await getSessionUser();
  if (!user) return null;

  let feed;
  try {
    feed = await getFeed(user.id);
  } catch (error) {
    console.error("Failed to fetch ntfy notifications:", error);
    return <p className="text-sm text-muted">Notifications are unavailable right now.</p>;
  }

  if (!feed) return null;

  return (
    <NtfyReadState>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <h2 className="text-sm text-center font-semibold text-muted">Notifications</h2>
          {feed.messages.length > 0 && (
            <div className="absolute right-0 top-0">
              <NtfyClearAllButton
                messageKeys={feed.messages.map((message) => message.key)}
                before={feed.messages[0].time}
              />
            </div>
          )}
        </div>

        {feed.failedTopics.length > 0 && (
          <p className="text-xs text-red-500">Could not load: {feed.failedTopics.join(", ")}</p>
        )}

        {feed.messages.length === 0 ? (
          <p className="text-sm text-muted">No unread notifications.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {feed.messages.map((message) => (
              <NtfyDismissible key={message.key} messageKey={message.key}>
                <li>
                  <NtfyMessageCard message={message} bShowTopic={feed.topicCount > 1} />
                </li>
              </NtfyDismissible>
            ))}
          </ul>
        )}
      </div>
    </NtfyReadState>
  );
}
