import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Helmet } from "react-helmet-async";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Edit, Trash2, Filter, Search, Plus } from "lucide-react";

interface ProspectiveRegistration {
  id: string;
  consultant_name: string;
  consultant_surname: string;
  consultant_phone: string;
  status: 'payment_pending' | 'order_pending' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
}

const statusOptions = [
  { value: 'payment_pending', label: 'Ödeme Bekleniyor', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'order_pending', label: 'Sipariş Bekleniyor', color: 'bg-blue-100 text-blue-800' },
  { value: 'cancelled', label: 'İptal Oldu', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: 'Tamamlandı', color: 'bg-green-100 text-green-800' }
];

export default function ProspectiveRegistrations() {
  const [registrations, setRegistrations] = useState<ProspectiveRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    consultant_name: string;
    consultant_surname: string;
    consultant_phone: string;
    status: 'payment_pending' | 'order_pending' | 'cancelled' | 'completed';
    notes: string;
  }>({
    consultant_name: "",
    consultant_surname: "",
    consultant_phone: "",
    status: "payment_pending",
    notes: ""
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('prospective_registrations' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations((data || []) as unknown as ProspectiveRegistration[]);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Hata",
        description: "Kayıtlar yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('prospective_registrations' as any)
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Kayıt güncellendi."
        });
      } else {
        const { error } = await supabase
          .from('prospective_registrations' as any)
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Yeni kayıt eklendi."
        });
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({
        consultant_name: "",
        consultant_surname: "",
        consultant_phone: "",
        status: "payment_pending",
        notes: ""
      });
      fetchRegistrations();
    } catch (error) {
      console.error('Error saving registration:', error);
      toast({
        title: "Hata",
        description: "Kayıt kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (registration: ProspectiveRegistration) => {
    setFormData({
      consultant_name: registration.consultant_name,
      consultant_surname: registration.consultant_surname,
      consultant_phone: registration.consultant_phone,
      status: registration.status,
      notes: registration.notes || ""
    });
    setEditingId(registration.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('prospective_registrations' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Kayıt silindi."
      });
      fetchRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: "Hata",
        description: "Kayıt silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = `${registration.consultant_name} ${registration.consultant_surname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      registration.consultant_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>Muhtemel Kayıt Yönetimi - Divan Paneli</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AdminBackButton />
        
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-0 rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Muhtemel Kayıt Yönetimi
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Potansiyel danışman kayıtlarını takip edin ve yönetin
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Danışman ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Durum filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          consultant_name: "",
                          consultant_surname: "",
                          consultant_phone: "",
                          status: "payment_pending",
                          notes: ""
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Kayıt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingId ? 'Kayıt Düzenle' : 'Yeni Kayıt Ekle'}
                      </DialogTitle>
                      <DialogDescription>
                        Muhtemel danışman kayıt bilgilerini girin
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="consultant_name">Danışman Adı</Label>
                          <Input
                            id="consultant_name"
                            value={formData.consultant_name}
                            onChange={(e) => setFormData(prev => ({...prev, consultant_name: e.target.value}))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="consultant_surname">Danışman Soyadı</Label>
                          <Input
                            id="consultant_surname"
                            value={formData.consultant_surname}
                            onChange={(e) => setFormData(prev => ({...prev, consultant_surname: e.target.value}))}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="consultant_phone">Danışman Numarası</Label>
                        <Input
                          id="consultant_phone"
                          value={formData.consultant_phone}
                          onChange={(e) => setFormData(prev => ({...prev, consultant_phone: e.target.value}))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Kayıt Durumu</Label>
                        <Select value={formData.status} onValueChange={(value: 'payment_pending' | 'order_pending' | 'cancelled' | 'completed') => setFormData(prev => ({...prev, status: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                          placeholder="Ek notlar..."
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          {editingId ? 'Güncelle' : 'Kaydet'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          İptal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Kayıtlar yükleniyor...</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Danışman Adı</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Oluşturulma Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Kayıt bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRegistrations.map((registration) => (
                          <TableRow key={registration.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {registration.consultant_name} {registration.consultant_surname}
                            </TableCell>
                            <TableCell>{registration.consultant_phone}</TableCell>
                            <TableCell>{getStatusBadge(registration.status)}</TableCell>
                            <TableCell>
                              {new Date(registration.created_at).toLocaleDateString('tr-TR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(registration)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(registration.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}