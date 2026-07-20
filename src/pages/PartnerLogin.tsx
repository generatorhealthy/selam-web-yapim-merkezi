import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Handshake, Eye, EyeOff, Loader2 } from "lucide-react";

const PartnerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        toast.error("Giriş başarısız. E-posta veya şifre hatalı.");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, is_approved")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!profile || profile.role !== "partner" || !profile.is_approved) {
        await supabase.auth.signOut();
        toast.error("Bu alan yalnızca iş ortakları içindir.");
        return;
      }
      toast.success("Giriş başarılı, panelinize yönlendiriliyorsunuz...");
      navigate("/partner");
    } catch (err) {
      console.error(err);
      toast.error("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>İş Ortağı Girişi - Doktorumol.com.tr</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-blue-100/60">
          <CardHeader className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">İş Ortağı Girişi</CardTitle>
            <CardDescription>
              Kurumsal iş ortağı panelinize giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="ornek@kurumunuz.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Giriş yapılıyor</> : "Giriş Yap"}
              </Button>
              <p className="text-xs text-center text-muted-foreground pt-2">
                Hesap bilgileri sadece Doktorumol.com.tr yönetimi tarafından oluşturulur.
                <br />
                <Link to="/" className="underline">Ana sayfaya dön</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PartnerLogin;
