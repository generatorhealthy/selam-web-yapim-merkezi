import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

import { 
  MessageCircle, Plus, Trash2, Phone, QrCode, Check, Edit2, Save,
  Send, RefreshCw, LogOut, Power, Loader2, Users, MessageSquare,
  Search, MoreVertical, Smile, Paperclip, Mic, ArrowLeft, Settings,
  CircleDot, X, CheckCheck
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
  if (error) throw new Error(error.message);
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
  const [showAddForm, setShowAddForm] = useState(false);

  const [sessionStatus, setSessionStatus] = useState<string>("UNKNOWN");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const [chatMessage, setChatMessage] = useState("");
  const [chatTo, setChatTo] = useState("");
  const [sending, setSending] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getSessionName = (line: WhatsappLine) => `line_${line.id.replace(/-/g, '').substring(0, 16)}`;

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
        setQrCode(res.data.qr || res.data.value || (typeof res.data === 'string' ? res.data : null));
      }
    } catch {}
  };

  const startSession = async () => {
    if (!selectedLine) return;
    setConnecting(true);
    setQrCode(null);
    stopQrPolling();
    try {
      await wahaApi('sessions.start', getSessionName(selectedLine));
      toast.success("Oturum başlatılıyor...");
    } catch (err: any) {
      const message = err?.message || '';
      if (!message.includes('already started')) {
        toast.error(`Oturum başlatılamadı: ${message}`);
        setConnecting(false);
        return;
      }
      toast.info("Oturum zaten başlatılmış, QR kod alınıyor...");
    }
    setSessionStatus('SCAN_QR_CODE');
    setTimeout(() => fetchQrCode(selectedLine), 1500);
    qrIntervalRef.current = setInterval(async () => {
      await checkSessionStatus(selectedLine);
      if (sessionStatus !== 'WORKING') {
        await fetchQrCode(selectedLine);
      }
    }, 5000);
    setConnecting(false);
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
    } catch {
      toast.error("Oturum kapatılamadı");
    }
    setDisconnecting(false);
  };

  const getActiveChatId = () => {
    if (activeChat) {
      return activeChat.id?._serialized || activeChat.id?.user + '@c.us' || '';
    }
    const num = chatTo.replace(/[^0-9]/g, '');
    return num ? num + '@c.us' : '';
  };

  const sendMessage = async () => {
    if (!selectedLine || !chatMessage.trim()) {
      toast.error("Mesaj gerekli");
      return;
    }
    const chatId = getActiveChatId();
    if (!chatId) {
      toast.error("Alıcı numarası gerekli");
      return;
    }
    setSending(true);
    const msgText = chatMessage;
    setChatMessage("");
    // Optimistic: add message locally
    setChatMessages(prev => [...prev, { body: msgText, fromMe: true, timestamp: Math.floor(Date.now() / 1000), _optimistic: true }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      await wahaApi('sendText', getSessionName(selectedLine), { chatId, text: msgText });
    } catch (err: any) {
      toast.error("Mesaj gönderilemedi: " + (err.message || ''));
      setChatMessage(msgText);
      setChatMessages(prev => prev.filter(m => !m._optimistic));
    }
    setSending(false);
  };

  const fetchChats = async () => {
    if (!selectedLine) return;
    setChatsLoading(true);
    try {
      const res = await wahaApi('chats.list', getSessionName(selectedLine));
      if (res.success && res.data) {
        setChats(Array.isArray(res.data) ? res.data.slice(0, 50) : []);
      }
    } catch {}
    setChatsLoading(false);
  };

  const fetchChatMessages = async (chat?: any, silent = false) => {
    if (!selectedLine) return;
    const targetChat = chat || activeChat;
    if (!targetChat) return;
    if (!silent) setMessagesLoading(true);
    const chatId = targetChat.id?._serialized || targetChat.id?.user + '@c.us' || '';
    try {
      const res = await wahaApi('chats.messages', getSessionName(selectedLine), { chatId, limit: 50 });
      if (res.success && res.data) {
        const msgs = Array.isArray(res.data) ? res.data : [];
        // Sort by timestamp ascending (oldest first)
        msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
        setChatMessages(msgs);
        if (!silent) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {}
    if (!silent) setMessagesLoading(false);
  };

  const openChat = (chat: any) => {
    setActiveChat(chat);
    const num = chat.id?.user || chat.id?._serialized?.replace('@c.us', '').replace('@lid', '') || '';
    setChatTo(num);
    fetchChatMessages(chat);
  };

  useEffect(() => { fetchLines(); }, []);
  useEffect(() => {
    if (selectedLine) {
      checkSessionStatus(selectedLine);
      setActiveChat(null);
      setChats([]);
      setChatMessages([]);
    }
    return () => stopQrPolling();
  }, [selectedLine]);

  useEffect(() => {
    if (sessionStatus === 'WORKING' && selectedLine) {
      fetchChats();
    }
  }, [sessionStatus, selectedLine]);

  // Auto-refresh messages every 3 seconds when a chat is open
  useEffect(() => {
    if (sessionStatus !== 'WORKING' || !activeChat) return;
    const interval = setInterval(() => {
      fetchChatMessages(activeChat, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionStatus, activeChat, selectedLine]);

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
      setNewPhone(""); setNewLabel(""); setShowAddForm(false);
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
    const { error } = await supabase.from('whatsapp_lines').update({ is_active: !line.is_active }).eq('id', line.id);
    if (error) toast.error("Durum güncellenemedi");
    else fetchLines();
  };

  const startEdit = (line: WhatsappLine) => {
    setEditingId(line.id);
    setEditPhone(line.phone_number);
    setEditLabel(line.label);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('whatsapp_lines')
      .update({ phone_number: editPhone.trim(), label: editLabel.trim() })
      .eq('id', editingId);
    if (error) toast.error("Güncellenemedi");
    else { toast.success("Hat güncellendi"); setEditingId(null); fetchLines(); }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const name = chat.name || chat.id?.user || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>WhatsApp Destek - Divan Paneli</title>
      </Helmet>
      <div className="min-h-screen bg-[#111b21]">
        <HorizontalNavigation />
        <div className="container mx-auto px-2 sm:px-4 py-4 max-w-7xl">
          <AdminBackButton />

          {/* WhatsApp-style container */}
          <div className="bg-[#222e35] rounded-lg overflow-hidden shadow-2xl border border-[#313d45]" style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}>
            <div className="flex h-full">

              {/* ===== LEFT SIDEBAR ===== */}
              <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-[#313d45] bg-[#111b21]">
                
                {/* Sidebar Header - Line selector */}
                <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-[#e9edef] text-sm font-medium">
                        {selectedLine ? selectedLine.label : 'WhatsApp'}
                      </h2>
                      {selectedLine && (
                        <p className="text-[#8696a0] text-xs">{selectedLine.phone_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {sessionStatus === 'WORKING' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00a884] mr-1" />
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="p-2 rounded-full hover:bg-[#313d45] text-[#aebac1] transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 rounded-full hover:bg-[#313d45] text-[#aebac1] transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Add line form */}
                {showAddForm && isAdmin && (
                  <div className="bg-[#202c33] border-b border-[#313d45] px-4 py-3 space-y-2">
                    <Input
                      placeholder="Hat adı"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="bg-[#2a3942] border-0 text-[#e9edef] placeholder:text-[#8696a0] h-9 text-sm rounded-lg"
                    />
                    <Input
                      placeholder="905XXXXXXXXX"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="bg-[#2a3942] border-0 text-[#e9edef] placeholder:text-[#8696a0] h-9 text-sm rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addLine} disabled={adding} className="flex-1 bg-[#00a884] hover:bg-[#06cf9c] text-white h-8 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Ekle
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="text-[#8696a0] hover:bg-[#313d45] h-8 text-xs">
                        İptal
                      </Button>
                    </div>
                  </div>
                )}

                {/* Search bar */}
                <div className="px-3 py-2 bg-[#111b21]">
                  <div className="flex items-center bg-[#202c33] rounded-lg px-3 py-1.5">
                    <Search className="w-4 h-4 text-[#8696a0] mr-3 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Ara veya yeni sohbet başlat"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-[#e9edef] text-sm placeholder:text-[#8696a0] outline-none w-full"
                    />
                  </div>
                </div>

                {/* Lines / Chats list */}
                <div className="flex-1 overflow-y-auto">
                  {/* Lines section */}
                  <div className="px-3 py-2">
                    <p className="text-[#00a884] text-xs font-medium px-1 mb-1">HATLAR ({lines.length})</p>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
                    </div>
                  ) : (
                    lines.map((line) => (
                      <div
                        key={line.id}
                        onClick={() => setSelectedLine(line)}
                        className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-[#222e35] ${
                          selectedLine?.id === line.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          line.is_active ? 'bg-[#00a884]' : 'bg-[#3b4a54]'
                        }`}>
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[#e9edef] text-sm font-medium truncate">{line.label}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              line.is_active ? 'text-[#00a884]' : 'text-[#8696a0]'
                            }`}>
                              {line.is_active ? '● Aktif' : '○ Pasif'}
                            </span>
                          </div>
                          <p className="text-[#8696a0] text-xs truncate">{line.phone_number}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => startEdit(line)} className="p-1.5 rounded hover:bg-[#313d45] text-[#8696a0]">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteLine(line.id)} className="p-1.5 rounded hover:bg-[#313d45] text-[#8696a0] hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Edit modal inline */}
                  {editingId && (
                    <div className="px-3 py-3 bg-[#202c33] border-b border-[#313d45] space-y-2">
                      <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                        className="bg-[#2a3942] border-0 text-[#e9edef] h-8 text-sm" />
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                        className="bg-[#2a3942] border-0 text-[#e9edef] h-8 text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="bg-[#00a884] hover:bg-[#06cf9c] h-7 text-xs">
                          <Save className="w-3 h-3 mr-1" /> Kaydet
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-[#8696a0] h-7 text-xs">İptal</Button>
                      </div>
                    </div>
                  )}

                  {/* Chats section (when connected) */}
                  {sessionStatus === 'WORKING' && chats.length > 0 && (
                    <>
                      <div className="px-3 py-2 mt-2">
                        <p className="text-[#00a884] text-xs font-medium px-1 mb-1">SOHBETLER</p>
                      </div>
                      {filteredChats.map((chat, i) => (
                        <div
                          key={i}
                          onClick={() => openChat(chat)}
                          className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-[#222e35] ${
                            activeChat === chat ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-[#6b7c85] flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-[#cfd6da]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-[#e9edef] text-sm font-medium truncate">
                                {chat.name || chat.id?.user || 'Bilinmeyen'}
                              </p>
                              <span className="text-[#8696a0] text-[11px] flex-shrink-0">
                                {chat.lastMessage?.timestamp ? formatTime(chat.lastMessage.timestamp) : ''}
                              </span>
                            </div>
                            <p className="text-[#8696a0] text-xs truncate mt-0.5">
                              {chat.lastMessage?.body || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* ===== RIGHT PANEL ===== */}
              <div className="flex-1 flex flex-col bg-[#0b141a]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M20 0 L20 40 M0 20 L40 20\' stroke=\'%23ffffff\' stroke-width=\'0.3\' opacity=\'0.03\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'url(%23p)\' width=\'400\' height=\'400\'/%3E%3C/svg%3E")',
              }}>
                {selectedLine ? (
                  <>
                    {/* Chat header */}
                    <div className="bg-[#202c33] px-4 py-2.5 flex items-center justify-between border-b border-[#313d45]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center">
                          {activeChat ? (
                            <Users className="w-5 h-5 text-[#cfd6da]" />
                          ) : (
                            <MessageCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-[#e9edef] text-sm font-medium">
                            {activeChat ? (activeChat.name || activeChat.id?.user || 'Sohbet') : selectedLine.label}
                          </p>
                          <p className="text-[#8696a0] text-xs">
                            {activeChat 
                              ? (activeChat.id?.user || '') 
                              : (sessionStatus === 'WORKING' ? 'Çevrimiçi' : sessionStatus === 'SCAN_QR_CODE' ? 'QR bekleniyor...' : 'Çevrimdışı')
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {sessionStatus === 'WORKING' && (
                          <>
                            <button onClick={fetchChats} className="p-2 rounded-full hover:bg-[#313d45] text-[#aebac1]">
                              <RefreshCw className={`w-5 h-5 ${chatsLoading ? 'animate-spin' : ''}`} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => checkSessionStatus(selectedLine)}
                          className="p-2 rounded-full hover:bg-[#313d45] text-[#aebac1]"
                        >
                          <Search className="w-5 h-5" />
                        </button>
                        {sessionStatus === 'WORKING' ? (
                          <button
                            onClick={stopSession}
                            disabled={disconnecting}
                            className="p-2 rounded-full hover:bg-[#313d45] text-red-400"
                          >
                            {disconnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                          </button>
                        ) : (
                          <button
                            onClick={startSession}
                            disabled={connecting}
                            className="p-2 rounded-full hover:bg-[#313d45] text-[#00a884]"
                          >
                            {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chat body */}
                    <div className="flex-1 overflow-y-auto px-[10%] py-4">
                      {/* QR Code state */}
                      {(sessionStatus === 'SCAN_QR_CODE' || qrCode) && sessionStatus !== 'WORKING' && (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="bg-[#202c33] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                            <div className="w-16 h-16 rounded-full bg-[#00a884] flex items-center justify-center mx-auto mb-4">
                              <QrCode className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-[#e9edef] text-xl font-light mb-2">WhatsApp Web'i kullanın</h3>
                            <p className="text-[#8696a0] text-sm mb-6">
                              Telefonunuzda WhatsApp açın → Ayarlar → Bağlı Cihazlar → Cihaz Bağla
                            </p>
                            {qrCode ? (
                              <div className="bg-white rounded-xl p-4 inline-block mb-4">
                                <img
                                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                  alt="WhatsApp QR Code"
                                  className="w-56 h-56 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2 className="w-10 h-10 animate-spin text-[#00a884]" />
                                <p className="text-[#8696a0] text-sm">QR kod yükleniyor...</p>
                              </div>
                            )}
                            <button
                              onClick={() => fetchQrCode(selectedLine)}
                              className="text-[#00a884] text-sm hover:underline flex items-center gap-1 mx-auto"
                            >
                              <RefreshCw className="w-3 h-3" /> QR kodu yenile
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Not connected state */}
                      {sessionStatus !== 'WORKING' && sessionStatus !== 'SCAN_QR_CODE' && !qrCode && (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="bg-[#202c33] rounded-2xl p-8 max-w-md w-full text-center">
                            <div className="w-20 h-20 rounded-full bg-[#2a3942] flex items-center justify-center mx-auto mb-4">
                              <MessageCircle className="w-10 h-10 text-[#8696a0]" />
                            </div>
                            <h3 className="text-[#e9edef] text-xl font-light mb-2">WhatsApp Web</h3>
                            <p className="text-[#8696a0] text-sm mb-6">
                              Oturumu başlatmak için sağ üstteki <Power className="w-4 h-4 inline text-[#00a884]" /> butonuna tıklayın
                            </p>
                            <Button
                              onClick={startSession}
                              disabled={connecting}
                              className="bg-[#00a884] hover:bg-[#06cf9c] text-white px-8"
                            >
                              {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Power className="w-4 h-4 mr-2" />}
                              Oturumu Başlat
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Connected - chat messages or new message */}
                      {sessionStatus === 'WORKING' && (
                        <>
                          {activeChat && chatMessages.length > 0 ? (
                            <div className="space-y-1">
                              {chatMessages.map((msg, i) => {
                                const isMe = msg.fromMe;
                                return (
                                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[65%] rounded-lg px-3 py-1.5 mb-0.5 shadow-sm ${
                                      isMe ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#e9edef]'
                                    }`}>
                                      <p className="text-sm whitespace-pre-wrap break-words">{msg.body || ''}</p>
                                      <div className="flex items-center justify-end gap-1 mt-0.5">
                                        <span className="text-[10px] text-[#8696a0]">
                                          {msg.timestamp ? formatTime(msg.timestamp) : ''}
                                        </span>
                                        {isMe && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : activeChat ? (
                            <div className="flex items-center justify-center h-full">
                              {messagesLoading ? (
                                <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
                              ) : (
                                <p className="text-[#8696a0] text-sm">Henüz mesaj yok</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <p className="text-[#8696a0] text-sm">Sohbet seçin veya yeni mesaj gönderin</p>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                              ) : (
                                <p className="text-[#8696a0] text-sm">Henüz mesaj yok</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <p className="text-[#8696a0] text-sm">Sohbet seçin veya yeni mesaj gönderin</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Message input bar */}
                    {sessionStatus === 'WORKING' && (
                      <div className="bg-[#202c33] px-4 py-2.5 border-t border-[#313d45]">
                        {/* Recipient input if no active chat */}
                        {!activeChat && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#8696a0] text-xs">Alıcı:</span>
                            <input
                              type="text"
                              placeholder="905XXXXXXXXX"
                              value={chatTo}
                              onChange={(e) => setChatTo(e.target.value)}
                              className="flex-1 bg-[#2a3942] text-[#e9edef] text-sm placeholder:text-[#8696a0] outline-none rounded-lg px-3 py-1.5"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-full hover:bg-[#313d45] text-[#8696a0] flex-shrink-0">
                            <Smile className="w-6 h-6" />
                          </button>
                          <button className="p-2 rounded-full hover:bg-[#313d45] text-[#8696a0] flex-shrink-0">
                            <Paperclip className="w-6 h-6" />
                          </button>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Bir mesaj yazın"
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                              className="w-full bg-[#2a3942] text-[#e9edef] text-sm placeholder:text-[#8696a0] outline-none rounded-lg px-4 py-2.5"
                            />
                          </div>
                          {chatMessage.trim() ? (
                            <button
                              onClick={sendMessage}
                              disabled={sending}
                              className="p-2 rounded-full hover:bg-[#313d45] text-[#00a884] flex-shrink-0"
                            >
                              {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                            </button>
                          ) : (
                            <button className="p-2 rounded-full hover:bg-[#313d45] text-[#8696a0] flex-shrink-0">
                              <Mic className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* No line selected */
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-[320px] h-[188px] mx-auto mb-6 flex items-center justify-center">
                        <MessageCircle className="w-24 h-24 text-[#364147]" />
                      </div>
                      <h2 className="text-[#e9edef] text-3xl font-light mb-3">WhatsApp Web</h2>
                      <p className="text-[#8696a0] text-sm max-w-sm">
                        Soldaki listeden bir hat seçerek WhatsApp oturumunu başlatın
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default WhatsappManagement;
