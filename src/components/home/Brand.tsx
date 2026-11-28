import { Link } from "react-router-dom";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link to="/" aria-label="Doktorum Ol ana sayfa" className={`inline-flex items-center ${className}`}>
      <img src="/logo.webp" alt="Doktorum Ol" width="412" height="98" className="h-auto w-[168px] md:w-[184px]" loading="eager" />
    </Link>
  );
}
