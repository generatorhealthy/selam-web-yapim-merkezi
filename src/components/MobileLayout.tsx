import { Outlet } from "react-router-dom";
import { Home, Search, Calendar, User, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export const MobileLayout = () => {
  const { userProfile } = useUserRole();
  const isSpecialist = userProfile?.role === 'specialist' || userProfile?.role === 'admin' || userProfile?.role === 'staff';

  const patientNavItems = [
    { to: "/mobile/home", icon: Home, label: "Ana Sayfa" },
    { to: "/mobile/search", icon: Search, label: "Uzmanlar" },
    { to: "/mobile/appointments", icon: Calendar, label: "Randevular" },
    { to: "/mobile/profile", icon: User, label: "Profil" },
  ];

  const specialistNavItems = [
    { to: "/mobile/dashboard", icon: LayoutDashboard, label: "Panel" },
    { to: "/mobile/appointments", icon: Calendar, label: "Randevular" },
    { to: "/mobile/profile", icon: User, label: "Profil" },
  ];

  const navItems = isSpecialist ? specialistNavItems : patientNavItems;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
