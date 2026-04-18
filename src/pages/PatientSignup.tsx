import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

export default function PatientSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [acceptedDisclosure, setAcceptedDisclosure] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.firstName) {
      toast({ title: "Eksik bilgi", description: "Ad, e-posta ve şifre gerekli", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/danisan-paneli`,
          data: { full_name: `${form.firstName} ${form.lastName}`.trim() },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (userId) {
        await supabase.from("patient_profiles").insert({
          user_id: userId,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim() || null,
          full_name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          auth_provider: "email",
        });
      }
      toast({ title: "Kayıt başarılı" });
      navigate("/danisan-paneli");
    } catch (e: any) {
      toast({ title: "Kayıt başarısız", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/danisan-paneli` },
    });
    if (error) toast({ title: "Hata", description: error.message, variant: "destructive" });
  };

  return (
    <>
      <Helmet>
        <title>Üye Ol | Doktorumol</title>
        <meta name="description" content="Doktorumol'a kullanıcı olarak ücretsiz üye olun, randevularınızı yönetin." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Hesap Oluştur</CardTitle>
            <CardDescription>Doktorumol'a kullanıcı olarak katılın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => oauth("google")}>Google ile devam et</Button>
              <Button variant="outline" className="w-full bg-black text-white hover:bg-black/90 hover:text-white" onClick={() => oauth("apple")}>Apple ile devam et</Button>
            </div>
            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">veya</span><div className="flex-1 h-px bg-border" /></div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ad</Label><Input value={form.firstName} onChange={set("firstName")} /></div>
              <div><Label>Soyad</Label><Input value={form.lastName} onChange={set("lastName")} /></div>
            </div>
            <div><Label>E-posta</Label><Input type="email" value={form.email} onChange={set("email")} /></div>
            <div><Label>Telefon (isteğe bağlı)</Label><Input type="tel" value={form.phone} onChange={set("phone")} /></div>
            <div><Label>Şifre</Label><Input type="password" value={form.password} onChange={set("password")} /></div>

            <Button className="w-full" onClick={handleSignup} disabled={loading}>{loading ? "Lütfen bekleyin..." : "Hesap Oluştur"}</Button>
            <p className="text-center text-sm text-muted-foreground">
              Zaten hesabınız var mı? <Link to="/giris-yap" className="text-primary font-semibold">Giriş yap</Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Uzman mısınız? <Link to="/kayit-ol" className="text-primary">Uzman olarak kayıt olun</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
