import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  User, 
  Settings, 
  HelpCircle, 
  Shield,
  Calendar,
  FileText,
  Bell,
  CreditCard,
  Heart,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MobileProfile() {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      toast({
        title: "Başarılı",
        description: "Çıkış yapıldı",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Çıkış yapılırken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      icon: Calendar,
      title: "Randevularım",
      subtitle: "Geçmiş ve gelecek randevular",
      action: () => navigate("/mobile/appointments"),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: FileText,
      title: "Test Sonuçlarım",
      subtitle: "Psikolojik değerlendirmeler",
      action: () => navigate("/mobile/tests"),
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Heart,
      title: "Favorilerim",
      subtitle: "Kaydettiğiniz uzmanlar",
      action: () => navigate("/mobile/favorites"),
      gradient: "from-red-500 to-rose-500",
    },
    {
      icon: Bell,
      title: "Bildirimler",
      subtitle: "Bildirim ayarları",
      action: () => navigate("/mobile/notifications"),
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: CreditCard,
      title: "Ödeme Yöntemleri",
      subtitle: "Kayıtlı kartlar ve işlemler",
      action: () => navigate("/mobile/payments"),
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const settingsItems = [
    {
      icon: User,
      title: "Hesap Bilgileri",
      action: () => navigate("/mobile/account"),
    },
    {
      icon: Settings,
      title: "Ayarlar",
      action: () => navigate("/mobile/settings"),
    },
    {
      icon: HelpCircle,
      title: "Yardım & Destek",
      action: () => navigate("/mobile/help"),
    },
    {
      icon: Shield,
      title: "Gizlilik Politikası",
      action: () => navigate("/privacy"),
    },
  ];

  const userName = userProfile?.name || 'Kullanıcı';
  const userEmail = userProfile?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = userProfile?.role === 'specialist' ? 'Uzman' : 
                  userProfile?.role === 'admin' ? 'Yönetici' : 'Danışan';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* User Profile Header with Gradient */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-b-[2rem] mb-6">
        <h1 className="text-2xl font-bold mb-6">Profil</h1>
        
        <div className="flex items-center gap-4">
          {/* Avatar with Gradient Border */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-[3px]">
              <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {userInitial}
                </span>
              </div>
            </div>
            {/* Status Badge */}
            <div className="absolute -bottom-1 -right-1 px-2 py-1 bg-green-500 rounded-full text-xs text-white font-medium shadow-lg">
              Aktif
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{userName}</h2>
            <p className="text-sm text-muted-foreground mb-2">{userEmail}</p>
            <div className="inline-block px-3 py-1 bg-primary/10 rounded-full">
              <p className="text-xs font-medium text-primary">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-20 space-y-6">
        {/* Main Menu Items */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
            HİZMETLER
          </h3>
          <div className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md overflow-hidden"
                  onClick={item.action}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-5`} />
                  <CardContent className="p-4 flex items-center gap-4 relative">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Settings Items */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
            AYARLAR
          </h3>
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {settingsItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title}>
                    <button
                      onClick={item.action}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                    {index < settingsItems.length - 1 && (
                      <div className="border-b mx-4" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Çıkış Yap
        </Button>

        {/* Version Info */}
        <p className="text-center text-xs text-muted-foreground">
          Versiyon 1.0.0
        </p>
      </div>
    </div>
  );
}