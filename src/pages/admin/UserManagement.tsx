import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Edit, Eye, EyeOff, Trash2, Users, RefreshCw, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";
import CaptureEvidenceDialog from "./CaptureEvidenceDialog";

type UserRole = Database["public"]["Enums"]["user_role"];

interface UserProfile {
  id: string;
  user_id: string;
  role: UserRole;
  is_approved: boolean;
  created_at: string;
  email?: string;
  name?: string;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState<{[key: string]: number}>({});
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
    specialistId?: string;
    profileUrl?: string;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    password: "",
    role: "user" as UserRole,
    is_approved: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Kullanıcıları getirmeye başlıyoruz...');
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Profil sorgusu sonucu:', { profiles, error: profilesError });

      if (profilesError) {
        console.error('Kullanıcı profilleri alınırken hata:', profilesError);
        toast({
          title: "Hata",
          description: "Kullanıcı profilleri yüklenirken bir hata oluştu: " + profilesError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Bulunan profil sayısı:', profiles?.length || 0);

      const userProfiles = profiles?.map(profile => ({
        ...profile,
        name: profile.name || 'İsimsiz Kullanıcı',
        email: profile.email || `user-${profile.user_id.slice(0, 8)}`
      })) || [];

      setUsers(userProfiles);
      
      toast({
        title: "Başarılı",
        description: `${userProfiles.length} kullanıcı yüklendi.`,
      });

    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email || "",
      password: "",
      role: user.role,
      is_approved: user.is_approved
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    // Input validation
    if (!editForm.email.trim()) {
      toast({
        title: "Hata",
        description: "E-posta adresi gereklidir.",
        variant: "destructive"
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast({
        title: "Hata",
        description: "Geçerli bir e-posta adresi girin.",
        variant: "destructive"
      });
      return;
    }

    // Password validation if provided
    if (editForm.password && editForm.password.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('Güvenli kullanıcı güncelleme işlemi başlıyor:', selectedUser.user_id);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Hata",
          description: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('secure-user-management', {
        body: {
          action: 'updateUser',
          userId: selectedUser.user_id,
          userData: {
            email: editForm.email,
            password: editForm.password || undefined,
            role: editForm.role,
            is_approved: editForm.is_approved
          }
        }
      });

      console.log('Secure function response:', response);

      if (response.error) {
        console.error('Kullanıcı güncelleme hatası:', response.error);
        toast({
          title: "Hata",
          description: "Kullanıcı güncellenirken bir hata oluştu: " + response.error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Kullanıcı başarıyla güncellendi');
      toast({
        title: "Başarılı",
        description: "Kullanıcı bilgileri başarıyla güncellendi.",
      });

      setIsEditDialogOpen(false);
      setEditForm({ email: "", password: "", role: "user", is_approved: false });
      fetchUsers();
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    handleDelete(user);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`${user.name || user.user_id} kullanıcısını tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve kullanıcı tüm ilişkili verilerle birlikte tamamen silinecektir.`)) return;

    setIsProcessing(true);
    try {
      console.log('Güvenli kullanıcı silme işlemi başlatılıyor:', user.user_id);

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Hata",
          description: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('secure-user-management', {
        body: {
          action: 'deleteUser',
          userId: user.user_id
        }
      });

      if (response.error) {
        console.error('Kullanıcı silme hatası:', response.error);
        toast({
          title: "Hata",
          description: "Kullanıcı silinirken bir hata oluştu: " + response.error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Kullanıcı başarıyla silindi');
      toast({
        title: "Başarılı",
        description: "Kullanıcı ve tüm ilişkili verileri tamamen silindi.",
      });

      setDeletingUsers(prev => {
        const { [user.id]: removed, ...rest } = prev;
        return rest;
      });

      fetchUsers();

    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureEvidence = async (user: UserProfile) => {
    try {
      // Check if user is a specialist
      const { data: specialist, error } = await supabase
        .from('specialists')
        .select('id, name, specialty')
        .eq('user_id', user.user_id)
        .single();

      let profileUrl = undefined;
      let specialistId = undefined;

      if (specialist && !error) {
        // Create the profile URL - format: /:specialtySlug/:doctorName
        const specialtySlug = specialist.specialty?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'uzman';
        const doctorSlug = specialist.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-ığüşöç]/g, '') || 'doktor';
        profileUrl = `${window.location.origin}/${specialtySlug}/${doctorSlug}`;
        specialistId = specialist.id;
      }

      setCaptureTarget({
        userId: user.user_id,
        userName: user.name || 'İsimsiz Kullanıcı',
        userEmail: user.email || '',
        specialistId,
        profileUrl
      });
      setCaptureDialogOpen(true);
    } catch (error) {
      console.error('Error checking specialist:', error);
      toast({
        title: "Hata",
        description: "Uzman bilgileri alınamadı.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'specialist':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-purple-100 text-purple-800';
      case 'legal':
        return 'bg-green-100 text-green-800';
      case 'muhasebe':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'specialist':
        return 'Uzman';
      case 'staff':
        return 'Staff';
      case 'legal':
        return 'Hukuk Birimi';
      case 'muhasebe':
        return 'Muhasebe Birimi';
      default:
        return 'Kullanıcı';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Kullanıcılar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/divan_paneli/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          </div>
          <Button onClick={fetchUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kullanıcı Listesi ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Onay Durumu</TableHead>
                  <TableHead>Oluşturulma Tarihi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || 'İsimsiz Kullanıcı'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleText(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.is_approved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {user.is_approved ? "Onaylı" : "Beklemede"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                        {user.role === 'specialist' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCaptureEvidence(user)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            Kanıt Topla
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={isProcessing || (deletingUsers[user.id] && deletingUsers[user.id] > 0)}
                          className={deletingUsers[user.id] && deletingUsers[user.id] > 0 ? "animate-pulse" : ""}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deletingUsers[user.id] && deletingUsers[user.id] > 0
                            ? `Bekleyin (${deletingUsers[user.id]})` 
                            : deletingUsers[user.id] === 0
                            ? "Tamamen Sil"
                            : "Tamamen Sil"
                          }
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Henüz kullanıcı bulunmuyor.
                <br />
                <Button onClick={fetchUsers} className="mt-2">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tekrar Dene
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kullanıcı Düzenle</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label>Ad Soyad</Label>
                  <Input
                    value={selectedUser.name || 'İsimsiz Kullanıcı'}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-email">E-posta *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="E-posta adresi"
                    maxLength={100}
                    required
                  />
                </div>

                <div>
                  <Label>Kullanıcı ID</Label>
                  <Input
                    value={selectedUser.user_id}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-password">Yeni Parola (Opsiyonel)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      value={editForm.password}
                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                      placeholder="Yeni parola girin - minimum 6 karakter"
                      minLength={6}
                      maxLength={50}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Parola belirlerseniz kullanıcı yeni parola ile giriş yapabilir
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-role">Kullanıcı Rolü *</Label>
                  <Select 
                    value={editForm.role} 
                    onValueChange={(value: UserRole) => setEditForm({...editForm, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Kullanıcı</SelectItem>
                      <SelectItem value="specialist">Uzman</SelectItem>
                      <SelectItem value="staff">Staff (Sınırlı Yetkili)</SelectItem>
                      <SelectItem value="legal">Hukuk Birimi</SelectItem>
                      <SelectItem value="muhasebe">Muhasebe Birimi</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-approved"
                    checked={editForm.is_approved}
                    onChange={(e) => setEditForm({...editForm, is_approved: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="is-approved">Kullanıcı Onaylı</Label>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleSave} disabled={isProcessing}>
                    {isProcessing ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Capture Evidence Dialog */}
        {captureTarget && (
          <CaptureEvidenceDialog
            isOpen={captureDialogOpen}
            onClose={() => {
              setCaptureDialogOpen(false);
              setCaptureTarget(null);
            }}
            userId={captureTarget.userId}
            userName={captureTarget.userName}
            userEmail={captureTarget.userEmail}
            specialistId={captureTarget.specialistId}
            profileUrl={captureTarget.profileUrl}
          />
        )}
      </div>
    </div>
  );
};

export default UserManagement;
