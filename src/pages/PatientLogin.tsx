import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";

export default function PatientLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast({ title: "Eksik bilgi", description: "E-posta ve şifre gerekli", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast({ title: "Giriş başarılı" });
      navigate("/danisan-paneli");
    } catch (e: any) {
      toast({ title: "Giriş başarısız", description: e.message, variant: "destructive" });
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

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "E-posta gerekli", description: "Şifre sıfırlamak için e-postanızı girin", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-posta gönderildi", description: "Şifre sıfırlama linkini e-postanızdan kontrol edin" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Danışan Girişi | Doktorumol</title>
        <meta name="description" content="Doktorumol danışan hesabınıza giriş yapın, randevularınızı ve takip ettiğiniz uzmanları yönetin." />
      </Helmet>
      <HorizontalNavigation />
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Danışan Girişi</CardTitle>
            <CardDescription>Hesabınıza giriş yapın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => oauth("google")}>Google ile devam et</Button>
              <Button variant="outline" className="w-full bg-black text-white hover:bg-black/90 hover:text-white" onClick={() => oauth("apple")}>Apple ile devam et</Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">veya</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div><Label>E-posta</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Şifre</Label>
                <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:underline">
                  Şifremi unuttum
                </button>
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button className="w-full" onClick={handleEmailLogin} disabled={loading}>
              {loading ? "Lütfen bekleyin..." : "Giriş Yap"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Hesabınız yok mu? <Link to="/uye-ol" className="text-primary font-semibold">Üye olun</Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Uzman mısınız? <Link to="/giris-yap" className="text-primary">Uzman girişi</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
