import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PANEL_ROLES, useUserRole } from "@/hooks/useUserRole";

const AdminRouteGuard = () => {
  const location = useLocation();
  const { userProfile, loading, error, retry } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p>Panel bilgileri alınıyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-destructive" />
          <h1 className="mb-2 text-xl font-semibold text-foreground">Bağlantı kurulamadı</h1>
          <p className="mb-5 text-sm text-muted-foreground">Yetki bilgileriniz geçici olarak alınamadı. Oturumunuz kapatılmadı.</p>
          <Button onClick={retry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/divan_paneli" replace state={{ from: location.pathname }} />;
  }

  if (!userProfile.is_approved || !PANEL_ROLES.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRouteGuard;