const DokiIcon = ({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Doktorum Ol asterisk/cross logo icon */}
    <path
      d="M50 5 L50 42 L50 5Z"
      stroke={color}
      strokeWidth="0"
    />
    {/* Center vertical bar */}
    <rect x="42" y="5" width="16" height="35" rx="3" fill={color} />
    {/* Bottom vertical bar */}
    <rect x="42" y="60" width="16" height="35" rx="3" fill={color} />
    {/* Left horizontal bar */}
    <rect x="5" y="42" width="35" height="16" rx="3" fill={color} />
    {/* Right horizontal bar */}
    <rect x="60" y="42" width="35" height="16" rx="3" fill={color} />
    {/* Top-left diagonal */}
    <rect x="10" y="10" width="16" height="32" rx="3" fill={color} transform="rotate(-45 26 26)" />
    {/* Top-right diagonal */}
    <rect x="74" y="10" width="16" height="32" rx="3" fill={color} transform="rotate(45 74 26)" />
    {/* Bottom-left diagonal */}
    <rect x="10" y="74" width="16" height="32" rx="3" fill={color} transform="rotate(45 26 74)" />
    {/* Bottom-right diagonal */}
    <rect x="74" y="74" width="16" height="32" rx="3" fill={color} transform="rotate(-45 74 74)" />
  </svg>
);

export default DokiIcon;
