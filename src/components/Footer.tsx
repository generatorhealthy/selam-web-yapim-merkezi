
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="text-center space-y-3">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <Link to="/about" className="hover:text-blue-600 transition-colors">
              Hakkımızda
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">
              Gizlilik Sözleşmesi
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/visitor-consultant-agreement" className="hover:text-blue-600 transition-colors">
              Ziyaretçi-Danışan Sözleşmesi
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/disclosure-text" className="hover:text-blue-600 transition-colors">
              Aydınlatma Metni
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/comment-rules" className="hover:text-blue-600 transition-colors">
              Yorum Yayınlanma Kuralları
            </Link>
          </div>

          {/* Payment Methods */}
          <div className="flex justify-center items-center gap-2">
            <div className="flex items-center gap-2 bg-white rounded-md px-3 py-1 border border-gray-200">
              <img src="/lovable-uploads/034df0a6-00d8-4ba5-9843-e947f0337815.png" alt="Ödeme Yöntemleri" className="h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-2">
          <div className="text-center text-xs text-gray-600 space-y-1">
            <div>Doktorumol.com.tr © Copyright 2025. Tüm Hakları saklıdır.</div>
            <div>Kayıtlı Adres: Merkez Mahallesi, Cumhuriyet Caddesi No: 123/A, 34000 Fatih/İstanbul</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
