import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title?: string;
  largeTitle?: string;
  subtitle?: string;
  showBack?: boolean;
  showForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  trailing?: ReactNode;
  sticky?: boolean;
}

/**
 * Premium Zocdoc-style mobile header.
 * - Round circular back button on solid surface
 * - Generous large title with tight tracking
 */
export const MobileHeader = ({
  title,
  largeTitle,
  subtitle,
  showBack = false,
  showForward = true,
  onBack,
  onForward,
  trailing,
  sticky = true,
}: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header
      className={`${sticky ? "sticky top-0 z-30" : ""} m-safe-top`}
      style={{ background: "hsl(var(--m-bg))" }}
    >
      {/* Top bar */}
      <div className="h-14 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => (onBack ? onBack() : navigate(-1))}
              className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
              style={{
                background: "hsl(var(--m-surface))",
                boxShadow: "var(--m-shadow)",
              }}
              aria-label="Geri"
            >
              <ChevronLeft
                className="w-5 h-5"
                strokeWidth={2.4}
                style={{ color: "hsl(var(--m-ink))" }}
              />
            </button>
          )}
          {showBack && showForward && (
            <button
              onClick={() => (onForward ? onForward() : navigate(1))}
              className="w-10 h-10 rounded-full flex items-center justify-center m-pressable"
              style={{
                background: "hsl(var(--m-surface))",
                boxShadow: "var(--m-shadow)",
              }}
              aria-label="İleri"
            >
              <ChevronRight
                className="w-5 h-5"
                strokeWidth={2.4}
                style={{ color: "hsl(var(--m-ink))" }}
              />
            </button>
          )}
          {title && !largeTitle && (
            <span
              className="text-[17px] font-bold truncate ml-1"
              style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.01em" }}
            >
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">{trailing}</div>
      </div>

      {/* Large title */}
      {largeTitle && (
        <div className="px-5 pt-2 pb-5">
          {title && (
            <div
              className="text-[15px] font-medium mb-1"
              style={{ color: "hsl(var(--m-text-secondary))" }}
            >
              {title}
            </div>
          )}
          <h1 className="m-headline">{largeTitle}</h1>
          {subtitle && (
            <p
              className="mt-2 text-[15px]"
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
