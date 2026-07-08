import { BanIcon, CheckIcon, ClockIcon, XIcon } from "./icons";
import { ENTITY_TYPE_LABEL } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED")
    return (
      <span className="badge-ok">
        <CheckIcon width={12} height={12} /> Approved
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="badge-danger">
        <XIcon width={12} height={12} /> Rejected
      </span>
    );
  return (
    <span className="badge-warn">
      <ClockIcon width={12} height={12} /> Pending
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return <span className="badge-brand">{ENTITY_TYPE_LABEL[type] ?? type}</span>;
}

export function BlacklistBadge() {
  return (
    <span className="badge-danger">
      <BanIcon width={12} height={12} /> Blacklisted
    </span>
  );
}
