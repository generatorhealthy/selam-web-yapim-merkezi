const DokiIcon = ({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" fill={color} className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Doktorum Ol 8-pointed asterisk logo */}
    <path d="M11 1h2v8.5h-2V1Z" />
    <path d="M11 14.5h2V23h-2v-8.5Z" />
    <path d="M1 11v2h8.5v-2H1Z" />
    <path d="M14.5 11v2H23v-2h-8.5Z" />
    <path d="M4.93 3.51l1.41-1.41 6.01 6.01-1.41 1.42-6.01-6.02Z" />
    <path d="M13.06 11.64l1.41-1.41 6.01 6.01-1.41 1.42-6.01-6.02Z" />
    <path d="M3.52 19.07l-1.41-1.41 6.01-6.02 1.42 1.42-6.02 6.01Z" />
    <path d="M11.65 10.94l-1.42-1.41 6.02-6.02 1.41 1.42-6.01 6.01Z" />
  </svg>
);

export default DokiIcon;
