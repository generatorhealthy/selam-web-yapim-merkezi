import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, HelpCircle, Shield } from "lucide-react";
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
      title: "Hesap Bilgileri",
      icon: User,
      action: () => navigate("/mobile/account"),
    },
    {
      title: "Ayarlar",
      icon: Settings,
      action: () => navigate("/mobile/settings"),
    },
    {
      title: "Yardım & Destek",
      icon: HelpCircle,
      action: () => navigate("/mobile/help"),
    },
    {
      title: "Gizlilik Politikası",
      icon: Shield,
      action: () => navigate("/privacy"),
    },
  ];

  const userName = userProfile?.name || 'Kullanıcı';
  const userEmail = userProfile?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-12">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profil</h1>
        
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
            {userInitial}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {userName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {userEmail}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {userProfile?.role === 'specialist' ? 'Uzman' : 
               userProfile?.role === 'admin' ? 'Yönetici' : 'Danışan'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-6 pb-6">
        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={item.action}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                    index !== menuItems.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="flex-1 text-left text-foreground">{item.title}</span>
                  <span className="text-muted-foreground">›</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
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
