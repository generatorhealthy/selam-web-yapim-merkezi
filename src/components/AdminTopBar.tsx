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

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to="/divan_paneli/dashboard">
            <Button variant="outline" size="sm" className="bg-primary/10 hover:bg-primary/20 border-primary/30">
              <Settings className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
          
          <div className="text-xs text-primary/70 font-medium">
            {userRole === 'admin' ? 'Yönetici' : userRole === 'staff' ? 'Personel' : 'Hukuk'} Paneli
          </div>
        </div>
      </div>
    </div>
  );
}