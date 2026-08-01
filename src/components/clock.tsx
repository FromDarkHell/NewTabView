"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-24 sm:h-32" />
        <div className="h-6" />
      </div>
    );
  }

  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-6xl font-semibold tracking-tight tabular-nums sm:text-8xl">
        {time}
      </span>
      <span className="text-lg text-muted sm:text-xl">{date}</span>
    </div>
  );
}
