import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { SearchIcon } from "@/components/icons";

export default function EntityNotFound() {
  return (
    <div className="container-page">
      <EmptyState
        icon={<SearchIcon />}
        title="Card not found"
        description="This company or specialist doesn't exist or hasn't been approved yet."
        actionHref="/search"
        actionLabel="Back to search"
      />
    </div>
  );
}
