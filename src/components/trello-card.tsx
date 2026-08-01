import { AlignLeft, Clock, Paperclip } from "@deemlol/next-icons";
import type { TrelloCard as TrelloCardType } from "@/lib/trello";
import { labelBackground, labelTextColor } from "@/lib/trello-colors";

function dueBadgeStyle(due: string | null, dueComplete: boolean): {
  backgroundColor: string;
  color: string;
} {
  if (dueComplete) {
    return {
      backgroundColor: "var(--ds-background-success-bold)",
      color: "var(--ds-text-inverse, #1f1f21)",
    };
  }
  if (!due) {
    return { backgroundColor: "var(--ds-background-neutral)", color: "var(--ds-text-subtle)" };
  }

  const diffMs = new Date(due).getTime() - Date.now();
  if (diffMs < 0) {
    return { backgroundColor: "var(--ds-background-danger-bold)", color: "#1f1f21" };
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    return { backgroundColor: "var(--ds-background-warning-bold)", color: "#1f1f21" };
  }
  return { backgroundColor: "var(--ds-background-neutral)", color: "var(--ds-text-subtle)" };
}

export function TrelloCard({ card }: { card: TrelloCardType }) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card block transition-colors hover:opacity-80"
    >
      {card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.id}
              style={{
                backgroundColor: labelBackground(label.color),
                color: labelTextColor(label.color),
              }}
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
            >
              {label.name || "    "}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-medium leading-snug">{card.name}</p>

      {(card.due || card.badges.description || card.badges.attachments > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {card.due && (
            <span
              style={dueBadgeStyle(card.due, card.dueComplete)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
            >
              <Clock size={12} />
              {new Date(card.due).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {card.badges.description && (
            <span className="text-muted">
              <AlignLeft size={14} />
            </span>
          )}
          {card.badges.attachments > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <Paperclip size={14} />
              {card.badges.attachments}
            </span>
          )}
        </div>
      )}
    </a>
  );
}
