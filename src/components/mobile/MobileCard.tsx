import { ReactNode, MouseEventHandler } from "react";
import { ChevronRight } from "lucide-react";

interface MobileCardProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  showChevron?: boolean;
  variant?: "elevated" | "flat";
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const padMap = { none: "", sm: "p-3", md: "p-4", lg: "p-5" };

export const MobileCard = ({
  children,
  onClick,
  showChevron = false,
  variant = "elevated",
  className = "",
  padding = "md",
}: MobileCardProps) => {
  const isPressable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`${variant === "elevated" ? "m-card" : "m-card-flat"} ${
        padMap[padding]
      } ${isPressable ? "m-pressable cursor-pointer" : ""} ${className}`}
    >
      {showChevron ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">{children}</div>
          <ChevronRight
            className="w-5 h-5 shrink-0"
            style={{ color: "hsl(var(--m-text-tertiary))" }}
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
};
