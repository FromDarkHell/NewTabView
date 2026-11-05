import { getSessionUser } from "@/lib/auth";
import {
  HEARTBEAT_DISPLAY_COUNT,
  MonitorStatus,
  getStatusPage,
  type UptimeMonitor,
} from "@/lib/uptime-kuma";
import { Skeleton, WidgetSkeleton } from "@/components/skeleton";

export function UptimeKumaStatusSkeleton() {
  return (
    <WidgetSkeleton label="Uptime Kuma">
      <ul className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, idx) => (
          <li
            key={idx}
            className="card flex shrink grow flex-col gap-2 py-3"
            style={{ width: "calc(50% - 0.5rem)" }}
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
              <Skeleton className="h-4 grow" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex h-4 gap-0.5">
              {Array.from({ length: HEARTBEAT_DISPLAY_COUNT }, (_, beatIdx) => (
                <Skeleton key={beatIdx} className="w-1 grow rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-3 w-12" />
          </li>
        ))}
      </ul>
    </WidgetSkeleton>
  );
}

const STATUS_COLORS: Record<MonitorStatus, string> = {
  [MonitorStatus.DOWN]: "var(--ds-background-accent-red-bolder)",
  [MonitorStatus.UP]: "var(--ds-background-accent-green-bolder)",
  [MonitorStatus.PENDING]: "var(--ds-background-accent-orange-bolder)",
  [MonitorStatus.MAINTENANCE]: "var(--ds-background-accent-blue-bolder)",
};

const STATUS_LABELS: Record<MonitorStatus, string> = {
  [MonitorStatus.DOWN]: "Down",
  [MonitorStatus.UP]: "Up",
  [MonitorStatus.PENDING]: "Pending",
  [MonitorStatus.MAINTENANCE]: "Maintenance",
};

function statusColor(status: MonitorStatus | null): string {
  return status === null ? "var(--ds-background-neutral)" : STATUS_COLORS[status];
}

function MonitorRow({ monitor }: { monitor: UptimeMonitor }) {
  const statusLabel = monitor.status === null ? "No data" : STATUS_LABELS[monitor.status];

  return (
    <div className="card flex flex-col gap-2 py-3">
      <div className="flex items-center gap-2">
        <span
          title={monitor.message || statusLabel}
          aria-label={statusLabel}
          style={{ backgroundColor: statusColor(monitor.status) }}
          className="h-2.5 w-2.5 shrink-0 rounded-full"
        />
        <p className="min-w-0 grow truncate text-sm font-medium">{monitor.name}</p>
        {monitor.uptime24h !== null && (
          <span className="text-xs font-medium text-muted">
            {(monitor.uptime24h * 100).toFixed(2)}%
          </span>
        )}
      </div>

      {monitor.heartbeats.length > 0 && (
        <div className="flex h-4 items-stretch gap-0.5">
          {monitor.heartbeats.map((status, idx) => (
            <span
              key={idx}
              style={{ backgroundColor: STATUS_COLORS[status] }}
              className="w-1 grow rounded-sm"
            />
          ))}
        </div>
      )}

      {monitor.ping !== null && (
        <p className="text-xs text-muted">{monitor.ping} ms</p>
      )}
    </div>
  );
}

export async function UptimeKumaStatus() {
  const user = await getSessionUser();
  if (!user) return null;

  let statusPage;
  try {
    statusPage = await getStatusPage(user.id);
  } catch (error) {
    console.error("Failed to fetch Uptime Kuma status page:", error);
    return (
      <p className="text-sm text-muted">
        Uptime Kuma is unavailable right now.
      </p>
    );
  }

  if (!statusPage) return null;

  return (
    <div className="flex flex-col gap-3">
      <a
        href={statusPage.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-center font-semibold text-muted hover:text-foreground"
      >
        {statusPage.title}
      </a>
      {statusPage.groups.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          {statusPage.groups.length > 1 && (
            <h3 className="text-xs font-semibold text-muted">{group.name}</h3>
          )}
          {group.monitors.length === 0 ? (
            <p className="text-sm text-muted">No monitors in this group.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {group.monitors.map((monitor) => (
                <li key={monitor.id} className="grow shrink" style={{ width: "calc(50% - 0.5rem)" }}>
                  <MonitorRow monitor={monitor} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
