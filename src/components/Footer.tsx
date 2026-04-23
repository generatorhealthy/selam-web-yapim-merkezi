
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

        </div>
      </div>

      {/* Medical Disclaimer (Apple guideline 1.4.1) */}
      <div className="bg-amber-50 border-t border-amber-200">
        <div className="container mx-auto px-4 py-3">
          <p className="text-xs text-amber-900 text-center leading-relaxed">
            ⚕️ <strong>Tıbbi Uyarı:</strong> Bu sitedeki bilgiler genel bilgilendirme amaçlıdır ve hekim tavsiyesi yerine geçmez.
            Tanı, tedavi ve sağlığınızla ilgili her karar için mutlaka bir doktora danışın. Acil durumlarda 112'yi arayın.
          </p>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 mb-2">
            <span>Doktorum Ol Yorumları</span>
            <span className="text-gray-400">|</span>
            <span>Doktorum Ol Güvenilir mi?</span>
            <span className="text-gray-400">|</span>
            <span>Doktorum Ol Şikayet</span>
          </div>
          <div className="text-center text-sm text-gray-600 font-medium">
            Doktorumol.com.tr © Copyright 2025. Tüm Hakları saklıdır.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
