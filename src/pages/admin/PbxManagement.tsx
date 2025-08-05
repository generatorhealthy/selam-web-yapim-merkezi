import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { AdminTopBar } from "@/components/AdminTopBar";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Settings, Users, Activity, Edit2, Save, X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Specialist {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  internal_number?: string | null;
}

const PbxManagement = () => {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNumber, setEditingNumber] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSpecialist, setNewSpecialist] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    internal_number: ""
  });

  const fetchSpecialists = async () => {
    try {
      const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .order('name');

      if (error) throw error;
      setSpecialists(data || []);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      toast({
        title: "Hata",
        description: "Uzmanlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const handleEditStart = (specialist: Specialist) => {
    setEditingId(specialist.id);
    setEditingNumber(specialist.internal_number?.toString() || "");
  };

  const handleSave = async (specialistId: string) => {
    const internalNumber = parseInt(editingNumber);
    
    if (isNaN(internalNumber) || internalNumber < 100 || internalNumber > 999) {
      toast({
        title: "Hata",
        description: "Dahili numara 100-999 arasında olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    // Check if number already exists
    const existingSpecialist = specialists.find(s => parseInt(s.internal_number || "0") === internalNumber && s.id !== specialistId);
    if (existingSpecialist) {
      toast({
        title: "Hata",
        description: "Bu dahili numara zaten kullanımda.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('specialists')
        .update({ internal_number: editingNumber })
        .eq('id', specialistId);

      if (error) throw error;

      setSpecialists(prev => prev.map(s => 
        s.id === specialistId ? { ...s, internal_number: editingNumber } : s
      ));

      setEditingId(null);
      setEditingNumber("");

      toast({
        title: "Başarılı",
        description: "Dahili numara güncellendi.",
      });
    } catch (error) {
      console.error('Error updating internal number:', error);
      toast({
        title: "Hata",
        description: "Dahili numara güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingNumber("");
  };

  const handleAddSpecialist = async () => {
    // Validate required fields
    if (!newSpecialist.name || !newSpecialist.specialty || !newSpecialist.email) {
      toast({
        title: "Hata",
        description: "Ad, uzmanlık ve e-posta alanları zorunludur.",
        variant: "destructive",
      });
      return;
    }

    // Validate internal number if provided
    if (newSpecialist.internal_number) {
      const internalNumber = parseInt(newSpecialist.internal_number);
      if (isNaN(internalNumber) || internalNumber < 100 || internalNumber > 999) {
        toast({
          title: "Hata",
          description: "Dahili numara 100-999 arasında olmalıdır.",
          variant: "destructive",
        });
        return;
      }

      // Check if number already exists
      const existingSpecialist = specialists.find(s => parseInt(s.internal_number || "0") === internalNumber);
      if (existingSpecialist) {
        toast({
          title: "Hata",
          description: "Bu dahili numara zaten kullanımda.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('specialists')
        .insert({
          name: newSpecialist.name,
          specialty: newSpecialist.specialty,
          email: newSpecialist.email,
          phone: newSpecialist.phone || null,
          internal_number: newSpecialist.internal_number || null,
          city: 'İstanbul',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setSpecialists(prev => [...prev, data]);
      setIsAddDialogOpen(false);
      setNewSpecialist({
        name: "",
        specialty: "",
        email: "",
        phone: "",
        internal_number: ""
      });

      toast({
        title: "Başarılı",
        description: "Yeni uzman eklendi.",
      });
    } catch (error) {
      console.error('Error adding specialist:', error);
      toast({
        title: "Hata",
        description: "Uzman eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const assignedCount = specialists.filter(s => s.internal_number).length;
  const availableNumbers = Array.from({length: 900}, (_, i) => i + 100).filter(num => 
    !specialists.some(s => parseInt(s.internal_number || "0") === num)
  );

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Santral Hizmeti - Divan Paneli</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <HorizontalNavigation />
        <AdminTopBar userRole="admin" />

        <div className="container mx-auto px-6 py-8">
          <AdminBackButton />

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Santral Hizmeti</h1>
            <p className="text-gray-600">
              Bulut santral sistemi ve dahili numara yönetimi
            </p>
          </div>

          {/* Sistem Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ana Hat</CardTitle>
                <Phone className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+90 216 706 06 11</div>
                <p className="text-xs text-muted-foreground">
                  Verimor Hattı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dahili Numaralar</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedCount}</div>
                <p className="text-xs text-muted-foreground">
                  {specialists.length} uzman içinden
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sistem Durumu</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    Kurulum Aşamasında
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verimor entegrasyonu bekleniyor
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Entegrasyon Bilgilendirmesi */}
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Settings className="h-5 w-5" />
                Verimor Entegrasyonu
              </CardTitle>
              <CardDescription className="text-orange-700">
                Mevcut 902167060611 numaranızı santral sistemine bağlamak için:
              </CardDescription>
            </CardHeader>
            <CardContent className="text-orange-700">
              <ol className="list-decimal list-inside space-y-2">
                <li>Verimor panelinden API erişimi açılması</li>
                <li>SIP Trunk yapılandırması</li>
                <li>Gelen arama yönlendirme ayarları</li>
                <li>IVR sistemi devre dışı bırakılması (istek üzerine)</li>
              </ol>
              <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                <p className="font-medium text-orange-800">Gerekli Bilgiler:</p>
                <p className="text-sm">• Verimor API kimlik bilgileri</p>
                <p className="text-sm">• SIP hesabı parametreleri</p>
                <p className="text-sm">• Santral yazılımı kurulumu</p>
              </div>
            </CardContent>
          </Card>

          {/* Uzman Listesi ve Dahili Numara Atama */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Uzman Dahili Numaraları</CardTitle>
                  <CardDescription>
                    Uzmanlara 100-999 arası dahili numaralar atayabilirsiniz.
                    Müsait numara sayısı: {availableNumbers.length}
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Yeni Uzman Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Yeni Uzman Ekle</DialogTitle>
                      <DialogDescription>
                        Yeni uzman bilgilerini girin. Dahili numara opsiyoneldir.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Ad Soyad *
                        </Label>
                        <Input
                          id="name"
                          value={newSpecialist.name}
                          onChange={(e) => setNewSpecialist(prev => ({ ...prev, name: e.target.value }))}
                          className="col-span-3"
                          placeholder="Uzman adı ve soyadı"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="specialty" className="text-right">
                          Uzmanlık *
                        </Label>
                        <Select
                          value={newSpecialist.specialty}
                          onValueChange={(value) => setNewSpecialist(prev => ({ ...prev, specialty: value }))}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Uzmanlık seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Psikolog">Psikolog</SelectItem>
                            <SelectItem value="Aile Danışmanı">Aile Danışmanı</SelectItem>
                            <SelectItem value="Psikolojik Danışmanlık">Psikolojik Danışmanlık</SelectItem>
                            <SelectItem value="Diyetisyen">Diyetisyen</SelectItem>
                            <SelectItem value="Fizyoterapist">Fizyoterapist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          E-posta *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newSpecialist.email}
                          onChange={(e) => setNewSpecialist(prev => ({ ...prev, email: e.target.value }))}
                          className="col-span-3"
                          placeholder="ornek@email.com"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Telefon
                        </Label>
                        <Input
                          id="phone"
                          value={newSpecialist.phone}
                          onChange={(e) => setNewSpecialist(prev => ({ ...prev, phone: e.target.value }))}
                          className="col-span-3"
                          placeholder="0532 123 45 67"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="internal_number" className="text-right">
                          Dahili No
                        </Label>
                        <Input
                          id="internal_number"
                          type="number"
                          value={newSpecialist.internal_number}
                          onChange={(e) => setNewSpecialist(prev => ({ ...prev, internal_number: e.target.value }))}
                          className="col-span-3"
                          placeholder="100-999"
                          min="100"
                          max="999"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddSpecialist}>
                        Uzman Ekle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Uzman Adı</TableHead>
                      <TableHead>Uzmanlık</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Dahili Numara</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialists.map((specialist) => (
                      <TableRow key={specialist.id}>
                        <TableCell className="font-medium">{specialist.name}</TableCell>
                        <TableCell>{specialist.specialty}</TableCell>
                        <TableCell>{specialist.email}</TableCell>
                        <TableCell>{specialist.phone || '-'}</TableCell>
                        <TableCell>
                          {editingId === specialist.id ? (
                            <Input
                              type="number"
                              value={editingNumber}
                              onChange={(e) => setEditingNumber(e.target.value)}
                              placeholder="100-999"
                              className="w-24"
                              min="100"
                              max="999"
                            />
                          ) : (
                            <span className="font-mono">
                              {specialist.internal_number || '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === specialist.id ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSave(specialist.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStart(specialist)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
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
    </>
  );
};

export default PbxManagement;