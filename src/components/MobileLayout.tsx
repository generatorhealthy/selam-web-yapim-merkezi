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
    { to: "/mobile/home", icon: Home, label: "Ana" },
    { to: "/mobile/search", icon: Search, label: "Keşfet" },
    { to: "/mobile/appointments", icon: Calendar, label: "Randevu" },
    { to: "/mobile/profile", icon: User, label: "Profil" },
  ];

  const specialistNavItems = [
    { to: "/mobile/dashboard", icon: LayoutDashboard, label: "Panel" },
    { to: "/mobile/specialist-appointments", icon: Calendar, label: "Randevu" },
    { to: "/mobile/specialist-clients", icon: FileText, label: "Danışan" },
    { to: "/mobile/specialist-profile", icon: User, label: "Profil" },
  ];

  const navItems = isSpecialist ? specialistNavItems : patientNavItems;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "hsl(var(--m-bg))" }}
    >
      <main className="flex-1 pb-[calc(96px+var(--m-safe-bottom))]">
        <Outlet />
      </main>

      {/* Floating black capsule tab bar — Zocdoc style */}
      <nav
        className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none"
        style={{ bottom: "calc(16px + var(--m-safe-bottom))" }}
      >
        <div
          className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-full"
          style={{
            background: "hsl(var(--m-ink))",
            boxShadow: "0 16px 40px -12px hsl(220 30% 10% / 0.35), 0 4px 8px -2px hsl(220 30% 10% / 0.15)",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center justify-center rounded-full m-pressable transition-all duration-200 ${
                    isActive
                      ? "w-14 h-12 px-4"
                      : "w-12 h-12"
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? "hsl(var(--m-bg))" : "transparent",
                  color: isActive ? "hsl(var(--m-ink))" : "hsl(var(--m-bg) / 0.6)",
                })}
                aria-label={item.label}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={2.2} />
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
