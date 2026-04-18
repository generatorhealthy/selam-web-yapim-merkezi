import { Outlet, NavLink } from "react-router-dom";
import { Home, Search, Calendar, User, LayoutDashboard, FileText } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export const MobileLayout = () => {
  const { userProfile } = useUserRole();
  const isSpecialist =
    userProfile?.role === "specialist" ||
    userProfile?.role === "admin" ||
    userProfile?.role === "staff";

  const patientNavItems = [
    { to: "/mobile/home", icon: Home, label: "Özet" },
    { to: "/mobile/search", icon: Search, label: "Keşfet" },
    { to: "/mobile/appointments", icon: Calendar, label: "Randevu" },
    { to: "/mobile/profile", icon: User, label: "Profil" },
  ];

  const specialistNavItems = [
    { to: "/mobile/dashboard", icon: LayoutDashboard, label: "Panel" },
    { to: "/mobile/appointments", icon: Calendar, label: "Randevu" },
    { to: "/mobile/clients", icon: FileText, label: "Danışan" },
    { to: "/mobile/profile", icon: User, label: "Profil" },
  ];

  const navItems = isSpecialist ? specialistNavItems : patientNavItems;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "hsl(var(--m-bg))" }}
    >
      <main className="flex-1 pb-[calc(72px+var(--m-safe-bottom))]">
        <Outlet />
      </main>

      {/* Apple Health style glass tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 m-glass"
        style={{ borderTop: "1px solid hsl(var(--m-divider))" }}
      >
        <div
          className="flex items-stretch justify-around px-2 pt-1.5"
          style={{ paddingBottom: "calc(8px + var(--m-safe-bottom))" }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 min-w-0 py-1 gap-0.5 m-pressable ${
                    isActive ? "" : "opacity-60"
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive
                    ? "hsl(var(--m-accent))"
                    : "hsl(var(--m-text-secondary))",
                })}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={2.2} />
                <span className="text-[10px] font-semibold tracking-tight">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
