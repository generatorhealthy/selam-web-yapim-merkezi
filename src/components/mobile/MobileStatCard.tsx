import { LucideIcon } from "lucide-react";

interface MobileStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  tone?: "accent" | "success" | "warning" | "danger" | "info" | "purple" | "pink" | "teal";
  onClick?: () => void;
}

const toneMap: Record<NonNullable<MobileStatCardProps["tone"]>, { fg: string; bg: string }> = {
  accent: { fg: "hsl(var(--m-accent))", bg: "hsl(var(--m-accent-soft))" },
  success: { fg: "hsl(var(--m-success))", bg: "hsl(var(--m-success-soft))" },
  warning: { fg: "hsl(var(--m-warning))", bg: "hsl(var(--m-warning-soft))" },
  danger: { fg: "hsl(var(--m-danger))", bg: "hsl(var(--m-danger-soft))" },
  info: { fg: "hsl(var(--m-info))", bg: "hsl(var(--m-info-soft))" },
  purple: { fg: "hsl(var(--m-purple))", bg: "hsl(var(--m-purple-soft))" },
  pink: { fg: "hsl(var(--m-pink))", bg: "hsl(var(--m-pink-soft))" },
  teal: { fg: "hsl(var(--m-teal))", bg: "hsl(var(--m-teal-soft))" },
};

export const MobileStatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  tone = "accent",
  onClick,
}: MobileStatCardProps) => {
  const c = toneMap[tone];
  return (
    <div
      onClick={onClick}
      className={`m-card p-4 ${onClick ? "m-pressable cursor-pointer" : ""}`}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
        style={{ background: c.bg }}
      >
        <Icon className="w-5 h-5" style={{ color: c.fg }} />
      </div>
      <div
        className="text-[13px] font-semibold uppercase tracking-wide"
        style={{ color: "hsl(var(--m-text-secondary))" }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-[28px] font-bold leading-none tabular-nums"
        style={{ color: "hsl(var(--m-text-primary))" }}
      >
        {value}
      </div>
      {trend && (
        <div className="mt-1 text-[13px]" style={{ color: c.fg }}>
          {trend}
        </div>
      )}
    </div>
  );
};
