import dokiLogo from "@/assets/doki-logo.png";

const DokiIcon = ({ className = "w-6 h-6" }: { className?: string; color?: string }) => (
  <img src={dokiLogo} alt="Doki" className={`${className} rounded-full object-cover`} />
);

export default DokiIcon;
