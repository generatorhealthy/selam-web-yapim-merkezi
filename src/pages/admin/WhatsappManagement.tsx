import { useState, useEffect, useCallback, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Phone, 
  QrCode, 
  Check, 
  Edit2,
  Save,
  Wifi,
  WifiOff,
  Send,
  RefreshCw,
  Image,
  LogOut,
  Power,
  Loader2,
  Users,
  MessageSquare
} from "lucide-react";

interface WhatsappLine {
  id: string;
  phone_number: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface WahaSession {
  name: string;
  status: string;
  me?: { id: string; pushName: string };
}

const wahaApi = async (action: string, sessionName?: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('waha-proxy', {
    body: { action, sessionName, payload },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.success) {
    const detailedError = data?.error || data?.data?.message || data?.data?.error || 'Bilinmeyen WAHA hatası';
    throw new Error(String(detailedError));
  }

  return data;
};

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

  // WAHA states
  const [sessionStatus, setSessionStatus] = useState<string>("UNKNOWN");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [sessions, setSessions] = useState<WahaSession[]>([]);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Chat states
  const [chatMessage, setChatMessage] = useState("");
  const [chatTo, setChatTo] = useState("");
  const [sending, setSending] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  const getSessionName = (_line: WhatsappLine) => {
    // WAHA Core only supports a single session named 'default'
    return 'default';
  };

  const fetchLines = async () => {
    const { data, error } = await supabase
      .from('whatsapp_lines')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      toast.error("Hatlar yüklenemedi");
    } else {
      setLines(data || []);
      if (!selectedLine && data && data.length > 0) {
        const activeLine = data.find(l => l.is_active) || data[0];
        setSelectedLine(activeLine);
      }
    }
    setLoading(false);
  };

  const checkSessionStatus = useCallback(async (line: WhatsappLine) => {
    try {
      const res = await wahaApi('sessions.status', getSessionName(line));
      if (res.success && res.data) {
        setSessionStatus(res.data.status || 'STOPPED');
        if (res.data.status === 'WORKING') {
          setQrCode(null);
          stopQrPolling();
        }
      } else {
        setSessionStatus('STOPPED');
      }
    } catch {
      setSessionStatus('STOPPED');
    }
  }, []);

