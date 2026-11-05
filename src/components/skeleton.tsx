export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-foreground/10 ${className}`} />;
}

// Wraps a widget's placeholder so screen readers announce one loading state instead of many empty blocks.
export function WidgetSkeleton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy className="flex flex-col gap-3">
      <span className="sr-only">Loading {label}</span>
      <Skeleton className="mx-auto h-4 w-32" />
      {children}
    </div>
  );
}
