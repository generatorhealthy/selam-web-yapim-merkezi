
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { AdminTopBar } from "@/components/AdminTopBar";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Users, 
  PhoneCall, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Settings,
  Zap,
  Monitor,
  UserPlus,
  Edit,
  Trash2
} from "lucide-react";

interface Specialist {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  is_active: boolean;
}

interface Extension {
  id: string;
  specialist_id: string;
  extension_number: string;
  specialist_name: string;
  specialist_phone: string;
  is_active: boolean;
  created_at: string;
}

const PbxManagement = () => {
  const { userProfile, loading } = useUserRole();
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [extensionNumber, setExtensionNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const mainNumber = "0 216 706 06 11"; // Verimor'dan alınan ana numara

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsFetching(true);
      
      // Uzmanları getir
      const { data: specialistsData, error: specialistsError } = await supabase
        .from('specialists')
        .select('id, name, phone, specialty, is_active')
        .eq('is_active', true)
        .order('name');

      if (specialistsError) throw specialistsError;
      setSpecialists(specialistsData || []);

      // Dahili numaraları getir (gelecekte pbx_extensions tablosundan)
      // Şimdilik mock data
      const mockExtensions: Extension[] = [
        {
          id: '1',
          specialist_id: specialistsData?.[0]?.id || '1',
          extension_number: '101',
          specialist_name: specialistsData?.[0]?.name || 'Uzman 1',
          specialist_phone: specialistsData?.[0]?.phone || '0 532 000 00 01',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      setExtensions(mockExtensions);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const generateNextExtension = () => {
    const existingNumbers = extensions.map(ext => parseInt(ext.extension_number));
    let nextNumber = 101;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    return nextNumber.toString();
  };

  const handleCreateExtension = async () => {
    if (!selectedSpecialist || !extensionNumber) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen uzman ve dahili numara seçiniz.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const specialist = specialists.find(s => s.id === selectedSpecialist);
      if (!specialist) {
        throw new Error('Uzman bulunamadı');
      }

      // Gelecekte gerçek veritabanı işlemi yapılacak
      const newExtension: Extension = {
        id: Date.now().toString(),
        specialist_id: selectedSpecialist,
        extension_number: extensionNumber,
        specialist_name: specialist.name,
        specialist_phone: specialist.phone,
        is_active: true,
        created_at: new Date().toISOString()
      };

      setExtensions(prev => [...prev, newExtension]);

      toast({
        title: "Başarılı",
        description: `Dahili numara ${extensionNumber} başarıyla oluşturuldu.`,
      });

      // Form temizle
      setSelectedSpecialist('');
      setExtensionNumber('');

    } catch (error: any) {
      console.error('Extension creation error:', error);
      toast({
        title: "Hata",
        description: error.message || "Dahili numara oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-blue-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Phone className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yükleniyor...</h2>
          <p className="text-gray-600">Santral yönetim paneli hazırlanıyor</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-red-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Santral Hizmeti - Doktorum Ol</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-green-50/30">
        <HorizontalNavigation />
        <AdminTopBar userRole={userProfile?.role} />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <AdminBackButton />
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-green-600 rounded-xl shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-teal-800 to-green-800 bg-clip-text text-transparent">
                  Santral Hizmeti
                </h1>
                <p className="text-slate-600 mt-1">
                  Uzmanlar için dahili santral ve telefon yönetim sistemi
                </p>
              </div>
            </div>
            
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Sistem Durumu</p>
                      <p className="text-green-800 font-bold">Aktif</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Ana Numara</p>
                      <p className="text-blue-800 font-bold">{mainNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Toplam Dahili</p>
                      <p className="text-purple-800 font-bold">{extensions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Aktif Dahili</p>
                      <p className="text-orange-800 font-bold">{extensions.filter(ext => ext.is_active).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dahili Numara Oluşturma */}
            <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-xl">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Dahili Numara Oluştur
                </CardTitle>
                <CardDescription className="text-teal-100">
                  Uzmanlara dahili numara atayın
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="specialist" className="text-sm font-medium text-slate-700">
                    Uzman Seçiniz
                  </Label>
                  <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Uzman seçiniz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specialists.map((specialist) => (
                        <SelectItem key={specialist.id} value={specialist.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{specialist.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {specialist.specialty}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extension" className="text-sm font-medium text-slate-700">
                    Dahili Numara
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="extension"
                      type="text"
                      placeholder="101"
                      value={extensionNumber}
                      onChange={(e) => setExtensionNumber(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setExtensionNumber(generateNextExtension())}
                    >
                      Otomatik
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dahili numaralar genellikle 101'den başlar
                  </p>
                </div>

                <Button
                  onClick={handleCreateExtension}
                  disabled={isLoading || !selectedSpecialist || !extensionNumber}
                  className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-semibold py-3 h-auto"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Oluşturuluyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Dahili Numara Oluştur
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Sistem Bilgileri */}
            <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Sistem Bilgileri
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Santral sistemi yapılandırması
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                        <Monitor className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1">Ana Numara</h4>
                        <p className="text-sm text-blue-700">{mainNumber}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Verimor'dan alınan bulut santral numarası
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg mt-0.5">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800 mb-1">Çalışma Prensibi</h4>
                        <p className="text-sm text-green-700 leading-relaxed">
                          Ana numaraya gelen aramalar, IVR sistemi ile dahili numaralara yönlendirilir. 
                          Her uzmanın kendi dahili numarası bulunur.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg mt-0.5">
                        <PhoneCall className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-1">Planlanan Özellikler</h4>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• IVR (Interaktif Sesli Yanıt) sistemi</li>
                          <li>• Arama kayıtları ve raporlama</li>
                          <li>• Çoklu hat desteği</li>
                          <li>• Web tabanlı softphone</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mevcut Dahili Numaralar */}
          <div className="mt-8">
            <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-700" />
                  Mevcut Dahili Numaralar
                </CardTitle>
                <CardDescription>
                  Sistemde kayıtlı dahili numaralar ve uzman atamaları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {extensions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Phone className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Henüz dahili numara oluşturulmamış</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dahili No</TableHead>
                        <TableHead>Uzman Adı</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Oluşturulma</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extensions.map((extension) => (
                        <TableRow key={extension.id}>
                          <TableCell className="font-mono font-semibold">
                            {extension.extension_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {extension.specialist_name}
                          </TableCell>
                          <TableCell>
                            {extension.specialist_phone}
                          </TableCell>
                          <TableCell>
                            <Badge variant={extension.is_active ? "default" : "secondary"}>
                              {extension.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(extension.created_at).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default PbxManagement;
