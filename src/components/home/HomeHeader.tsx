import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Brand } from "./Brand";

const items = [
  { to: "/", label: "Anasayfa" },
  { to: "/uzmanlar", label: "Uzmanlar" },
  { to: "/kayit-linki", label: "Fiyatlandırma" },
  { to: "/blog", label: "Blog" },
  { to: "/iletisim", label: "İletişim" },
];

export default function HomeHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-home-line bg-background/95 backdrop-blur-xl">
      <div className="home-container flex h-[76px] items-center justify-between gap-4">
        <Brand />
        <nav aria-label="Ana menü" className="hidden items-center gap-1.5 lg:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `home-nav-link ${isActive ? "home-nav-link-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 sm:flex">
          <Link to="/uye-ol" className="home-button home-button-outline home-button-small">Üye Ol</Link>
          <Link to="/giris-yap" className="home-button home-button-primary home-button-small">Giriş Yap</Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Link to="/giris-yap" className="home-button home-button-primary home-button-small sm:hidden">Giriş Yap</Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-home-line text-home-ink"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-76px)] overflow-y-auto bg-background px-5 py-6 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobil menü">
          <nav className="mx-auto flex max-w-md flex-col gap-2" aria-label="Mobil ana menü">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `rounded-2xl px-5 py-4 text-lg font-semibold ${isActive ? "bg-home-blue text-home-brand" : "text-home-ink"}`}
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/uye-ol" onClick={() => setOpen(false)} className="home-button home-button-outline mt-4 w-full">Üye Ol</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
