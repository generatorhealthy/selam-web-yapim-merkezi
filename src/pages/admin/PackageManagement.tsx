import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  ShoppingCart, 
  Edit, 
  Save, 
  X, 
  Crown, 
  Sparkles,
  Package,
  Plus,
  Trash2,
  Gift,
  Percent
} from "lucide-react";

interface PackageData {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  features: string[];
  icon: string;
  color: string;
  popular?: boolean;
  link?: string;
}

const PackageManagement = () => {
  const { userProfile, loading } = useUserRole();
  const [packages, setPackages] = useState<PackageData[]>([
    {
      id: "premium",
      name: "Premium Paket",
      price: 2998,
      originalPrice: 6499,
      features: [
        "Santral Sistemden Danışan Yönlendirme Garantisi",
        "Detaylı Profil",
        "Branş (Doktorum Ol Üyeliği 1)",
        "İletişim",
        "Adres ve Konum",
        "Video Yayınlama",
        "Danışan Görüşleri",
        "Uzman Sayfasına Özgün Seo Çalışması",
        "Online Randevu Takimi",
        "Google Reklamları",
        "Sosyal Medya Paylaşımlarım",
        "Danışan Takibi"
      ],
      icon: "Crown",
      color: "from-blue-500 to-blue-600",
      popular: true
    },
    {
      id: "full",
      name: "Full Paket",
      price: 4998,
      originalPrice: 8750,
      features: [
        "Santral Sistemden Danışan Yönlendirme Garantisi",
        "Detaylı Profil",
        "Branş (Doktorum Ol Üyeliği 1)",
        "İletişim",
        "Adres ve Konum",
        "Video Yayınlama",
        "Danışan Görüşleri",
        "Uzman Sayfasına Özgün Seo Çalışması",
        "Online Randevu Takimi",
        "Google Reklamları",
        "Sosyal Medya Paylaşımlarım",
        "Danışan Takibi"
      ],
      icon: "Sparkles",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: "campaign",
      name: "Kampanyalı Premium Paket",
      price: 3600,
      originalPrice: 7200,
      features: [
        "Hasta Takibi",
        "Detaylı Profil",
        "Branş (Doktor Üyeliği 1)",
        "İletişim",
        "Adres ve Konum",
        "Sosyal Medya Hesapları Ekleme",
        "Video Yayınlama",
        "Soru Cevaplama",
        "Danışan Görüşleri",
        "Doktor Sayfasına Özgün Seo Çalışması",
        "Online Randevu Takimi",
        "Google Reklam ve Yönetimi",
        "Sosyal Medya Reklam ve Yönetimi"
      ],
      icon: "Gift",
      color: "from-red-500 to-red-600",
      link: "/kampanyali-premium-paket"
    },
    {
      id: "discounted",
      name: "Premium Paket",
      price: 1998,
      originalPrice: 3996,
      features: [
        "Santral Sistemden Danışan Yönlendirme Garantisi",
        "Detaylı Profil",
        "Branş (Doktorum Ol Üyeliği 1)",
        "İletişim",
        "Adres ve Konum",
        "Video Yayınlama",
        "Danışan Görüşleri",
        "Uzman Sayfasına Özgün Seo Çalışması",
        "Online Randevu Takimi",
        "Google Reklamları",
        "Sosyal Medya Paylaşımlarım",
        "Danışan Takibi"
      ],
      icon: "Percent",
      color: "from-green-500 to-green-600",
      link: "/indirimli-paket"
    }
  ]);

  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [editedPackage, setEditedPackage] = useState<PackageData | null>(null);
  const [newFeature, setNewFeature] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/30">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-red-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  const handleEditPackage = (packageData: PackageData) => {
    setEditingPackage(packageData.id);
    setEditedPackage({ ...packageData });
    setNewFeature("");
  };

  const handleSavePackage = () => {
    if (editedPackage) {
      setPackages(packages.map(pkg => 
        pkg.id === editedPackage.id ? editedPackage : pkg
      ));
      setEditingPackage(null);
      setEditedPackage(null);
      setNewFeature("");
    }
  };

  const handleCancelEdit = () => {
    setEditingPackage(null);
    setEditedPackage(null);
    setNewFeature("");
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && editedPackage) {
      setEditedPackage({
        ...editedPackage,
        features: [...editedPackage.features, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (editedPackage) {
      setEditedPackage({
        ...editedPackage,
        features: editedPackage.features.filter((_, i) => i !== index)
      });
    }
  };

  const handleUpdateFeature = (index: number, newValue: string) => {
    if (editedPackage) {
      const updatedFeatures = [...editedPackage.features];
      updatedFeatures[index] = newValue;
      setEditedPackage({
        ...editedPackage,
        features: updatedFeatures
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Crown,
      Sparkles,
      Gift,
      Percent,
      Package
    };
    return icons[iconName] || Package;
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Paket Yönetimi - Doktorum Ol</title>
      </Helmet>
      
      <HorizontalNavigation />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/25">
              <ShoppingCart className="w-5 h-5 animate-pulse" />
              <span>Paket Yönetimi</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Paket Fiyatları ve İçerikleri
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
              Tüm paketlerin fiyatlarını, özelliklerini ve içeriklerini buradan yönetebilirsiniz.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {packages.map((pkg) => {
              const IconComponent = getIconComponent(pkg.icon);
              const isEditing = editingPackage === pkg.id;
              const currentPackage = isEditing ? editedPackage : pkg;
              
              return (
                <Card 
                  key={pkg.id} 
                  className={`relative group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
                    pkg.popular 
                      ? 'ring-2 ring-blue-400 shadow-xl bg-gradient-to-br from-white to-blue-50/50' 
                      : 'hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50'
                  } backdrop-blur-sm border-0`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 text-sm font-semibold shadow-lg">
                        <Crown className="w-4 h-4 mr-2 fill-current" />
                        En Popüler
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4 pt-8">
                    <div className="mb-4">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${pkg.color} p-4 shadow-lg`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {isEditing ? (
                        <Input
                          value={currentPackage?.name || ''}
                          onChange={(e) => setEditedPackage(prev => prev ? {...prev, name: e.target.value} : null)}
                          className="text-center"
                        />
                      ) : (
                        pkg.name
                      )}
                    </CardTitle>
                    
                    {pkg.link && (
                      <div className="text-sm text-blue-600 mb-2">
                        Link: {pkg.link}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="text-lg text-gray-500 line-through">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={currentPackage?.originalPrice || 0}
                            onChange={(e) => setEditedPackage(prev => prev ? {...prev, originalPrice: parseInt(e.target.value)} : null)}
                            className="text-center w-32 mx-auto"
                          />
                        ) : (
                          `${pkg.originalPrice.toLocaleString('tr-TR')} ₺`
                        )}
                      </div>
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={currentPackage?.price || 0}
                            onChange={(e) => setEditedPackage(prev => prev ? {...prev, price: parseInt(e.target.value)} : null)}
                            className="text-center w-40 mx-auto text-2xl"
                          />
                        ) : (
                          `${pkg.price.toLocaleString('tr-TR')} ₺`
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        /aylık KDV Dahil
                      </div>
                      <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-1">
                        %{Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)} İndirim
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-8">
                    <div className="space-y-4 mb-8 max-h-80 overflow-y-auto">
                      {isEditing ? (
                        <div className="space-y-3">
                          {editedPackage?.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                              <Input
                                value={feature}
                                onChange={(e) => handleUpdateFeature(index, e.target.value)}
                                className="flex-1 text-sm"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveFeature(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          
                          <div className="flex items-center gap-2 mt-4">
                            <Input
                              placeholder="Yeni özellik ekle..."
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              className="flex-1 text-sm"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                            />
                            <Button
                              size="sm"
                              onClick={handleAddFeature}
                              className="bg-green-500 hover:bg-green-600 text-white p-2"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        currentPackage?.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3 group">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center mt-0.5 shadow-sm">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-900 transition-colors">
                              {feature}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            onClick={handleSavePackage}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white border-0"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Kaydet
                          </Button>
                          <Button 
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-2" />
                            İptal
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => handleEditPackage(pkg)}
                          className={`w-full py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-r ${pkg.color} hover:opacity-90 text-white border-0`}
                        >
                          <Edit className="w-5 h-5 mr-2" />
                          Düzenle
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default PackageManagement;
