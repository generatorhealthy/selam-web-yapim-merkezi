import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title?: string;
  largeTitle?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
  sticky?: boolean;
}

/**
 * Apple Health-style mobile header.
 * - Tiny static title (when sticky)
 * - Big "largeTitle" inline below
 */
export const MobileHeader = ({
  title,
  largeTitle,
  subtitle,
  showBack = false,
  onBack,
  trailing,
  sticky = true,
}: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header
      className={`${sticky ? "sticky top-0 z-30 m-glass" : ""} m-safe-top`}
      style={{ borderBottom: sticky ? "1px solid hsl(var(--m-divider))" : undefined }}
    >
      {/* Top bar */}
      <div className="h-11 px-4 flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          {showBack && (
            <button
              onClick={() => (onBack ? onBack() : navigate(-1))}
              className="-ml-2 p-2 rounded-full m-pressable"
              aria-label="Geri"
            >
              <ChevronLeft className="w-6 h-6" style={{ color: "hsl(var(--m-accent))" }} />
            </button>
          )}
          {title && (
            <span
              className="text-[15px] font-semibold truncate"
              style={{ color: "hsl(var(--m-text-primary))" }}
            >
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">{trailing}</div>
      </div>

      {/* Large title */}
      {largeTitle && (
        <div className="px-5 pt-1 pb-3">
          <h1 className="m-headline">{largeTitle}</h1>
          {subtitle && (
            <p
              className="mt-1 text-[15px]"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
};
