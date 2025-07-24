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
    { name: "Kullanıcılar", icon: Users, path: "/divan_paneli/user-management" },
    { name: "Siparişler", icon: ShoppingCart, path: "/divan_paneli/order-management" },
    { name: "Ödemeler", icon: CreditCard, path: "/divan_paneli/payment-management" },
    { name: "Randevular", icon: Calendar, path: "/divan_paneli/appointment-management" },
    { name: "Yorumlar", icon: MessageSquare, path: "/divan_paneli/review-management" },
    { name: "Blog", icon: FileText, path: "/divan_paneli/blog-management" },
    { name: "Raporlar", icon: BarChart3, path: "/divan_paneli/reports" },
    { name: "Güvenlik", icon: Shield, path: "/divan_paneli/dashboard" },
    { name: "Uzmanlar", icon: UserPlus, path: "/divan_paneli/specialist-management" }
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
                <span key={module.name}>
                  <Link to={module.path} className="text-primary/80 hover:text-primary transition-colors">
                    {module.name}
                  </Link>
                  {index < 5 && <span className="text-primary/60 ml-2">•</span>}
                </span>
              ))}
              <span className="text-primary/60 ml-2">+{modules.length - 6} daha</span>
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