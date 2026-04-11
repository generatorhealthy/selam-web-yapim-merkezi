import { useState, useEffect, useMemo } from "react";
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
import { ArrowLeft, Edit, Eye, EyeOff, Trash2, Users, RefreshCw, Camera, Search, X, UserCheck, UserX, Shield } from "lucide-react";
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
  phone?: string;
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

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleFilter !== "all") {
      result = result.filter(u => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, searchQuery, roleFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const specialists = users.filter(u => u.role === 'specialist').length;
    const approved = users.filter(u => u.is_approved).length;
    const admins = users.filter(u => u.role === 'admin').length;
    return { total, specialists, approved, admins };
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        toast({
          title: "Hata",
          description: "Kullanıcı profilleri yüklenirken bir hata oluştu: " + profilesError.message,
          variant: "destructive"
        });
        return;
      }

      const userProfiles = profiles?.map(profile => ({
        ...profile,
        name: profile.name || 'İsimsiz Kullanıcı',
        email: profile.email || `user-${profile.user_id.slice(0, 8)}`
      })) || [];

      setUsers(userProfiles);
      toast({ title: "Başarılı", description: `${userProfiles.length} kullanıcı yüklendi.` });
    } catch (error) {
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

    if (!editForm.email.trim()) {
      toast({ title: "Hata", description: "E-posta adresi gereklidir.", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast({ title: "Hata", description: "Geçerli bir e-posta adresi girin.", variant: "destructive" });
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      toast({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({ title: "Hata", description: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.", variant: "destructive" });
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

      if (response.error) {
        toast({ title: "Hata", description: "Kullanıcı güncellenirken bir hata oluştu: " + response.error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Başarılı", description: "Kullanıcı bilgileri başarıyla güncellendi." });
      setIsEditDialogOpen(false);
      setEditForm({ email: "", password: "", role: "user", is_approved: false });
      fetchUsers();
    } catch (error) {
      toast({ title: "Hata", description: "Beklenmeyen bir hata oluştu: " + (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    handleDelete(user);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`${user.name || user.user_id} kullanıcısını tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;

    setIsProcessing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({ title: "Hata", description: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke('secure-user-management', {
        body: { action: 'deleteUser', userId: user.user_id }
      });

      if (response.error) {
        toast({ title: "Hata", description: "Kullanıcı silinirken bir hata oluştu: " + response.error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Başarılı", description: "Kullanıcı ve tüm ilişkili verileri tamamen silindi." });
      setDeletingUsers(prev => {
        const { [user.id]: removed, ...rest } = prev;
        return rest;
      });
      fetchUsers();
    } catch (error) {
      toast({ title: "Hata", description: "Beklenmeyen bir hata oluştu: " + (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureEvidence = async (user: UserProfile) => {
    try {
      const { data: specialist, error } = await supabase
        .from('specialists')
        .select('id, name, specialty')
        .eq('user_id', user.user_id)
        .single();

      let profileUrl = undefined;
      let specialistId = undefined;

      if (specialist && !error) {
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
      toast({ title: "Hata", description: "Uzman bilgileri alınamadı.", variant: "destructive" });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'specialist': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'staff': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'legal': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'muhasebe': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'specialist': return 'Uzman';
      case 'staff': return 'Staff';
      case 'legal': return 'Hukuk';
      case 'muhasebe': return 'Muhasebe';
      default: return 'Kullanıcı';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Kullanıcılar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/divan_paneli/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Geri Dön
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Kullanıcı Yönetimi</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Tüm kullanıcıları yönetin ve düzenleyin</p>
            </div>
          </div>
          <Button onClick={fetchUsers} disabled={loading} size="sm">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Yenile
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Toplam</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.specialists}</p>
                <p className="text-xs text-muted-foreground">Uzman</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Onaylı</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="İsim, e-posta veya telefon ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Rol Filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="user">Kullanıcı</SelectItem>
                  <SelectItem value="specialist">Uzman</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="legal">Hukuk</SelectItem>
                  <SelectItem value="muhasebe">Muhasebe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || roleFilter !== "all") && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{filteredUsers.length} sonuç bulundu</span>
                {(searchQuery || roleFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => { setSearchQuery(""); setRoleFilter("all"); }}
                  >
                    Filtreleri Temizle
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              Kullanıcı Listesi ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Ad Soyad</TableHead>
                    <TableHead className="font-semibold">E-posta</TableHead>
                    <TableHead className="font-semibold">Telefon</TableHead>
                    <TableHead className="font-semibold">Rol</TableHead>
                    <TableHead className="font-semibold">Durum</TableHead>
                    <TableHead className="font-semibold">Kayıt Tarihi</TableHead>
                    <TableHead className="font-semibold text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell className="font-medium text-foreground">
                        {user.name || 'İsimsiz Kullanıcı'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.phone || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getRoleBadgeVariant(user.role)}`}>
                          {getRoleText(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${user.is_approved ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : "bg-orange-500/10 text-orange-700 border-orange-200"}`}>
                          {user.is_approved ? "Onaylı" : "Beklemede"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 justify-end">
                          <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={() => handleEdit(user)}>
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Düzenle
                          </Button>
                          {user.role === 'specialist' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => handleCaptureEvidence(user)}
                            >
                              <Camera className="w-3.5 h-3.5 mr-1" />
                              Kanıt
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2.5"
                            onClick={() => handleDeleteClick(user)}
                            disabled={isProcessing}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Sil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Sonuç bulunamadı</p>
                <p className="text-sm mt-1">Arama kriterlerinizi değiştirmeyi deneyin</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kullanıcı Düzenle</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label>Ad Soyad</Label>
                  <Input value={selectedUser.name || 'İsimsiz Kullanıcı'} disabled className="bg-muted" />
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
                  <Input value={selectedUser.user_id} disabled className="bg-muted text-xs" />
                </div>
                <div>
                  <Label htmlFor="edit-password">Yeni Parola (Opsiyonel)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      value={editForm.password}
                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                      placeholder="Min 6 karakter"
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-role">Kullanıcı Rolü *</Label>
                  <Select value={editForm.role} onValueChange={(value: UserRole) => setEditForm({...editForm, role: value})}>
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
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleSave} disabled={isProcessing}>
                    {isProcessing ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {captureTarget && (
          <CaptureEvidenceDialog
            isOpen={captureDialogOpen}
            onClose={() => { setCaptureDialogOpen(false); setCaptureTarget(null); }}
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
