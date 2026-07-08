// Small formatting helpers shared across server and client components.

export function displayName(u: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (u.username) return `@${u.username}`;
  return "Telegram user";
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = secs;
  let unit = "second";
  let divisor = 1;
  let acc = 1;
  for (const [step, name] of units) {
    if (value < step) {
      unit = name;
      break;
    }
    acc *= step;
    divisor = acc;
    value = Math.floor(secs / divisor);
    unit = name;
  }
  if (value <= 0) return "just now";
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

export const ENTITY_TYPE_LABEL: Record<string, string> = {
  COMPANY: "Company",
  SPECIALIST: "Specialist",
};

export const RELATION_LABEL: Record<string, string> = {
  WORKS_AT: "works at",
  OWNS: "owns",
  PARTNER: "partner of",
  FORMER_EMPLOYEE: "former employee of",
  AFFILIATE: "affiliate of",
  ASSOCIATED_WITH: "associated with",
  OTHER: "connected with",
};

// Serialise Prisma objects that contain BigInt (telegramId) for the client.
export function serialize<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}
