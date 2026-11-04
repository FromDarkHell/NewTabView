"use client";

import { Check, Layout } from "@deemlol/next-icons";
import { createContext, useContext, useState } from "react";

type LayoutEditState = {
  bEditing: boolean;
  setEditing: (bEditing: boolean) => void;
};

const LayoutEditContext = createContext<LayoutEditState>({
  bEditing: false,
  setEditing: () => {},
});

export function LayoutEditProvider({ children }: { children: React.ReactNode }) {
  const [bEditing, setEditing] = useState(false);
  return (
    <LayoutEditContext value={{ bEditing, setEditing }}>{children}</LayoutEditContext>
  );
}

export function useLayoutEdit(): LayoutEditState {
  return useContext(LayoutEditContext);
}

export function LayoutEditToggle() {
  const { bEditing, setEditing } = useLayoutEdit();

  return (
    <button
      type="button"
      onClick={() => setEditing(!bEditing)}
      aria-label={bEditing ? "Finish editing layout" : "Edit layout"}
      aria-pressed={bEditing}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/10 hover:text-foreground ${
        bEditing ? "bg-foreground/10 text-foreground" : "text-foreground/70"
      }`}
    >
      {bEditing ? <Check /> : <Layout />}
    </button>
  );
}
