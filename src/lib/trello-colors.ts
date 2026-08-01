// Maps Trello's label color names onto this app's --ds-* design
const COLOR_TOKEN: Record<string, string> = {
  green: "green",
  yellow: "yellow",
  orange: "orange",
  red: "red",
  purple: "purple",
  blue: "blue",
  sky: "teal",
  lime: "lime",
  pink: "magenta",
  black: "gray",
};

// Trello labels are a base color, suffixed with "_dark" or "_light" (e.g. "green_dark", "orange_light").
function parseColor(
  color: string | null,
): { token: string; tier: "subtlest" | "subtler" | "subtle" } | null {
  if (!color) return null;

  const [base, variant] = color.split("_");
  const token = COLOR_TOKEN[base];
  if (!token) return null;

  let tier: "subtlest" | "subtler" | "subtle";

  if (variant === "light") tier = "subtlest";
  else if (variant === "dark") tier = "subtle";
  else tier = "subtler";

  return { token, tier };
}

export function labelBackground(color: string | null): string {
  const parsed = parseColor(color);

  return parsed
    ? `var(--ds-background-accent-${parsed.token}-${parsed.tier})`
    : "var(--ds-background-neutral)";
}

export function labelTextColor(color: string | null): string {
  const parsed = parseColor(color);

  return parsed
    ? `var(--ds-text-accent-${parsed.token}-bolder)`
    : "var(--ds-text-subtle)";
}
