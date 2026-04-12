import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Phone, 
  QrCode, 
  Check, 
  X,
  Edit2,
  Save
} from "lucide-react";

interface WhatsappLine {
  id: string;
  phone_number: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const WhatsappManagement = () => {
  const { userProfile } = useUserRole();
  const isAdmin = userProfile?.role === 'admin';

  const [lines, setLines] = useState<WhatsappLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState<WhatsappLine | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const fetchLines = async () => {
    const { data, error } = await supabase
      .from('whatsapp_lines')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      toast.error("Hatlar yüklenemedi");
      console.error(error);
    } else {
      setLines(data || []);
      if (!selectedLine && data && data.length > 0) {
        const activeLine = data.find(l => l.is_active) || data[0];
        setSelectedLine(activeLine);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchLines(); }, []);

  const addLine = async () => {
    if (!newPhone.trim() || !newLabel.trim()) {
      toast.error("Telefon numarası ve etiket gerekli");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('whatsapp_lines').insert({
      phone_number: newPhone.trim(),
      label: newLabel.trim(),
      sort_order: lines.length
    });
    if (error) {
      toast.error("Hat eklenemedi");
    } else {
      toast.success("Hat eklendi");
      setNewPhone("");
      setNewLabel("");
      fetchLines();
    }
    setAdding(false);
  };

  const deleteLine = async (id: string) => {
    if (!confirm("Bu hattı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('whatsapp_lines').delete().eq('id', id);
    if (error) {
      toast.error("Hat silinemedi");
    } else {
      toast.success("Hat silindi");
      if (selectedLine?.id === id) setSelectedLine(null);
      fetchLines();
    }
  };

  const toggleActive = async (line: WhatsappLine) => {
    const { error } = await supabase
      .from('whatsapp_lines')
      .update({ is_active: !line.is_active })
      .eq('id', line.id);
    if (error) {
      toast.error("Durum güncellenemedi");
    } else {
      fetchLines();
    }
  };

  const startEdit = (line: WhatsappLine) => {
    setEditingId(line.id);
    setEditPhone(line.phone_number);
    setEditLabel(line.label);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('whatsapp_lines')
      .update({ phone_number: editPhone.trim(), label: editLabel.trim() })
      .eq('id', editingId);
    if (error) {
      toast.error("Güncellenemedi");
    } else {
      toast.success("Hat güncellendi");
      setEditingId(null);
      fetchLines();
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/\D/g, '').replace(/^0/, '90');
  };

  const getWhatsAppUrl = (phone: string) => {
    return `https://wa.me/${formatPhoneForWhatsApp(phone)}`;
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>WhatsApp Destek - Divan Paneli</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <AdminBackButton />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">WhatsApp Destek Hatları</h1>
              <p className="text-slate-500">Şirket WhatsApp hatlarını yönetin ve QR kod ile bağlanın</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Lines list */}
            <div className="space-y-6">
              {/* Add new line - Admin only */}
              {isAdmin && (
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      Yeni Hat Ekle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-500">Etiket</Label>
                        <Input
                          placeholder="örn: Satış Hattı 1"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Telefon Numarası</Label>
                        <Input
                          placeholder="örn: 05XX XXX XXXX"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={addLine} 
                      disabled={adding}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Hat Ekle
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Lines list */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Kayıtlı Hatlar ({lines.length})
                  </CardTitle>
                  <CardDescription>Bir hat seçerek QR kodunu görüntüleyin</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
                  ) : lines.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      Henüz hat eklenmemiş
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lines.map((line) => (
                        <div
                          key={line.id}
                          className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                            selectedLine?.id === line.id
                              ? 'border-green-500 bg-green-50/50 shadow-lg shadow-green-500/10'
                              : 'border-slate-100 bg-white hover:border-green-200 hover:shadow-md'
                          }`}
                          onClick={() => setSelectedLine(line)}
                        >
                          {editingId === line.id ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="text-sm"
                              />
                              <Input
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveEdit} className="bg-green-600">
                                  <Save className="w-3 h-3 mr-1" /> Kaydet
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                  İptal
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  line.is_active 
                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                    : 'bg-slate-200'
                                }`}>
                                  <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{line.label}</p>
                                  <p className="text-sm text-slate-500">{line.phone_number}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Badge variant={line.is_active ? "default" : "secondary"} className={
                                  line.is_active 
                                    ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer" 
                                    : "cursor-pointer"
                                } onClick={() => isAdmin && toggleActive(line)}>
                                  {line.is_active ? "Aktif" : "Pasif"}
                                </Badge>
                                {isAdmin && (
                                  <>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                      onClick={() => startEdit(line)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                                      onClick={() => deleteLine(line.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedLine?.id === line.id && editingId !== line.id && (
                            <div className="absolute top-2 right-2">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: WhatsApp Web panel */}
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Selected line info & WhatsApp Web button */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MessageCircle className="w-6 h-6" />
                    WhatsApp Web
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Seçili hattın WhatsApp Web hesabını açın
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  {selectedLine ? (
                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/30">
                        <MessageCircle className="w-12 h-12 text-white" />
                      </div>
                      
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-slate-800">{selectedLine.label}</h3>
                        <p className="text-lg text-green-600 font-mono font-semibold">{selectedLine.phone_number}</p>
                        <Badge className={selectedLine.is_active 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                        }>
                          {selectedLine.is_active ? "✓ Aktif Hat" : "✗ Pasif Hat"}
                        </Badge>
                      </div>

                      <div className="w-full space-y-3">
                        <Button
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-14 text-lg font-semibold"
                          onClick={() => window.open('https://web.whatsapp.com', '_blank')}
                        >
                          <QrCode className="w-6 h-6 mr-2" />
                          WhatsApp Web Aç
                        </Button>
                        <p className="text-xs text-center text-slate-400">
                          Açılan sayfada telefonunuzdan ({selectedLine.label}) QR kodu okutun
                        </p>
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          <Button
                            variant="outline"
                            className="w-full border-green-200 text-green-700 hover:bg-green-50 h-11"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedLine.phone_number);
                              toast.success("Numara kopyalandı!");
                            }}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Numarayı Kopyala
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">Hat Seçilmedi</p>
                      <p className="text-sm">Soldaki listeden bir hat seçin</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick access: all active lines */}
              {lines.filter(l => l.is_active).length > 1 && (
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-700">Hızlı Erişim - Tüm Aktif Hatlar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lines.filter(l => l.is_active).map((line) => (
                      <Button
                        key={line.id}
                        variant={selectedLine?.id === line.id ? "default" : "outline"}
                        className={`w-full justify-between h-12 ${
                          selectedLine?.id === line.id 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                            : 'border-green-100 text-slate-700 hover:bg-green-50'
                        }`}
                        onClick={() => {
                          setSelectedLine(line);
                          window.open('https://web.whatsapp.com', '_blank');
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          {line.label}
                        </span>
                        <span className="text-xs opacity-75">{line.phone_number}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default WhatsappManagement;
