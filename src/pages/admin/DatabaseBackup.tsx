import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { DatabaseBackupCard } from "@/components/DatabaseBackupCard";
import { useUserRole } from "@/hooks/useUserRole";
import { Scale, Loader2 } from "lucide-react";

const DatabaseBackup = () => {
  const { userProfile, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-blue-100/50">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yükleniyor...</h2>
          <p className="text-gray-600">Panel bilgileri alınıyor</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin' || !userProfile.is_approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-red-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Veritabanı Yedekleme - Divan Paneli</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <HorizontalNavigation />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <AdminBackButton />
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Veritabanı Yedekleme
            </h1>
            <p className="text-muted-foreground text-lg">
              Sistem verilerinizi yedekleyin ve geri yükleyin
            </p>
          </div>

          <DatabaseBackupCard />
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default DatabaseBackup;
