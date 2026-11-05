"use client";

import { X } from "@deemlol/next-icons";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition } from "react";
import { apiPath } from "@/lib/base-path";

type HiddenState = {
  hiddenKeys: Set<string>;
  setHidden: (keys: string[], bHidden: boolean) => void;
};

const HiddenContext = createContext<HiddenState>({
  hiddenKeys: new Set(),
  setHidden: () => {},
});

// Hides cleared notifications immediately, before the server re-render that drops them arrives.
export function NtfyReadState({ children }: { children: React.ReactNode }) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  function setHidden(keys: string[], bHidden: boolean) {
    setHiddenKeys((current) => {
      const next = new Set(current);
      keys.forEach((key) => (bHidden ? next.add(key) : next.delete(key)));
      return next;
    });
  }

  return <HiddenContext value={{ hiddenKeys, setHidden }}>{children}</HiddenContext>;
}

export function NtfyDismissible({ messageKey, children }: { messageKey: string; children: React.ReactNode }) {
  const { hiddenKeys } = useContext(HiddenContext);
  return hiddenKeys.has(messageKey) ? null : children;
}

async function postJson(path: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(apiPath(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function NtfyClearButton({
  messageKey,
  subscriptionId,
  messageId,
  messageTime,
}: {
  messageKey: string;
  subscriptionId: string;
  messageId: string;
  messageTime: number;
}) {
  const { setHidden } = useContext(HiddenContext);
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function handleClick() {
    setHidden([messageKey], true);
    const bOk = await postJson("/api/ntfy/read", { subscriptionId, messageId, messageTime });
    if (!bOk) {
      setHidden([messageKey], false);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Clear notification"
      title="Clear"
      className="rounded p-0.5 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
    >
      <X size={14} />
    </button>
  );
}

export function NtfyClearAllButton({ messageKeys, before }: { messageKeys: string[]; before: number }) {
  const { setHidden } = useContext(HiddenContext);
  const router = useRouter();
  const [bPending, startTransition] = useTransition();

  async function handleClick() {
    setHidden(messageKeys, true);
    const bOk = await postJson("/api/ntfy/clear", { before });
    if (!bOk) {
      setHidden(messageKeys, false);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={bPending}
      className="text-xs text-muted hover:text-foreground disabled:opacity-50"
    >
      Clear all
    </button>
  );
}
