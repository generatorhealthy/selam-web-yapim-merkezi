import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import { AdminTopBar } from "@/components/AdminTopBar";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Users, Edit2, Save, X, Plus, PhoneForwarded, Search, BarChart3, Hash, Server, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PbxCallStats } from "@/components/admin/PbxCallStats";

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
  const [bulkLoading, setBulkLoading] = useState(false);
  const [creatingExtId, setCreatingExtId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getFunctionErrorMessage = async (error: any, fallback: string) => {
    if (error?.context instanceof Response) {
      try {
        const payload = await error.context.clone().json();
        if (payload?.error) return payload.error;
      } catch {
        try {
          const text = await error.context.clone().text();
          if (text) return text;
        } catch {}
      }
    }
    return error instanceof Error ? error.message : fallback;
  };

  const handleAutoCreateExtension = async (specialist: Specialist) => {
    setCreatingExtId(specialist.id);
    try {
      const { data, error } = await supabase.functions.invoke("freepbx-create-extension", {
        body: {
          action: "create",
          specialist_id: specialist.id,
          name: specialist.name,
          phone: specialist.phone,
          email: specialist.email,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const ext = data?.extension ? String(data.extension) : null;
      if (ext) {
        setSpecialists((prev) =>
          prev.map((s) => (s.id === specialist.id ? { ...s, internal_number: ext } : s)),
        );
      }
      toast({
        title: "Dahili Oluşturuldu",
        description: data?.message || `Dahili numara: ${ext}`,
      });
    } catch (e) {
      console.error("Auto create extension error:", e);
      const message = await getFunctionErrorMessage(e, "Dahili oluşturulamadı.");
      toast({
        title: "Hata",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCreatingExtId(null);
    }
  };

  const handleBulkFollowMe = async () => {
    if (!confirm("Tüm uzmanların Follow-Me listesi, dahili numaralar silinip kendi cep numaralarıyla (0XXXXXXXXXX#) güncellenecek ve Follow-Me etkinleştirilecek. Devam edilsin mi?")) {
      return;
    }
    setBulkLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("freepbx-create-extension", {
        body: { action: "bulk_followme" },
      });
      if (error) throw error;
      toast({
        title: "Follow-Me Güncellendi",
        description: `Toplam: ${data.total} | Güncellenen: ${data.updated} | Atlanan: ${data.skipped} | Hatalı: ${data.failed}`,
      });
    } catch (error) {
      console.error("Bulk follow-me error:", error);
      toast({
        title: "Hata",
        description: "Follow-Me güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };


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
      const specialist = specialists.find((s) => s.id === specialistId);
      if (!specialist) throw new Error("Uzman bulunamadı.");

      const { data: pbxData, error: pbxError } = await supabase.functions.invoke("freepbx-create-extension", {
        body: {
          action: "create",
          specialist_id: specialistId,
          extension: editingNumber,
          name: specialist.name,
          phone: specialist.phone,
          email: specialist.email,
        },
      });

      if (pbxError) throw pbxError;
      if (pbxData?.error) throw new Error(pbxData.error);

      const savedNumber = pbxData?.extension ? String(pbxData.extension) : editingNumber;

      setSpecialists(prev => prev.map(s => 
        s.id === specialistId ? { ...s, internal_number: savedNumber } : s
      ));

      setEditingId(null);
      setEditingNumber("");

      toast({
        title: "Başarılı",
        description: pbxData?.message || "Dahili numara FreePBX ile güncellendi.",
      });
    } catch (error) {
      console.error('Error updating internal number:', error);
      const errorMessage = await getFunctionErrorMessage(error, "Dahili numara güncellenirken bir hata oluştu.");
      toast({
        title: "Hata",
        description: errorMessage,
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

  const initials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");

  const filteredSpecialists = specialists.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      (s.internal_number || "").toString().includes(q)
    );
  });

  const addDialog = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Yeni Uzman Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Yeni Uzman Ekle</DialogTitle>
          <DialogDescription>
            Yeni uzman bilgilerini girin. Dahili numara opsiyoneldir.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              value={newSpecialist.name}
              onChange={(e) => setNewSpecialist((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Uzman adı ve soyadı"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="specialty">Uzmanlık *</Label>
            <Select
              value={newSpecialist.specialty}
              onValueChange={(value) => setNewSpecialist((prev) => ({ ...prev, specialty: value }))}
            >
              <SelectTrigger>
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
          <div className="grid gap-2">
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              value={newSpecialist.email}
              onChange={(e) => setNewSpecialist((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="ornek@email.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={newSpecialist.phone}
                onChange={(e) => setNewSpecialist((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="0532 123 45 67"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="internal_number">Dahili No</Label>
              <Input
                id="internal_number"
                type="number"
                value={newSpecialist.internal_number}
                onChange={(e) => setNewSpecialist((prev) => ({ ...prev, internal_number: e.target.value }))}
                placeholder="100-999"
                min="100"
                max="999"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddSpecialist}>
            Uzman Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Santral Hizmeti - Divan Paneli</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        <HorizontalNavigation />
        <AdminTopBar userRole="admin" />

        <div className="container mx-auto px-4 py-6 sm:px-6">
          <AdminBackButton />

          {/* Hero başlık */}
          <div className="relative mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground shadow-lg sm:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Santral Hizmeti</h1>
                  <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">
                    FreePBX bulut santral sistemi · çağrı raporları · dahili numara yönetimi
                  </p>
                </div>
              </div>
              <Badge className="w-fit gap-1.5 border-0 bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/25">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                Sistem Aktif
              </Badge>
            </div>
          </div>

          {/* Sistem bilgi kartları */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Ana Hat (SIP)</p>
                  <p className="truncate text-lg font-bold">+90 216 706 06 11</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Hash className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Atanan Dahili</p>
                  <p className="text-lg font-bold">
                    {assignedCount}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ {specialists.length}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Müsait Numara</p>
                  <p className="text-lg font-bold">{availableNumbers.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Entegrasyon</p>
                  <p className="text-lg font-bold">FreePBX</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sekmeler */}
          <Tabs defaultValue="stats" className="mt-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Çağrı Raporları
              </TabsTrigger>
              <TabsTrigger value="extensions" className="gap-2">
                <Hash className="h-4 w-4" />
                Dahili Numaralar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-6">
              <PbxCallStats />
            </TabsContent>

            <TabsContent value="extensions" className="mt-6">
              <Card className="border-border/60">
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-primary" />
                        Uzman Dahili Numaraları
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Uzmanlara 100-999 arası dahili numaralar atayın. Müsait: {availableNumbers.length}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={handleBulkFollowMe}
                        disabled={bulkLoading}
                      >
                        <PhoneForwarded className="h-4 w-4" />
                        {bulkLoading ? "Güncelleniyor..." : "Follow-Me Toplu Güncelle"}
                      </Button>
                      {addDialog}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="İsim, e-posta, telefon veya dahili ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                      ))}
                    </div>
                  ) : filteredSpecialists.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Sonuç bulunamadı.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Uzman</TableHead>
                            <TableHead className="hidden md:table-cell">Uzmanlık</TableHead>
                            <TableHead className="hidden lg:table-cell">İletişim</TableHead>
                            <TableHead>Dahili</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSpecialists.map((specialist) => (
                            <TableRow key={specialist.id} className="group">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                      {initials(specialist.name) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium">{specialist.name}</p>
                                    <p className="truncate text-xs text-muted-foreground md:hidden">
                                      {specialist.specialty}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant="secondary" className="font-normal">
                                  {specialist.specialty}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <div className="text-sm">
                                  <p className="truncate text-muted-foreground">{specialist.email}</p>
                                  <p className="text-xs text-muted-foreground">{specialist.phone || "—"}</p>
                                </div>
                              </TableCell>
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
                                ) : specialist.internal_number ? (
                                  <Badge className="gap-1 bg-primary/10 font-mono text-primary hover:bg-primary/15">
                                    <Hash className="h-3 w-3" />
                                    {specialist.internal_number}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Atanmadı</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {editingId === specialist.id ? (
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={() => handleSave(specialist.id)} className="h-8 w-8 p-0">
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
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditStart(specialist)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    {!specialist.internal_number && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleAutoCreateExtension(specialist)}
                                        disabled={creatingExtId === specialist.id}
                                        className="h-8 gap-1 px-2"
                                      >
                                        {creatingExtId === specialist.id ? (
                                          <span className="animate-pulse">...</span>
                                        ) : (
                                          <>
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Oluştur
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default PbxManagement;