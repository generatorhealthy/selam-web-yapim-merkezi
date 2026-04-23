import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { LogOut, Calendar, Brain, Bell, LogIn, ChevronRight, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const deleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.functions.invoke("delete-user-account", {
        body: { user_id: session.user.id },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: "Hesabınız silindi", description: "Tüm verileriniz kaldırıldı." });
      navigate("/mobile/home");
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "Hesap silinemedi", variant: "destructive" });
    }
  };

  const initial = (userProfile?.name || user?.email || "?").charAt(0).toUpperCase();

  const menuItems = [
    { icon: Calendar, label: "Randevularım", onClick: () => navigate("/mobile/appointments") },
    { icon: Brain, label: "Testler", onClick: () => navigate("/mobile/patient-tests") },
    { icon: Bell, label: "Bildirimler", onClick: () => toast({ title: "Yakında" }) },
  ];

  // Misafir → sadece giriş yap ekranı
  if (!user) {
    return (
      <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh" }}>
        <MobileHeader largeTitle="Profil" />
        <div className="px-6 pt-8 flex flex-col items-center text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: "hsl(var(--m-tint-sand))" }}
          >
            <LogIn className="w-10 h-10" style={{ color: "hsl(var(--m-ink))" }} />
          </div>
          <h2
            className="text-[24px] font-bold mb-2"
            style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}
          >
            Hesabınıza giriş yapın
          </h2>
          <p
            className="text-[14px] mb-8 max-w-[300px]"
            style={{ color: "hsl(var(--m-text-secondary))" }}
          >
            Randevularınızı, testlerinizi ve favori uzmanlarınızı tek bir yerden yönetin.
          </p>
          <button
            onClick={() => navigate("/mobile/login")}
            className="w-full h-14 rounded-full font-bold flex items-center justify-center gap-2 m-pressable"
            style={{ background: "hsl(var(--m-ink))", color: "hsl(var(--m-bg))" }}
          >
            <LogIn className="w-5 h-5" /> Giriş Yap
          </button>
          <button
            onClick={() => navigate("/mobile/signup")}
            className="w-full h-14 rounded-full font-semibold mt-3 m-pressable"
            style={{
              background: "hsl(var(--m-surface))",
              color: "hsl(var(--m-text-primary))",
              border: "1px solid hsl(var(--m-divider))",
            }}
          >
            Hesap Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 40 }}>
      <MobileHeader largeTitle="Profil" />

      {/* Hero profile card */}
      <div className="px-5 mb-6">
        <div
          className="rounded-[28px] p-6"
          style={{ background: "hsl(var(--m-tint-sand))" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--m-surface))" }}
            >
              <span className="text-[32px] font-bold" style={{ color: "hsl(var(--m-ink))" }}>{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-[20px] truncate" style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}>
                {userProfile?.name || "Kullanıcı"}
              </h2>
              <p className="text-[13px] truncate mt-0.5" style={{ color: "hsl(var(--m-text-secondary))" }}>
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mb-7 grid grid-cols-2 gap-3">
        <div className="rounded-[22px] p-5" style={{ background: "hsl(var(--m-tint-mint))" }}>
          <div className="text-[12px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>Yaklaşan</div>
          <div className="text-[32px] font-bold mt-1" style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}>
            {stats.upcoming}
          </div>
        </div>
        <div className="rounded-[22px] p-5" style={{ background: "hsl(var(--m-tint-lilac))" }}>
          <div className="text-[12px] font-medium" style={{ color: "hsl(var(--m-text-secondary))" }}>Toplam</div>
          <div className="text-[32px] font-bold mt-1" style={{ color: "hsl(var(--m-text-primary))", letterSpacing: "-0.02em" }}>
            {stats.total}
          </div>
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="rounded-[22px] overflow-hidden" style={{ background: "hsl(var(--m-surface))", boxShadow: "var(--m-shadow)" }}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-4 px-5 py-4 m-pressable text-left"
                style={{ borderTop: i > 0 ? "1px solid hsl(var(--m-divider))" : undefined }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--m-surface-muted))" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "hsl(var(--m-ink))" }} />
                </div>
                <span className="flex-1 text-[15px] font-semibold" style={{ color: "hsl(var(--m-text-primary))" }}>
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5" style={{ color: "hsl(var(--m-text-tertiary))" }} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 space-y-3">
        <button
          onClick={logout}
          className="w-full h-14 rounded-full font-bold flex items-center justify-center gap-2 m-pressable"
          style={{ background: "hsl(var(--m-danger-soft))", color: "hsl(var(--m-danger))" }}
        >
          <LogOut className="w-5 h-5" /> Çıkış Yap
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full h-12 rounded-full font-semibold flex items-center justify-center gap-2 m-pressable"
              style={{ background: "transparent", color: "hsl(var(--m-danger))", border: "1px solid hsl(var(--m-danger) / 0.3)" }}
            >
              <Trash2 className="w-4 h-4" /> Hesabımı Sil
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hesabınızı silmek istediğinize emin misiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground">
                Evet, sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-[11px] text-center mt-4 leading-relaxed" style={{ color: "hsl(var(--m-text-tertiary))" }}>
          ⚕️ Bu uygulama tıbbi tavsiye yerine geçmez. Sağlığınızla ilgili kararlar için mutlaka doktorunuza danışın.
        </p>
      </div>
    </div>
  );
}
