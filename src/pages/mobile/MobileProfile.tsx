import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileSection } from "@/components/mobile/MobileSection";
import { MobileListRow } from "@/components/mobile/MobileListRow";
import {
  LogOut, Calendar, Brain, Bell, Shield, HelpCircle, FileText, LogIn,
} from "lucide-react";

export default function MobileProfile() {
  const navigate = useNavigate();
  const { userProfile } = useUserRole();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, upcoming: 0 });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user?.email) {
        const { data } = await supabase
          .from("appointments")
          .select("appointment_date, status")
          .eq("patient_email", session.user.email);
        const today = new Date().toISOString().slice(0, 10);
        setStats({
          total: data?.length || 0,
          upcoming: data?.filter((a) => a.appointment_date >= today && a.status !== "cancelled").length || 0,
        });
      }
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Çıkış yapıldı" });
    navigate("/mobile/home");
  };

  const initial = (userProfile?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 100 }}>
      <MobileHeader largeTitle="Profil" />

      {/* Profile card */}
      <div className="px-5 mb-6">
        <div className="m-card p-5 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--m-accent-soft))" }}
          >
            <span className="text-2xl font-bold" style={{ color: "hsl(var(--m-accent))" }}>{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            {user ? (
              <>
                <h2 className="font-semibold text-[17px] truncate" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {userProfile?.name || "Kullanıcı"}
                </h2>
                <p className="text-[13px] truncate" style={{ color: "hsl(var(--m-text-secondary))" }}>
                  {user.email}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-[17px]" style={{ color: "hsl(var(--m-text-primary))" }}>Misafir</h2>
                <p className="text-[13px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Giriş yapmadınız</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {user && (
        <div className="px-5 mb-6 grid grid-cols-2 gap-3">
          <div className="m-card p-4">
            <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Yaklaşan</div>
            <div className="text-[28px] font-bold mt-1" style={{ color: "hsl(var(--m-accent))" }}>{stats.upcoming}</div>
          </div>
          <div className="m-card p-4">
            <div className="text-[12px]" style={{ color: "hsl(var(--m-text-secondary))" }}>Toplam Randevu</div>
            <div className="text-[28px] font-bold mt-1" style={{ color: "hsl(var(--m-text-primary))" }}>{stats.total}</div>
          </div>
        </div>
      )}

      <MobileSection label="Aktivitelerim" className="mb-6">
        <div className="m-card overflow-hidden">
          <MobileListRow icon={Calendar} title="Randevularım" onClick={() => navigate("/mobile/appointments")} />
          <MobileListRow icon={Brain} title="Testler" onClick={() => navigate("/mobile/tests")} />
        </div>
      </MobileSection>

      <MobileSection label="Ayarlar" className="mb-6">
        <div className="m-card overflow-hidden">
          <MobileListRow icon={Bell} title="Bildirimler" onClick={() => toast({ title: "Yakında" })} />
          <MobileListRow icon={Shield} title="Gizlilik" onClick={() => toast({ title: "Yakında" })} />
          <MobileListRow icon={FileText} title="Sözleşmeler" onClick={() => toast({ title: "Yakında" })} />
          <MobileListRow icon={HelpCircle} title="Yardım" onClick={() => toast({ title: "Yakında" })} />
        </div>
      </MobileSection>

      <div className="px-5">
        {user ? (
          <button
            onClick={logout}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable"
            style={{ background: "hsl(var(--m-danger-soft))", color: "hsl(var(--m-danger))" }}
          >
            <LogOut className="w-5 h-5" /> Çıkış Yap
          </button>
        ) : (
          <button
            onClick={() => navigate("/giris-yap")}
            className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 m-pressable"
            style={{ background: "hsl(var(--m-accent))", color: "white" }}
          >
            <LogIn className="w-5 h-5" /> Giriş Yap
          </button>
        )}
      </div>
    </div>
  );
}
