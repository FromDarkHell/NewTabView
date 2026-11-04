"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
} from "@deemlol/next-icons";
import { useState } from "react";
import { useLayoutEdit } from "@/components/layout-edit";
import { apiPath } from "@/lib/base-path";
import {
  WIDGET_LABELS,
  WIDGET_WIDTHS,
  type WidgetId,
  type WidgetLayout as WidgetLayoutType,
} from "@/lib/widgets";

type DropTarget =
  | { kind: "stack"; columnIndex: number; index: number }
  | { kind: "new-column"; columnIndex: number };

type MoveDirection = "left" | "up" | "down" | "right";

const MOVE_BUTTONS: { direction: MoveDirection; icon: typeof ChevronLeft }[] = [
  { direction: "left", icon: ChevronLeft },
  { direction: "up", icon: ChevronUp },
  { direction: "down", icon: ChevronDown },
  { direction: "right", icon: ChevronRight },
];

const DROP_LINE = "0 0 0 0 transparent";
const DROP_LINE_ABOVE = "0 -6px 0 -3px var(--foreground)";
const DROP_LINE_BELOW = "0 6px 0 -3px var(--foreground)";

function isSameTarget(a: DropTarget | null, b: DropTarget | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Target indices refer to the layout before the widget is removed, so we leave a placeholder where it
// was, insert it at the target, and only then drop the placeholder and any column it left empty.
function moveWidget(
  layout: WidgetLayoutType,
  id: WidgetId,
  target: DropTarget,
): WidgetLayoutType {
  const columns = layout.map((column) => column.map((x) => (x === id ? null : x)));

  if (target.kind === "new-column") {
    columns.splice(target.columnIndex, 0, [id]);
  } else {
    columns[target.columnIndex].splice(target.index, 0, id);
  }

  return columns
    .map((column) => column.filter((x): x is WidgetId => x !== null))
    .filter((column) => column.length > 0);
}

// Left/right move into the neighbouring column, or split off into a new column at the edge.
function directionTarget(
  layout: WidgetLayoutType,
  columnIndex: number,
  index: number,
  direction: MoveDirection,
): DropTarget | null {
  const column = layout[columnIndex];

  switch (direction) {
    case "up":
      return index > 0 ? { kind: "stack", columnIndex, index: index - 1 } : null;
    case "down":
      return index < column.length - 1 ? { kind: "stack", columnIndex, index: index + 2 } : null;
    case "left":
      if (columnIndex > 0) {
        return { kind: "stack", columnIndex: columnIndex - 1, index: layout[columnIndex - 1].length };
      }
      return column.length > 1 ? { kind: "new-column", columnIndex: 0 } : null;
    case "right":
      if (columnIndex < layout.length - 1) {
        return { kind: "stack", columnIndex: columnIndex + 1, index: layout[columnIndex + 1].length };
      }
      return column.length > 1 ? { kind: "new-column", columnIndex: layout.length } : null;
  }
}

function dropLine(target: DropTarget | null, columnIndex: number, index: number, columnLength: number): string {
  if (target?.kind !== "stack" || target.columnIndex !== columnIndex) return DROP_LINE;
  if (target.index === index) return DROP_LINE_ABOVE;
  if (target.index === columnLength && index === columnLength - 1) return DROP_LINE_BELOW;
  return DROP_LINE;
}

export function WidgetLayout({
  initialLayout,
  widgets,
}: {
  initialLayout: WidgetLayoutType;
  widgets: Record<WidgetId, React.ReactNode>;
}) {
  const { bEditing } = useLayoutEdit();
  const [layout, setLayout] = useState(initialLayout);
  const [draggedId, setDraggedId] = useState<WidgetId | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  function updateDropTarget(next: DropTarget | null) {
    setDropTarget((current) => (isSameTarget(current, next) ? current : next));
  }

  function applyMove(id: WidgetId, target: DropTarget) {
    const nextLayout = moveWidget(layout, id, target);
    if (JSON.stringify(nextLayout) === JSON.stringify(layout)) return;

    setLayout(nextLayout);
    fetch(apiPath("/api/layout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: nextLayout }),
    }).catch(() => {});
  }

  function endDrag() {
    setDraggedId(null);
    setDropTarget(null);
  }

  return (
    <div
      className={`widget-layout flex w-full flex-row gap-2 ${bEditing ? "is-editing" : ""}`}
      onDragOver={(e) => {
        if (!draggedId) return;
        e.preventDefault();
        if (e.target === e.currentTarget) updateDropTarget(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (draggedId && dropTarget) applyMove(draggedId, dropTarget);
        endDrag();
      }}
    >
      {layout.map((column, columnIndex) => {
        const bNarrow = column.every((id) => WIDGET_WIDTHS[id] === "narrow");

        return (
          <div
            key={columnIndex}
            onDragOver={(e) => {
              // Only the column's own padding and gaps; widgets handle their own area.
              if (draggedId && e.target === e.currentTarget) {
                updateDropTarget({ kind: "stack", columnIndex, index: column.length });
              }
            }}
            className={`widget-column flex flex-col ${bNarrow ? "w-80 shrink-0" : "min-w-0 flex-1"} ${
              bEditing ? "gap-3 rounded-lg border-2 border-dashed border-foreground/20 p-2" : "gap-6"
            }`}
          >
            {column.map((id, index) => (
                <div
                  key={id}
                  draggable={bEditing}
                  onDragStart={(e) => {
                    setDraggedId(id);
                    e.dataTransfer.effectAllowed = "move";
                    // Firefox will not start a drag without data set.
                    e.dataTransfer.setData("text/plain", id);
                  }}
                  onDragOver={(e) => {
                    if (!draggedId) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const bBelow = e.clientY > rect.top + rect.height / 2;
                    updateDropTarget({ kind: "stack", columnIndex, index: index + (bBelow ? 1 : 0) });
                  }}
                  onDragEnd={endDrag}
                  style={bEditing ? { boxShadow: dropLine(dropTarget, columnIndex, index, column.length) } : undefined}
                  className={`widget-slot ${
                    bEditing
                      ? `flex cursor-move flex-col gap-2 rounded-md bg-foreground/5 p-2 ${draggedId === id ? "opacity-50" : ""}`
                      : ""
                  }`}
                >
                  {bEditing && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted">{WIDGET_LABELS[id]}</span>
                      <div className="flex">
                        {MOVE_BUTTONS.map(({ direction, icon: Icon }) => {
                          const target = directionTarget(layout, columnIndex, index, direction);
                          return (
                            <button
                              key={direction}
                              type="button"
                              disabled={!target}
                              onClick={() => target && applyMove(id, target)}
                              aria-label={`Move ${WIDGET_LABELS[id]} ${direction}`}
                              className="rounded p-1 text-foreground/70 hover:bg-foreground/10 hover:text-foreground disabled:opacity-30"
                            >
                              <Icon size={16} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div
                    className={`widget-content ${
                      bEditing
                        ? "pointer-events-none select-none empty:py-6 empty:text-center empty:text-xs empty:text-muted empty:before:content-['Nothing_to_show']"
                        : "contents"
                    }`}
                  >
                    {widgets[id]}
                  </div>
                </div>
            ))}
          </div>
        );
      })}

      {bEditing && (
        <div
          onDragOver={(e) => {
            if (!draggedId) return;
            e.preventDefault();
            e.stopPropagation();
            updateDropTarget({ kind: "new-column", columnIndex: layout.length });
          }}
          className={`flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted transition-colors ${
            dropTarget?.kind === "new-column" ? "border-foreground/60 bg-foreground/5" : "border-foreground/20"
          }`}
        >
          <Plus size={16} />
          New column
        </div>
      )}
    </div>
  );
}
