
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <HorizontalNavigation />
      <div className="flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-3">Sayfa Bulunamadı</h2>
          <p className="text-muted-foreground mb-6">
            Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı olabilir.
          </p>
          <a
            href="/"
            className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow hover:opacity-90 transition-opacity"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
