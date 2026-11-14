import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { UserCheck, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientReferrals from "./ClientReferrals";
import MetaLeads from "./MetaLeads";
import ClientCalendar from "./ClientCalendar";

const TABS = [
  { key: "yonlendirme", label: "Danışan Yönlendirme", icon: UserCheck, Page: ClientReferrals },
  { key: "sistem", label: "Danışan Yönlendirme Sistemi", icon: Users, Page: MetaLeads },
  { key: "takvim", label: "Danışan Takvimi", icon: Calendar, Page: ClientCalendar },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ClientCenter = () => {
  const [params, setParams] = useSearchParams();
  const initial = (TABS.find((t) => t.key === params.get("sekme"))?.key ?? "yonlendirme") as TabKey;
  const [active, setActive] = useState<TabKey>(initial);
  // Opened tabs stay mounted so switching back keeps filters, scroll and loaded data.
  const [opened, setOpened] = useState<TabKey[]>([initial]);

  const select = (key: TabKey) => {
    setActive(key);
    setOpened((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setParams({ sekme: key }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Danışan Merkezi - Divan Paneli</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <h1 className="mb-3 text-xl font-bold text-foreground">Danışan Merkezi</h1>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TABS.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={active === key ? "default" : "outline"}
                className="h-12 justify-center gap-2 text-sm font-semibold"
                onClick={() => select(key)}
                aria-pressed={active === key}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
      {TABS.map(({ key, Page }) =>
        opened.includes(key) ? (
          <div key={key} hidden={active !== key}>
            <Page />
          </div>
        ) : null,
      )}
    </div>
  );
};

export default ClientCenter;
