import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Check, X, Calendar, TrendingUp, Trash2 } from "lucide-react";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import AdminBackButton from "@/components/AdminBackButton";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface EmployeeSalary {
  id: string;
  employee_name: string;
  employee_surname: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  total_salary: number;
  salary_month: number;
  salary_year: number;
  payment_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const EmployeeSalaryManagement = () => {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<EmployeeSalary | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_name: "",
    employee_surname: "Hanım",
    base_salary: 22104,
    bonus: 0,
    deductions: 0,
    salary_month: new Date().getMonth() + 1,
    salary_year: new Date().getFullYear(),
    payment_date: "",
    status: "pending",
    notes: ""
  });

  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const employees = [
    { name: "Yağmur", surname: "Hanım" },
    { name: "Fatıma", surname: "Hanım" }
  ];

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalaries(data || []);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      toast({
        title: "Hata",
        description: "Maaş kayıtları yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSalary) {
        const { error } = await supabase
          .from('employee_salaries')
          .update({
            ...formData,
            payment_date: formData.payment_date || null
          })
          .eq('id', editingSalary.id);

        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Maaş kaydı güncellendi."
        });
      } else {
        const { error } = await supabase
          .from('employee_salaries')
          .insert([{
            ...formData,
            payment_date: formData.payment_date || null
          }]);

        if (error) throw error;
        
        toast({
          title: "Başarılı",
          description: "Yeni maaş kaydı eklendi."
        });
      }

      fetchSalaries();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving salary:', error);
      toast({
        title: "Hata",
        description: "Maaş kaydı kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_name: "",
      employee_surname: "Hanım",
      base_salary: 22104,
      bonus: 0,
      deductions: 0,
      salary_month: new Date().getMonth() + 1,
      salary_year: new Date().getFullYear(),
      payment_date: "",
      status: "pending",
      notes: ""
    });
    setEditingSalary(null);
  };

  const handleEdit = (salary: EmployeeSalary) => {
    setEditingSalary(salary);
    setFormData({
      employee_name: salary.employee_name,
      employee_surname: salary.employee_surname,
      base_salary: salary.base_salary,
      bonus: salary.bonus || 0,
      deductions: salary.deductions || 0,
      salary_month: salary.salary_month,
      salary_year: salary.salary_year,
      payment_date: salary.payment_date || "",
      status: salary.status,
      notes: salary.notes || ""
    });
    setIsDialogOpen(true);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('employee_salaries')
        .update({ 
          status: newStatus,
          payment_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', id);

      if (error) throw error;
      
      fetchSalaries();
      toast({
        title: "Başarılı",
        description: `Durum ${newStatus === 'paid' ? 'ödendi' : 'beklemede'} olarak güncellendi.`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const deleteSalary = async (id: string) => {
    if (!confirm("Bu maaş kaydını silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('employee_salaries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchSalaries();
      toast({
        title: "Başarılı",
        description: "Maaş kaydı başarıyla silindi."
      });
    } catch (error) {
      console.error('Error deleting salary:', error);
      toast({
        title: "Hata",
        description: "Maaş kaydı silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Ödendi</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">İptal</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Beklemede</Badge>;
    }
  };

  const totalPendingSalaries = salaries
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + s.total_salary, 0);

  const totalPaidSalaries = salaries
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + s.total_salary, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HorizontalNavigation />
      <div className="p-4">
        <div className="container mx-auto">
          <AdminBackButton />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Personel Maaşları</h1>
            <p className="text-gray-600">Yağmur Hanım ve Fatıma Hanım'ın maaş takibi</p>
          </div>

          {/* Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Bekleyen Ödemeler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-orange-500 mr-2" />
                  <span className="text-2xl font-bold text-orange-600">
                    ₺{totalPendingSalaries.toLocaleString('tr-TR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Toplam Ödenen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-2xl font-bold text-green-600">
                    ₺{totalPaidSalaries.toLocaleString('tr-TR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Toplam Kayıt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold text-blue-600">{salaries.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Yeni Maaş Kaydı Ekle Butonu */}
          <div className="mb-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Maaş Kaydı
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingSalary ? 'Maaş Kaydını Düzenle' : 'Yeni Maaş Kaydı'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="employee_name">Personel</Label>
                    <Select value={formData.employee_name} onValueChange={(value) => setFormData({...formData, employee_name: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Personel seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.name} value={employee.name}>
                            {employee.name} {employee.surname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="base_salary">Temel Maaş (₺)</Label>
                    <Input
                      id="base_salary"
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({...formData, base_salary: Number(e.target.value)})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bonus">Prim (₺)</Label>
                      <Input
                        id="bonus"
                        type="number"
                        value={formData.bonus}
                        onChange={(e) => setFormData({...formData, bonus: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deductions">Avans (₺)</Label>
                      <Input
                        id="deductions"
                        type="number"
                        value={formData.deductions}
                        onChange={(e) => setFormData({...formData, deductions: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary_month">Ay</Label>
                      <Select value={formData.salary_month.toString()} onValueChange={(value) => setFormData({...formData, salary_month: Number(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="salary_year">Yıl</Label>
                      <Input
                        id="salary_year"
                        type="number"
                        value={formData.salary_year}
                        onChange={(e) => setFormData({...formData, salary_year: Number(e.target.value)})}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="payment_date">Ödeme Tarihi</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Durum</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Beklemede</SelectItem>
                        <SelectItem value="paid">Ödendi</SelectItem>
                        <SelectItem value="cancelled">İptal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notlar</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button type="submit">
                      {editingSalary ? 'Güncelle' : 'Kaydet'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Maaş Kayıtları Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Maaş Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Temel Maaş</TableHead>
                    <TableHead>Prim</TableHead>
                    <TableHead>Avans</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Ödeme Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>
                        {salary.employee_name} {salary.employee_surname}
                      </TableCell>
                      <TableCell>
                        {months[salary.salary_month - 1]} {salary.salary_year}
                      </TableCell>
                      <TableCell>₺{salary.base_salary.toLocaleString('tr-TR')}</TableCell>
                      <TableCell>₺{(salary.bonus || 0).toLocaleString('tr-TR')}</TableCell>
                      <TableCell>₺{(salary.deductions || 0).toLocaleString('tr-TR')}</TableCell>
                      <TableCell className="font-semibold">
                        ₺{salary.total_salary.toLocaleString('tr-TR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(salary.status)}</TableCell>
                      <TableCell>
                        {salary.payment_date 
                          ? new Date(salary.payment_date).toLocaleDateString('tr-TR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(salary)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {salary.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(salary.id, 'paid')}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {salary.status === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(salary.id, 'pending')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteSalary(salary.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmployeeSalaryManagement;
