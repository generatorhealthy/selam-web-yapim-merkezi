import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Calendar, Heart, FileText, User as UserIcon, LogOut, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientProfile {
  full_name: string | null;
  email: string | null;
  profile_picture: string | null;
}

export default function MobilePatientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState({ appointments: 0, favorites: 0, tests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        navigate("/mobile/login");
        return;
      }

      const [{ data: prof }, { count: aCount }, { count: fCount }, { count: tCount }] = await Promise.all([
        supabase.from("patient_profiles").select("full_name,email,profile_picture").eq("user_id", user.id).maybeSingle(),
        supabase.from("appointments").select("id", { count: "exact", head: true }).or(`patient_user_id.eq.${user.id},patient_email.eq.${user.email}`),
        supabase.from("favorite_specialists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("test_results").select("id", { count: "exact", head: true }).or(`patient_user_id.eq.${user.id},patient_email.eq.${user.email}`),
      ]);

      setProfile(prof ?? { full_name: user.email, email: user.email ?? null, profile_picture: null });
      setStats({ appointments: aCount ?? 0, favorites: fCount ?? 0, tests: tCount ?? 0 });
      setLoading(false);
    })();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Çıkış yapıldı" });
    navigate("/mobile/login");
  };

  const menuItems = [
    { icon: Calendar, label: "Randevularım", desc: `${stats.appointments} randevu`, to: "/mobile/patient-appointments", color: "hsl(var(--m-accent))" },
    { icon: Heart, label: "Takip Ettiklerim", desc: `${stats.favorites} uzman`, to: "/mobile/patient-favorites", color: "hsl(355 78% 56%)" },
    { icon: FileText, label: "Test Sonuçlarım", desc: `${stats.tests} test`, to: "/mobile/patient-tests", color: "hsl(160 70% 45%)" },
    { icon: UserIcon, label: "Profil Bilgilerim", desc: "Düzenle", to: "/mobile/patient-profile", color: "hsl(35 90% 55%)" },
  ];

  if (loading) return <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }} />;

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader largeTitle={`Hoşgeldin${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} subtitle="Sağlığınız bizim için önemli" />

      <div className="px-5 mt-4 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="w-full m-card p-4 flex items-center gap-4 m-pressable"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
              <item.icon className="w-6 h-6" style={{ color: item.color }} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[15px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>{item.label}</div>
              <div className="text-[12px] mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>{item.desc}</div>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: "hsl(var(--m-text-secondary))" }} />
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full m-card p-4 flex items-center gap-4 m-pressable mt-6"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "hsl(0 0% 92%)" }}>
            <LogOut className="w-6 h-6" style={{ color: "hsl(0 75% 50%)" }} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[15px] font-semibold" style={{ color: "hsl(0 75% 50%)" }}>Çıkış Yap</div>
          </div>
        </button>
      </div>
    </div>
  );
}
