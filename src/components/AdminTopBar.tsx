import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Settings, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Calendar, 
  MessageSquare,
  FileText,
  BarChart3,
  Shield,
  UserPlus
} from "lucide-react";

interface AdminTopBarProps {
  userRole: string | null;
}

export function AdminTopBar({ userRole }: AdminTopBarProps) {
  // Sadece admin ve staff için göster
  if (!userRole || (userRole !== 'admin' && userRole !== 'staff' && userRole !== 'legal')) {
    return null;
  }

  const modules = [
    { name: "Kullanıcılar", icon: Users },
    { name: "Siparişler", icon: ShoppingCart },
    { name: "Ödemeler", icon: CreditCard },
    { name: "Randevular", icon: Calendar },
    { name: "Yorumlar", icon: MessageSquare },
    { name: "Blog", icon: FileText },
    { name: "Raporlar", icon: BarChart3 },
    { name: "Güvenlik", icon: Shield },
    { name: "Uzmanlar", icon: UserPlus }
  ];

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/divan_paneli/dashboard">
              <Button variant="outline" size="sm" className="bg-primary/10 hover:bg-primary/20 border-primary/30">
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
            
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Modüller:</span>
              {modules.slice(0, 6).map((module, index) => (
                <span key={module.name} className="text-primary/80">
                  {module.name}
                  {index < 5 && " •"}
                </span>
              ))}
              <span className="text-primary/60">+{modules.length - 6} daha</span>
            </div>
          </div>
          
          <div className="text-xs text-primary/70 font-medium">
            {userRole === 'admin' ? 'Yönetici' : userRole === 'staff' ? 'Personel' : 'Hukuk'} Paneli
          </div>
        </div>
      </div>
    </div>
  );
}