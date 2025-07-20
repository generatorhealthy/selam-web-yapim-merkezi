
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Eye, EyeOff, AlertCircle } from "lucide-react";
import AdminBackButton from "@/components/AdminBackButton";

const MapboxSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [currentKey, setCurrentKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentKey();
  }, []);

  const fetchCurrentKey = async () => {
    try {
      setLoading(true);
      
      // Check if there's a stored key in localStorage for now
      const storedKey = localStorage.getItem('mapbox_api_key');
      if (storedKey) {
        setCurrentKey(storedKey);
        setApiKey(storedKey);
      }
    } catch (error) {
      console.error('Error fetching Mapbox key:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateApiKey = (key: string) => {
    if (!key.trim()) {
      return "API anahtarı boş olamaz";
    }
    
    if (!key.startsWith('pk.')) {
      return "Mapbox public API anahtarı 'pk.' ile başlamalıdır. Secret key (sk.) kullanmayın.";
    }
    
    if (key.length < 50) {
      return "API anahtarı çok kısa görünüyor. Lütfen tam anahtarı girin.";
    }
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateApiKey(apiKey);
    if (validationError) {
      toast({
        title: "Hata",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Store in localStorage for now (in production this should be in Supabase secrets)
      localStorage.setItem('mapbox_api_key', apiKey);
      setCurrentKey(apiKey);
      
      toast({
        title: "Başarılı",
        description: "Mapbox API anahtarı başarıyla kaydedildi. Uzman profillerindeki haritalar artık çalışacak.",
      });
    } catch (error) {
      console.error('Error saving Mapbox key:', error);
      toast({
        title: "Hata",
        description: "API anahtarı kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const maskKey = (key: string) => {
    if (!key) return "";
    return key.substring(0, 8) + "..." + key.substring(key.length - 8);
  };

  const keyValidation = validateApiKey(apiKey);
  const isSecretKey = apiKey.startsWith('sk.');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <AdminBackButton />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mapbox Ayarları</h1>
          <p className="text-gray-600">Uzman profillerinde harita gösterimi için Mapbox API anahtarını yönetin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              Mapbox API Anahtarı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentKey && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Mevcut API Anahtarı</p>
                    <p className="text-sm text-green-600 font-mono">
                      {showKey ? currentKey : maskKey(currentKey)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">Mapbox Public API Anahtarı</Label>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="pk.eyJ1IjoibmVnaWJpY29tIiwiYSI6Im..."
                className={`font-mono ${keyValidation ? 'border-red-500' : ''}`}
              />
              {keyValidation && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{keyValidation}</span>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Mapbox hesabınızdan aldığınız <strong>public</strong> API anahtarını buraya girin. 
                Bu anahtar <strong>pk.</strong> ile başlamalıdır.
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || loading || !!keyValidation}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Kaydediliyor..." : "API Anahtarını Kaydet"}
            </Button>

            {isSecretKey && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800 mb-2">Önemli Uyarı</h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      Girdiğiniz anahtar <strong>sk.</strong> ile başlıyor. Bu bir secret key'dir ve güvenli değildir.
                    </p>
                    <p className="text-sm text-yellow-700">
                      Lütfen Mapbox hesabınızdan <strong>public token</strong> (pk. ile başlayan) kullanın.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Nasıl Doğru API Anahtarı Alınır?</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a> adresine gidin</li>
                <li>2. Hesabınıza giriş yapın</li>
                <li>3. Dashboard'da "Access tokens" bölümüne gidin</li>
                <li>4. <strong>"Default public token"</strong> kısmındaki anahtarı kopyalayın</li>
                <li>5. Bu anahtar <strong>pk.</strong> ile başlamalıdır</li>
                <li>6. Buraya yapıştırın ve kaydedin</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapboxSettings;
