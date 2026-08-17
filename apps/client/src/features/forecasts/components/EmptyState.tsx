import type { ReactNode } from "react";

import "./EmptyState.css";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state${compact ? " empty-state--compact" : ""}`}
      role="status"
    >
      <div className="empty-state__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {action !== undefined ? (
        <div className="empty-state__action">{action}</div>
      ) : null}
    </div>
  );
}
