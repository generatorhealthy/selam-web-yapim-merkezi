import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface MobileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const MobileEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: MobileEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "hsl(var(--m-surface-muted))" }}
      >
        <Icon className="w-7 h-7" style={{ color: "hsl(var(--m-text-tertiary))" }} />
      </div>
      <h3 className="text-[17px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-[14px] max-w-xs" style={{ color: "hsl(var(--m-text-secondary))" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
