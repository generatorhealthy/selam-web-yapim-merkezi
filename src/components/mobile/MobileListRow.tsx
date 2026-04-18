import { ReactNode } from "react";
import { ChevronRight, LucideIcon } from "lucide-react";

interface MobileListRowProps {
  icon?: LucideIcon;
  iconTone?: "accent" | "success" | "warning" | "danger" | "info" | "purple" | "pink" | "teal";
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}

const toneMap = {
  accent: { fg: "hsl(var(--m-accent))", bg: "hsl(var(--m-accent-soft))" },
  success: { fg: "hsl(var(--m-success))", bg: "hsl(var(--m-success-soft))" },
  warning: { fg: "hsl(var(--m-warning))", bg: "hsl(var(--m-warning-soft))" },
  danger: { fg: "hsl(var(--m-danger))", bg: "hsl(var(--m-danger-soft))" },
  info: { fg: "hsl(var(--m-info))", bg: "hsl(var(--m-info-soft))" },
  purple: { fg: "hsl(var(--m-purple))", bg: "hsl(var(--m-purple-soft))" },
  pink: { fg: "hsl(var(--m-pink))", bg: "hsl(var(--m-pink-soft))" },
  teal: { fg: "hsl(var(--m-teal))", bg: "hsl(var(--m-teal-soft))" },
} as const;

export const MobileListRow = ({
  icon: Icon,
  iconTone = "accent",
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  showChevron = true,
}: MobileListRowProps) => {
  const c = toneMap[iconTone];
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 ${
        onClick ? "m-pressable cursor-pointer" : ""
      }`}
    >
      {Icon ? (
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: c.bg }}
        >
          <Icon className="w-5 h-5" style={{ color: c.fg }} />
        </div>
      ) : (
        leading
      )}
      <div className="flex-1 min-w-0">
        <div
          className="text-[16px] font-semibold truncate"
          style={{ color: "hsl(var(--m-text-primary))" }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="text-[13px] truncate mt-0.5"
            style={{ color: "hsl(var(--m-text-secondary))" }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing}
      {showChevron && onClick && !trailing && (
        <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "hsl(var(--m-text-tertiary))" }} />
      )}
    </div>
  );
};
