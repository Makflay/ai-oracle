import type { ReactNode } from "react";

import "./ErrorState.css";

interface ErrorStateProps {
  title: string;
  description: string;
  details?: string | null;
  action?: ReactNode;
  compact?: boolean;
}

export function ErrorState({
  title,
  description,
  details,
  action,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      className={`error-state${compact ? " error-state--compact" : ""}`}
      role="alert"
    >
      <div className="error-state__content">
        <h3>{title}</h3>
        <p>{description}</p>

        {details !== undefined && details !== null ? (
          <p className="error-state__details">{details}</p>
        ) : null}
      </div>

      {action !== undefined ? (
        <div className="error-state__action">{action}</div>
      ) : null}
    </div>
  );
}
