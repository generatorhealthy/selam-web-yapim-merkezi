import { ReactNode } from "react";

interface MobileSectionProps {
  label?: string;
  title?: string;
  action?: { label: string; onClick: () => void };
  children: ReactNode;
  className?: string;
}

export const MobileSection = ({
  label,
  title,
  action,
  children,
  className = "",
}: MobileSectionProps) => {
  return (
    <section className={`px-5 ${className}`}>
      {(label || title || action) && (
        <div className="flex items-end justify-between mb-3">
          <div>
            {label && <div className="m-section-label">{label}</div>}
            {title && <h2 className="m-title mt-1">{title}</h2>}
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="text-[15px] font-semibold m-pressable"
              style={{ color: "hsl(var(--m-accent))" }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
};
