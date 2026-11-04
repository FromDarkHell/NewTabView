// Shared between server and client, so this module must not import server-only code.

export const WIDGET_IDS = ["news", "trello", "uptime-kuma", "ntfy"] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

// Columns from left to right, each a stack of widgets from top to bottom.
export type WidgetLayout = WidgetId[][];

export const WIDGET_LABELS: Record<WidgetId, string> = {
  news: "News",
  trello: "Trello",
  "uptime-kuma": "Uptime Kuma",
  ntfy: "ntfy",
};

// A column holding only "narrow" widgets gets a fixed width; any "fluid" widget lets it share the free space.
export const WIDGET_WIDTHS: Record<WidgetId, "narrow" | "fluid"> = {
  news: "fluid",
  trello: "fluid",
  "uptime-kuma": "narrow",
  ntfy: "narrow",
};

export function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === "string" && (WIDGET_IDS as readonly string[]).includes(value);
}

// Drops unknown or duplicate ids and empty columns, then gives each widget missing from the saved
// layout its own column, so newly added widgets show up for users who saved a layout before they existed.
export function resolveWidgetLayout(saved: unknown): WidgetLayout {
  const seen = new Set<WidgetId>();
  const columns: WidgetLayout = [];

  for (const savedColumn of Array.isArray(saved) ? saved : []) {
    if (!Array.isArray(savedColumn)) continue;

    const column = savedColumn.filter(
      (id): id is WidgetId => isWidgetId(id) && !seen.has(id),
    );
    column.forEach((id) => seen.add(id));
    if (column.length > 0) columns.push(column);
  }

  for (const id of WIDGET_IDS) {
    if (!seen.has(id)) columns.push([id]);
  }

  return columns;
}
