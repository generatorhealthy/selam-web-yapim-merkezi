import { Outlet, NavLink } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useMobileActivityTracker } from "@/hooks/useMobileActivityTracker";

// Map each tab route to its lazy import so we can prefetch on touch/hover.
const ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  "/mobile/home": () => import("@/pages/mobile/MobileHome"),
  "/mobile/search": () => import("@/pages/mobile/MobileSearch"),
  "/mobile/appointments": () => import("@/pages/mobile/MobileAppointments"),
  "/mobile/profile": () => import("@/pages/mobile/MobileProfile"),
  "/mobile/dashboard": () => import("@/pages/mobile/MobileDashboard"),
  "/mobile/specialist-appointments": () => import("@/pages/mobile/MobileSpecialistAppointments"),
  "/mobile/specialist-clients": () => import("@/pages/mobile/MobileSpecialistClients"),
  "/mobile/specialist-profile": () => import("@/pages/mobile/MobileSpecialistProfile"),
};

const prefetched = new Set<string>();
const prefetch = (to: string) => {
  if (prefetched.has(to)) return;
  prefetched.add(to);
  ROUTE_PREFETCH[to]?.().catch(() => prefetched.delete(to));
};

// === Filled (solid) icons — premium iOS / referans görsel stili ===
type IconProps = { active?: boolean; className?: string };

const HomeFill = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M11.3 2.6 3.5 8.7A2.5 2.5 0 0 0 2.5 10.7V19a2.5 2.5 0 0 0 2.5 2.5h3a1 1 0 0 0 1-1V16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4.5a1 1 0 0 0 1 1h3A2.5 2.5 0 0 0 21.5 19v-8.3a2.5 2.5 0 0 0-1-2L12.7 2.6a1.2 1.2 0 0 0-1.4 0Z" />
  </svg>
);

const GridFill = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="2.2" />
    <rect x="13" y="3" width="8" height="8" rx="2.2" />
    <rect x="3" y="13" width="8" height="8" rx="2.2" />
    <rect x="13" y="13" width="8" height="8" rx="2.2" />
  </svg>
);

const CalendarFill = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M7 2.5a1 1 0 0 1 1 1V5h8V3.5a1 1 0 1 1 2 0V5h.5A2.5 2.5 0 0 1 21 7.5V9H3V7.5A2.5 2.5 0 0 1 5.5 5H6V3.5a1 1 0 0 1 1-1Z" />
    <path d="M3 10.5h18v8A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-8Z" />
  </svg>
);

const UserFill = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
  </svg>
);

const FileFill = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M6 2.5A2.5 2.5 0 0 0 3.5 5v14A2.5 2.5 0 0 0 6 21.5h12A2.5 2.5 0 0 0 20.5 19V9.4a1 1 0 0 0-.3-.7l-5.9-5.9a1 1 0 0 0-.7-.3H6Zm7 1.7 5.8 5.8H14a1 1 0 0 1-1-1V4.2Z" />
  </svg>
);

const DashboardFill = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <rect x="3" y="3" width="8" height="11" rx="2.2" />
    <rect x="13" y="3" width="8" height="6" rx="2.2" />
    <rect x="13" y="11" width="8" height="10" rx="2.2" />
    <rect x="3" y="16" width="8" height="5" rx="2.2" />
  </svg>
);

export const MobileLayout = () => {
  const { userProfile } = useUserRole();
  const isSpecialist =
    userProfile?.role === "specialist" ||
    userProfile?.role === "admin" ||
    userProfile?.role === "staff";
  const isPatient = userProfile?.role === "patient";

  const guestNavItems = [
    { to: "/mobile/home", Icon: HomeFill, label: "Anasayfa" },
    { to: "/mobile/search", Icon: GridFill, label: "Keşfet" },
    { to: "/mobile/appointments", Icon: CalendarFill, label: "Randevu" },
    { to: "/mobile/profile", Icon: UserFill, label: "Profil" },
  ];

  const patientNavItems = [
    { to: "/mobile/home", Icon: HomeFill, label: "Anasayfa" },
    { to: "/mobile/search", Icon: GridFill, label: "Keşfet" },
    { to: "/mobile/patient-dashboard", Icon: DashboardFill, label: "Panelim" },
    { to: "/mobile/patient-profile", Icon: UserFill, label: "Profil" },
  ];

  const specialistNavItems = [
    { to: "/mobile/home", Icon: HomeFill, label: "Anasayfa" },
    { to: "/mobile/dashboard", Icon: DashboardFill, label: "Panel" },
    { to: "/mobile/specialist-appointments", Icon: CalendarFill, label: "Randevu" },
    { to: "/mobile/specialist-clients", Icon: FileFill, label: "Danışan" },
    { to: "/mobile/specialist-profile", Icon: UserFill, label: "Profil" },
  ];

  const navItems = isSpecialist ? specialistNavItems : isPatient ? patientNavItems : guestNavItems;

  return (
    <div
      className="relative flex flex-col overflow-x-hidden w-full max-w-full"
      style={{
        background: "hsl(var(--m-bg))",
        height: "100dvh",
        maxHeight: "100dvh",
      }}
    >
      {/* Scroll container — tab bar her zaman ekranın altında sabit kalır */}
      <main
        className="flex-1 min-h-0 w-full max-w-full overflow-y-auto overflow-x-hidden"
        style={{
          paddingBottom: "calc(96px + var(--m-safe-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Outlet />
      </main>

      {/* Floating WHITE capsule tab bar — her zaman ekranın altında sabit */}
      <nav
        className="absolute left-0 right-0 z-40 flex justify-center pointer-events-none"
        style={{ bottom: "calc(16px + var(--m-safe-bottom))" }}
      >
        <div
          className="pointer-events-auto flex items-center gap-2 px-3 py-2.5 rounded-full"
          style={{
            background: "hsl(var(--m-surface))",
            boxShadow:
              "0 18px 44px -14px hsl(220 30% 15% / 0.25), 0 4px 12px -2px hsl(220 30% 15% / 0.10)",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onPointerEnter={() => prefetch(item.to)}
                onTouchStart={() => prefetch(item.to)}
                onFocus={() => prefetch(item.to)}
                aria-label={item.label}
                className="relative flex items-center justify-center h-12 rounded-full m-pressable transition-all duration-300 ease-out overflow-hidden"
                style={({ isActive }) => ({
                  background: isActive ? "hsl(var(--m-ink))" : "transparent",
                  color: isActive ? "hsl(var(--m-bg))" : "hsl(220 8% 65%)",
                  paddingLeft: isActive ? 16 : 12,
                  paddingRight: isActive ? 18 : 12,
                  gap: isActive ? 8 : 0,
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      active={isActive}
                      className={isActive ? "w-[22px] h-[22px] shrink-0" : "w-[24px] h-[24px] shrink-0"}
                    />
                    {isActive && (
                      <span className="text-[14px] font-semibold whitespace-nowrap">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
