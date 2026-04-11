import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { Lock, ArrowRight, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check URL hash for recovery type
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Şifre Çok Kısa",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Şifreler Eşleşmiyor",
        description: "Girdiğiniz şifreler birbiriyle eşleşmiyor.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Şifre güncelleme hatası:", error);
        toast({
          title: "Hata",
          description: "Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: "Şifre Güncellendi",
        description: "Şifreniz başarıyla güncellendi.",
      });

      setTimeout(() => navigate("/giris-yap"), 3000);
    } catch (error) {
      console.error("Şifre güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <HorizontalNavigation />

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
              {isSuccess ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <Shield className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSuccess ? "Şifre Güncellendi" : "Yeni Şifre Belirle"}
            </h1>
            <p className="text-gray-600">
              {isSuccess
                ? "Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz..."
                : "Yeni şifrenizi aşağıya girin"}
            </p>
          </div>

          {!isSuccess && (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Yeni Şifre
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="En az 6 karakter"
                        className="pl-11 pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Şifre Tekrar
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="Şifrenizi tekrar girin"
                        className="pl-11 pr-11 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Güncelleniyor...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Şifreyi Güncelle
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Güvenli giriş için SSL şifreleme kullanılmaktadır
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
