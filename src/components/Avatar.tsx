import clsx from "clsx";
import { BuildingIcon, UserIcon } from "./icons";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function EntityAvatar({
  name,
  type,
  avatarUrl,
  size = 48,
  className,
}: {
  name: string;
  type: "COMPANY" | "SPECIALIST";
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const rounded = type === "COMPANY" ? "rounded-xl" : "rounded-full";
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={clsx("object-cover ring-1 ring-line", rounded, className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={clsx(
        "flex items-center justify-center bg-gradient-to-br from-brand/30 to-accent/20 text-slate-100 ring-1 ring-line",
        rounded,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {name ? (
        <span className="font-semibold">{initials(name)}</span>
      ) : type === "COMPANY" ? (
        <BuildingIcon width={size * 0.5} height={size * 0.5} />
      ) : (
        <UserIcon width={size * 0.5} height={size * 0.5} />
      )}
    </div>
  );
}

export function UserAvatar({
  name,
  photoUrl,
  size = 32,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        className="rounded-full object-cover ring-1 ring-line"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-brand/25 font-semibold text-indigo-100 ring-1 ring-line"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(name || "U")}
    </div>
  );
}
