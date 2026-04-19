import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Heart, FileText, User as UserIcon, LogOut, Save, Star, Clock, Video, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

interface PatientProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  birth_date: string | null;
  gender: string | null;
  profile_picture: string | null;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        const user = s.session?.user;
        if (!user) {
          navigate("/danisan-giris");
          return;
        }

        const safe = async <T,>(p: Promise<{ data: T | null }>): Promise<T | null> => {
          try { const { data } = await p; return data; } catch (e) { console.error("Patient dashboard query failed:", e); return null; }
        };

        const [prof, apps, favs, tr] = await Promise.all([
          safe(supabase.from("patient_profiles").select("*").eq("user_id", user.id).maybeSingle() as any),
          safe(supabase.from("appointments")
            .select("id,appointment_date,appointment_time,appointment_type,status,consultation_topic,specialist_id")
            .or(`patient_user_id.eq.${user.id},patient_email.eq.${user.email}`)
            .order("appointment_date", { ascending: false }) as any),
          safe(supabase.from("favorite_specialists")
            .select("id,specialist_id")
            .eq("user_id", user.id) as any),
          safe(supabase.from("test_results")
            .select("id,created_at,status,test_id")
            .or(`patient_user_id.eq.${user.id},patient_email.eq.${user.email}`)
            .order("created_at", { ascending: false }) as any),
        ]);

        // Hydrate specialists for appointments + favorites
        const specIds = Array.from(new Set([
          ...((apps as any[] | null) ?? []).map((a) => a.specialist_id).filter(Boolean),
          ...((favs as any[] | null) ?? []).map((f) => f.specialist_id).filter(Boolean),
        ]));
        let specMap: Record<string, any> = {};
        if (specIds.length > 0) {
          const specs = await safe(supabase.from("public_specialists")
            .select("id,name,specialty,profile_picture,rating,city,slug")
            .in("id", specIds) as any);
          ((specs as any[] | null) ?? []).forEach((s: any) => { specMap[s.id] = s; });
        }

        // Hydrate test titles
        const testIds = Array.from(new Set(((tr as any[] | null) ?? []).map((t) => t.test_id).filter(Boolean)));
        let testMap: Record<string, any> = {};
        if (testIds.length > 0) {
          const tts = await safe(supabase.from("tests").select("id,title").in("id", testIds) as any);
          ((tts as any[] | null) ?? []).forEach((t: any) => { testMap[t.id] = t; });
        }

        setProfile((prof as any) ?? { user_id: user.id, email: user.email ?? null } as any);
        setAppointments(((apps as any[]) ?? []).map((a) => ({ ...a, specialists: specMap[a.specialist_id] })));
        setFavorites(((favs as any[]) ?? []).map((f) => ({ ...f, specialists: specMap[f.specialist_id] })));
        setTests(((tr as any[]) ?? []).map((t) => ({ ...t, tests: testMap[t.test_id] })));
      } catch (e) {
        console.error("Patient dashboard load error:", e);
        toast({ title: "Yükleme hatası", description: "Panel yüklenirken bir sorun oluştu", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, toast]);

  const updateField = (k: keyof PatientProfile, v: string) => setProfile((p) => p ? { ...p, [k]: v } : p);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const full_name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    const { error } = await supabase.from("patient_profiles").upsert({
      ...profile,
      full_name,
      birth_date: profile.birth_date || null,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Hata", description: error.message, variant: "destructive" });
    else toast({ title: "Profil kaydedildi" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("favorite_specialists").delete().eq("id", id);
    setFavorites((p) => p.filter((f) => f.id !== id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

  return (
    <>
      <Helmet>
        <title>Danışan Paneli | Doktorumol</title>
        <meta name="description" content="Randevularınızı, test sonuçlarınızı ve takip ettiğiniz uzmanları yönetin." />
      </Helmet>
      <div className="min-h-screen bg-muted/30">
        <header className="bg-background border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Hoşgeldin{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
              <p className="text-sm text-muted-foreground">Danışan paneliniz</p>
            </div>
            <Button variant="outline" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Çıkış</Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-5 flex items-center gap-3"><Calendar className="w-8 h-8 text-primary" /><div><div className="text-2xl font-bold">{appointments.length}</div><div className="text-sm text-muted-foreground">Randevu</div></div></CardContent></Card>
            <Card><CardContent className="p-5 flex items-center gap-3"><Heart className="w-8 h-8 text-rose-500" /><div><div className="text-2xl font-bold">{favorites.length}</div><div className="text-sm text-muted-foreground">Takip</div></div></CardContent></Card>
            <Card><CardContent className="p-5 flex items-center gap-3"><FileText className="w-8 h-8 text-emerald-600" /><div><div className="text-2xl font-bold">{tests.length}</div><div className="text-sm text-muted-foreground">Test</div></div></CardContent></Card>
          </div>

          <Tabs defaultValue="appointments">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="appointments"><Calendar className="w-4 h-4 mr-2" />Randevular</TabsTrigger>
              <TabsTrigger value="favorites"><Heart className="w-4 h-4 mr-2" />Takip</TabsTrigger>
              <TabsTrigger value="tests"><FileText className="w-4 h-4 mr-2" />Testler</TabsTrigger>
              <TabsTrigger value="profile"><UserIcon className="w-4 h-4 mr-2" />Profil</TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="mt-4 space-y-3">
              {appointments.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">Henüz randevunuz yok</CardContent></Card>
              ) : appointments.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {a.specialists?.profile_picture ? (
                      <img src={a.specialists.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">{a.specialists?.name?.[0] ?? "?"}</div>}
                    <div className="flex-1">
                      <div className="font-semibold">{a.specialists?.name ?? "Uzman"}</div>
                      <div className="text-sm text-muted-foreground">{a.specialists?.specialty}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.appointment_date).toLocaleDateString("tr-TR")}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.appointment_time?.slice(0,5)}</span>
                        <span className="flex items-center gap-1">{a.appointment_type === "online" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}{a.appointment_type === "online" ? "Online" : "Yüz yüze"}</span>
                      </div>
                    </div>
                    <Badge variant={a.status === "confirmed" ? "default" : "secondary"}>{a.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="favorites" className="mt-4 space-y-3">
              {favorites.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">Henüz uzman takip etmiyorsunuz</CardContent></Card>
              ) : favorites.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {f.specialists?.profile_picture ? (
                      <img src={f.specialists.profile_picture} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">{f.specialists?.name?.[0]}</div>}
                    <div className="flex-1">
                      <div className="font-semibold">{f.specialists?.name}</div>
                      <div className="text-sm text-muted-foreground">{f.specialists?.specialty}</div>
                      {f.specialists?.rating && <div className="flex items-center gap-1 text-xs mt-1"><Star className="w-3 h-3 fill-current text-yellow-500" />{f.specialists.rating}</div>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFavorite(f.id)}><Heart className="w-5 h-5 fill-current text-rose-500" /></Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tests" className="mt-4 space-y-3">
              {tests.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">Henüz test sonucunuz yok</CardContent></Card>
              ) : tests.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-emerald-600" />
                    <div className="flex-1">
                      <div className="font-semibold">{t.tests?.title ?? "Test"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("tr-TR")}</div>
                    </div>
                    <Badge variant="secondary">{t.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Profil Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Ad</Label><Input value={profile?.first_name ?? ""} onChange={(e) => updateField("first_name", e.target.value)} /></div>
                    <div><Label>Soyad</Label><Input value={profile?.last_name ?? ""} onChange={(e) => updateField("last_name", e.target.value)} /></div>
                    <div><Label>Telefon</Label><Input type="tel" value={profile?.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} /></div>
                    <div><Label>Şehir</Label><Input value={profile?.city ?? ""} onChange={(e) => updateField("city", e.target.value)} /></div>
                    <div><Label>Doğum Tarihi</Label><Input type="date" value={profile?.birth_date ?? ""} onChange={(e) => updateField("birth_date", e.target.value)} /></div>
                    <div><Label>Cinsiyet</Label>
                      <select className="w-full h-10 px-3 rounded-md border border-input bg-background" value={profile?.gender ?? ""} onChange={(e) => updateField("gender", e.target.value)}>
                        <option value="">Seçiniz</option>
                        <option value="female">Kadın</option>
                        <option value="male">Erkek</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