  const stopQrPolling = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  };

  const fetchQrCode = async (line: WhatsappLine) => {
    try {
      const res = await wahaApi('auth.qr', getSessionName(line));
      if (res.success && res.data) {
        setQrCode(res.data.value || res.data.qr || null);
      }
    } catch {
      // QR not available yet
    }
  };

  const startSession = async () => {
    if (!selectedLine) return;
    setConnecting(true);
    setQrCode(null);
    try {
      await wahaApi('sessions.start', getSessionName(selectedLine));
      toast.success("Oturum başlatılıyor...");

      setTimeout(() => fetchQrCode(selectedLine), 2000);
      qrIntervalRef.current = setInterval(async () => {
        await checkSessionStatus(selectedLine);
        if (sessionStatus !== 'WORKING') {
          await fetchQrCode(selectedLine);
        }
      }, 5000);

      setSessionStatus('SCAN_QR_CODE');
    } catch (err: any) {
      const message = err?.message || 'Bilinmeyen hata';
      toast.error(`Oturum başlatılamadı: ${message}`);
    } finally {
      setConnecting(false);
    }
  };

  const stopSession = async () => {
    if (!selectedLine) return;
    setDisconnecting(true);
    try {
      await wahaApi('sessions.logout', getSessionName(selectedLine));
      await wahaApi('sessions.stop', getSessionName(selectedLine));
      setSessionStatus('STOPPED');
      setQrCode(null);
      stopQrPolling();
      toast.success("Oturum kapatıldı");
    } catch (err: any) {
      toast.error("Oturum kapatılamadı");
    }
    setDisconnecting(false);
  };

  const sendMessage = async () => {
    if (!selectedLine || !chatTo.trim() || !chatMessage.trim()) {
      toast.error("Numara ve mesaj gerekli");
      return;
    }
    setSending(true);
    try {
      const chatId = chatTo.replace(/[^0-9]/g, '') + '@c.us';
      await wahaApi('sendText', getSessionName(selectedLine), {
        chatId,
        text: chatMessage,
      });
      toast.success("Mesaj gönderildi!");
      setChatMessage("");
    } catch (err: any) {
      toast.error("Mesaj gönderilemedi: " + (err.message || ''));
    }
    setSending(false);
  };

  const fetchChats = async () => {
    if (!selectedLine) return;
    setChatsLoading(true);
    try {
      const res = await wahaApi('chats.list', getSessionName(selectedLine));
      if (res.success && res.data) {
        setChats(Array.isArray(res.data) ? res.data.slice(0, 30) : []);
      }
    } catch {
      // ignore
    }
    setChatsLoading(false);
  };

  useEffect(() => { fetchLines(); }, []);

  useEffect(() => {
    if (selectedLine) {
      checkSessionStatus(selectedLine);
    }
    return () => stopQrPolling();
  }, [selectedLine]);

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

  const statusColor = sessionStatus === 'WORKING' ? 'bg-green-500' : 
                       sessionStatus === 'SCAN_QR_CODE' ? 'bg-yellow-500' : 'bg-red-400';
  const statusText = sessionStatus === 'WORKING' ? 'Bağlı' : 
                     sessionStatus === 'SCAN_QR_CODE' ? 'QR Bekleniyor' : 'Bağlı Değil';

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>WhatsApp Destek - Divan Paneli</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <AdminBackButton />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">WhatsApp Destek Hatları</h1>
              <p className="text-slate-500">WAHA ile şirket WhatsApp hatlarını yönetin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Lines list */}
            <div className="space-y-6">
              {isAdmin && (
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      Yeni Hat Ekle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-slate-500">Etiket</Label>
                        <Input placeholder="örn: Satış Hattı 1" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Telefon Numarası</Label>
                        <Input placeholder="örn: 905XXXXXXXXX" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={addLine} disabled={adding} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                      <Plus className="w-4 h-4 mr-2" /> Hat Ekle
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    Hatlar ({lines.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
                  ) : lines.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">Henüz hat eklenmemiş</div>
                  ) : (
                    <div className="space-y-2">
                      {lines.map((line) => (
                        <div
                          key={line.id}
                          className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedLine?.id === line.id
                              ? 'border-green-500 bg-green-50/50 shadow-lg shadow-green-500/10'
                              : 'border-slate-100 bg-white hover:border-green-200 hover:shadow-md'
                          }`}
                          onClick={() => setSelectedLine(line)}
                        >
                          {editingId === line.id ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="text-sm" />
                              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="text-sm" />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveEdit} className="bg-green-600">
                                  <Save className="w-3 h-3 mr-1" /> Kaydet
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>İptal</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  line.is_active ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-slate-200'
                                }`}>
                                  <MessageCircle className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 text-sm truncate">{line.label}</p>
                                  <p className="text-xs text-slate-500">{line.phone_number}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Badge variant={line.is_active ? "default" : "secondary"} className={`text-xs cursor-pointer ${
                                  line.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : ""
                                }`} onClick={() => isAdmin && toggleActive(line)}>
                                  {line.is_active ? "Aktif" : "Pasif"}
                                </Badge>
                                {isAdmin && (
                                  <>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => startEdit(line)}>
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => deleteLine(line.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedLine?.id === line.id && editingId !== line.id && (
                            <div className="absolute top-1 right-1">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Center + Right: WAHA Integration */}
            <div className="lg:col-span-2 space-y-6">
              {selectedLine ? (
                <>
                  {/* Connection Status Card */}
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-green-500 to-emerald-600 text-white pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <MessageCircle className="w-6 h-6" />
                            {selectedLine.label}
                          </CardTitle>
                          <CardDescription className="text-green-100 mt-1">
                            {selectedLine.phone_number}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
                          <span className="text-sm font-medium text-green-100">{statusText}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap gap-3">
                        {sessionStatus !== 'WORKING' ? (
                          <Button
                            onClick={startSession}
                            disabled={connecting}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Power className="w-4 h-4 mr-2" />}
                            Oturumu Başlat
                          </Button>
                        ) : (
                          <Button
                            onClick={stopSession}
                            disabled={disconnecting}
                            variant="destructive"
                          >
                            {disconnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                            Oturumu Kapat
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => checkSessionStatus(selectedLine)} className="border-green-200 text-green-700">
                          <RefreshCw className="w-4 h-4 mr-2" /> Durumu Kontrol Et
                        </Button>
                        {sessionStatus === 'WORKING' && (
                          <Button variant="outline" onClick={fetchChats} className="border-green-200 text-green-700">
                            <Users className="w-4 h-4 mr-2" /> Sohbetleri Yükle
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* QR Code Display */}
                  {(sessionStatus === 'SCAN_QR_CODE' || qrCode) && sessionStatus !== 'WORKING' && (
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-green-600" />
                          QR Kod ile Bağlanın
                        </CardTitle>
                        <CardDescription>
                          Telefonunuzda WhatsApp &gt; Bağlı Cihazlar &gt; Cihaz Bağla ile QR kodu okutun
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center py-8">
                        {qrCode ? (
                          <div className="p-4 bg-white rounded-2xl shadow-lg border">
                            <img 
                              src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                              alt="WhatsApp QR Code" 
                              className="w-64 h-64 object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="w-12 h-12 animate-spin text-green-500" />
                            <p className="text-slate-500">QR kod yükleniyor...</p>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-4">QR kod her 20 saniyede otomatik yenilenir</p>
                        <Button variant="ghost" className="mt-2 text-green-600" onClick={() => fetchQrCode(selectedLine)}>
                          <RefreshCw className="w-4 h-4 mr-2" /> Yenile
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Connected - Messaging & Chats */}
                  {sessionStatus === 'WORKING' && (
                    <Tabs defaultValue="send" className="space-y-4">
                      <TabsList className="bg-white/80 border shadow-sm">
                        <TabsTrigger value="send" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                          <Send className="w-4 h-4 mr-2" /> Mesaj Gönder
                        </TabsTrigger>
                        <TabsTrigger value="chats" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                          <MessageSquare className="w-4 h-4 mr-2" /> Sohbetler
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="send">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                          <CardHeader>
                            <CardTitle className="text-lg">Mesaj Gönder</CardTitle>
                            <CardDescription>Seçili hat üzerinden mesaj gönderin</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label className="text-sm text-slate-600">Alıcı Numarası</Label>
                              <Input
                                placeholder="905XXXXXXXXX"
                                value={chatTo}
                                onChange={(e) => setChatTo(e.target.value)}
                              />
                              <p className="text-xs text-slate-400 mt-1">Ülke kodu ile başlayın (örn: 905...)</p>
                            </div>
                            <div>
                              <Label className="text-sm text-slate-600">Mesaj</Label>
                              <Textarea
                                placeholder="Mesajınızı yazın..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <Button
                              onClick={sendMessage}
                              disabled={sending || !chatTo.trim() || !chatMessage.trim()}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-12"
                            >
                              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                              Gönder
                            </Button>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="chats">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                              <span>Son Sohbetler</span>
                              <Button variant="ghost" size="sm" onClick={fetchChats} disabled={chatsLoading}>
                                <RefreshCw className={`w-4 h-4 ${chatsLoading ? 'animate-spin' : ''}`} />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {chats.length === 0 ? (
                              <div className="text-center py-8 text-slate-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Sohbet yüklemek için yukarıdaki butona tıklayın</p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {chats.map((chat, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-green-50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      const num = chat.id?.user || chat.id?._serialized?.replace('@c.us', '') || '';
                                      setChatTo(num);
                                    }}
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                      <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-slate-800 text-sm truncate">
                                        {chat.name || chat.id?.user || 'Bilinmeyen'}
                                      </p>
                                      <p className="text-xs text-slate-400 truncate">
                                        {chat.lastMessage?.body || ''}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  )}
                </>
              ) : (
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <MessageCircle className="w-20 h-20 mb-4 opacity-20" />
                    <p className="text-xl font-medium">Hat Seçilmedi</p>
                    <p className="text-sm mt-1">Soldaki listeden bir hat seçin</p>
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
