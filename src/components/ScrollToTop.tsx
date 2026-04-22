import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route değiştiğinde sayfayı en üste kaydırır.
 * Native mobil uygulamada bottom-nav ile sekmeler arası geçişte
 * eski scroll pozisyonunun yeni sayfaya taşınmasını engeller.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
