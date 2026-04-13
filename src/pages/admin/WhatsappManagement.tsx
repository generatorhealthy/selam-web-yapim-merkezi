import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  MessageCircle, Plus, Trash2, Phone, QrCode, Check, Edit2, Save,
  Send, RefreshCw, LogOut, Power, Loader2, Users, Search,
  MoreVertical, Smile, Paperclip, Mic, ArrowLeft, X, CheckCheck,
  UserPlus, ChevronDown
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface WhatsappLine {
  id: string;
  phone_number: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
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

  // Lines
  const [lines, setLines] = useState<WhatsappLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState<WhatsappLine | null>(null);
  const [showAddLineDialog, setShowAddLineDialog] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingLine, setEditingLine] = useState<WhatsappLine | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editLabel, setEditLabel] = useState("");

  // Session
  const [sessionStatus, setSessionStatus] = useState<string>("UNKNOWN");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Chat
  const [chatMessage, setChatMessage] = useState("");
  const [chatTo, setChatTo] = useState("");
  const [sending, setSending] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // New chat dialog
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [newChatName, setNewChatName] = useState("");
  const [newChatSurname, setNewChatSurname] = useState("");
  const [newChatPhone, setNewChatPhone] = useState("");

  const getSessionName = (line: WhatsappLine) => `line_${line.id.replace(/-/g, '').substring(0, 16)}`;

  const stopQrPolling = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
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
        const status = res.data.status || 'STOPPED';
        setSessionStatus(status);
        if (status === 'WORKING') {
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
    if (!selectedLine || !chatMessage.trim()) return;
    const chatId = getActiveChatId();
    if (!chatId) {
      toast.error("Alıcı numarası gerekli");
      return;
    }
    setSending(true);
    const msgText = chatMessage;
    setChatMessage("");
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
        const chatList = Array.isArray(res.data) ? res.data.slice(0, 50) : [];
        setChats(chatList);
        // Fetch profile pictures for all chats
        chatList.forEach((chat: any) => {
          const contactId = chat.id?._serialized || (chat.id?.user ? chat.id.user + '@c.us' : '');
          if (contactId && !profilePics[contactId]) {
            fetchProfilePic(contactId);
          }
        });
      }
    } catch {}
    setChatsLoading(false);
  };

  const fetchProfilePic = async (contactId: string) => {
    if (!selectedLine || profilePics[contactId]) return;
    try {
      const res = await wahaApi('contacts.profile-picture', getSessionName(selectedLine), { contactId });
      if (res.success && res.data) {
        const picUrl = typeof res.data === 'string' ? res.data : res.data?.profilePictureUrl || res.data?.url || res.data?.profilePicUrl || null;
        if (picUrl) {
          setProfilePics(prev => ({ ...prev, [contactId]: picUrl }));
        }
      }
    } catch {}
  };

  const fetchChatMessages = async (chat?: any, silent = false) => {
    if (!selectedLine) return;
    const targetChat = chat || activeChat;
    if (!targetChat) return;
    if (!silent) setMessagesLoading(true);
    const chatId = targetChat.id?._serialized || targetChat.id?.user + '@c.us' || '';
    try {
      const res = await wahaApi('chats.messages', getSessionName(selectedLine), { chatId, limit: 1000 });
      if (res.success && res.data) {
        const msgs = Array.isArray(res.data) ? res.data : [];
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

  const startNewChat = () => {
    if (!newChatPhone.trim()) {
      toast.error("Telefon numarası gerekli");
      return;
    }
    const num = newChatPhone.replace(/[^0-9]/g, '');
    const fullName = `${newChatName.trim()} ${newChatSurname.trim()}`.trim();
    const fakeChatObj = {
      id: { _serialized: num + '@c.us', user: num },
      name: fullName || num,
      _isNewChat: true,
    };
    setActiveChat(fakeChatObj);
    setChatTo(num);
    setChatMessages([]);
    setShowNewChatDialog(false);
    setNewChatName("");
    setNewChatSurname("");
    setNewChatPhone("");
  };

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
      setNewPhone(""); setNewLabel(""); setShowAddLineDialog(false);
      fetchLines();
    }
    setAdding(false);
  };

  const deleteLine = async (id: string) => {
    if (!confirm("Bu hattı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from('whatsapp_lines').delete().eq('id', id);
    if (error) toast.error("Hat silinemedi");
    else {
      toast.success("Hat silindi");
      if (selectedLine?.id === id) setSelectedLine(null);
      fetchLines();
    }
  };

  const saveEdit = async () => {
    if (!editingLine) return;
    const { error } = await supabase.from('whatsapp_lines')
      .update({ phone_number: editPhone.trim(), label: editLabel.trim() })
      .eq('id', editingLine.id);
    if (error) toast.error("Güncellenemedi");
    else { toast.success("Hat güncellendi"); setEditingLine(null); fetchLines(); }
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
    if (sessionStatus === 'WORKING' && selectedLine) fetchChats();
  }, [sessionStatus, selectedLine]);

  useEffect(() => {
    if (sessionStatus !== 'WORKING' || !activeChat) return;
    const interval = setInterval(() => fetchChatMessages(activeChat, true), 3000);
    return () => clearInterval(interval);
  }, [sessionStatus, activeChat, selectedLine]);

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

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Bugün';
    if (d.toDateString() === yesterday.toDateString()) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const connectionStatusColor = sessionStatus === 'WORKING' ? 'bg-green-500' : sessionStatus === 'SCAN_QR_CODE' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500';
  const connectionStatusText = sessionStatus === 'WORKING' ? 'Bağlı' : sessionStatus === 'SCAN_QR_CODE' ? 'QR Bekleniyor' : 'Bağlı Değil';

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>WhatsApp Destek - Divan Paneli</title>
      </Helmet>

      <div className="fixed inset-0 bg-[#f0f2f5] flex flex-col">
        {/* Top bar */}
        <div className="h-12 bg-[#008069] flex items-center px-4 gap-3 flex-shrink-0 z-10">
          <AdminBackButton />
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
             <h1 className="text-white text-sm font-semibold">WhatsApp Destek</h1>
          </div>
          {selectedLine && (
            <div className="flex items-center gap-2 ml-4">
              <div className={`w-2 h-2 rounded-full ${connectionStatusColor}`} />
               <span className="text-white/80 text-xs">{connectionStatusText}</span>
               <span className="text-white/80 text-xs">• {selectedLine.label}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            {selectedLine && sessionStatus !== 'WORKING' && (
              <Button
                size="sm"
                onClick={startSession}
                disabled={connecting}
                className="bg-[#00a884] hover:bg-[#06cf9c] text-white h-8 text-xs gap-1"
              >
                {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                Bağlan
              </Button>
            )}
            {selectedLine && sessionStatus === 'WORKING' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={stopSession}
                disabled={disconnecting}
                className="text-white hover:bg-white/20 h-8 text-xs gap-1"
              >
                {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                Çıkış
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* ===== LEFT SIDEBAR ===== */}
          <div className="w-[360px] flex-shrink-0 flex flex-col border-r border-[#e9edef] bg-white">
            
            {/* Line selector dropdown + actions */}
            <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-2 border-b border-[#e9edef]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-1 flex items-center gap-2 bg-[#f5f6f6] rounded-lg px-3 py-2 text-left hover:bg-[#e9edef] transition-colors">
                    <Phone className="w-4 h-4 text-[#00a884] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#111b21] text-sm truncate">
                        {selectedLine ? selectedLine.label : 'Hat Seçin'}
                      </p>
                      {selectedLine && (
                        <p className="text-[#667781] text-[10px]">{selectedLine.phone_number}</p>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#667781] flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-[#e9edef] w-[320px]" align="start">
                  {lines.map(line => (
                    <DropdownMenuItem
                      key={line.id}
                      onClick={() => setSelectedLine(line)}
                      className={`text-[#111b21] hover:bg-[#f5f6f6] cursor-pointer py-2.5 ${selectedLine?.id === line.id ? 'bg-[#f5f6f6]' : ''}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${line.is_active ? 'bg-[#00a884]' : 'bg-[#dfe5e7]'}`}>
                          <Phone className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{line.label}</p>
                          <p className="text-[#667781] text-xs">{line.phone_number}</p>
                        </div>
                        {line.is_active && <span className="text-[10px] text-[#00a884]">● Aktif</span>}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-[#e9edef]" />
                      <DropdownMenuItem
                        onClick={() => setShowAddLineDialog(true)}
                        className="text-[#00a884] hover:bg-[#f5f6f6] cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Yeni Hat Ekle
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Line management for admin */}
              {isAdmin && selectedLine && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-[#e9edef] text-[#54656f]">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-[#e9edef]" align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingLine(selectedLine);
                        setEditPhone(selectedLine.phone_number);
                        setEditLabel(selectedLine.label);
                      }}
                      className="text-[#111b21] hover:bg-[#f5f6f6] cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Hattı Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteLine(selectedLine.id)}
                      className="text-red-400 hover:bg-[#f5f6f6] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Hattı Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* New chat button */}
              {sessionStatus === 'WORKING' && (
                <button
                  onClick={() => setShowNewChatDialog(true)}
                  className="p-2 rounded-lg hover:bg-[#e9edef] text-[#00a884] flex-shrink-0"
                  title="Yeni Sohbet"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Search bar */}
            <div className="px-3 py-2">
              <div className="flex items-center bg-[#f0f2f5] rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-[#667781] mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Sohbet ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[#111b21] text-sm placeholder:text-[#667781] outline-none w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-[#667781] hover:text-[#111b21]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Chats list */}
            <div className="flex-1 overflow-y-auto">
              {sessionStatus === 'WORKING' ? (
                <>
                  {chatsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
                    </div>
                  ) : filteredChats.length > 0 ? (
                    filteredChats.map((chat, i) => {
                      const isActive = activeChat && (activeChat.id?._serialized === chat.id?._serialized);
                      const lastMsgTime = chat.lastMessage?.timestamp;
                      return (
                        <div
                          key={i}
                          onClick={() => openChat(chat)}
                          className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-[#f0f2f5] ${
                            isActive ? 'bg-[#f5f6f6]' : 'hover:bg-[#f0f2f5]'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-[#111b21] text-sm font-medium truncate">
                                {chat.name || chat.id?.user || 'Bilinmeyen'}
                              </p>
                              <span className="text-[#667781] text-[11px] flex-shrink-0 ml-2">
                                {lastMsgTime ? formatDate(lastMsgTime) : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {chat.lastMessage?.fromMe && <CheckCheck className="w-3 h-3 text-[#53bdeb] flex-shrink-0" />}
                              <p className="text-[#667781] text-xs truncate">
                                {chat.lastMessage?.body || ''}
                              </p>
                            </div>
                          </div>
                          {chat.unreadCount > 0 && (
                            <span className="bg-[#00a884] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <MessageCircle className="w-12 h-12 text-[#3b4a54] mb-3" />
                      <p className="text-[#667781] text-sm">
                        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz sohbet yok'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={() => setShowNewChatDialog(true)}
                          className="text-[#00a884] text-sm mt-2 hover:underline flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" /> Yeni sohbet başlat
                        </button>
                      )}
                    </div>
                  )}
                  {/* Refresh button */}
                  <div className="px-3 py-2 border-t border-[#f0f2f5]">
                    <button
                      onClick={fetchChats}
                      disabled={chatsLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 text-[#667781] hover:text-[#111b21] text-xs transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${chatsLoading ? 'animate-spin' : ''}`} />
                      Sohbetleri Yenile
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
                  ) : !selectedLine ? (
                    <>
                      <Phone className="w-12 h-12 text-[#3b4a54] mb-3" />
                      <p className="text-[#667781] text-sm">Yukarıdan bir hat seçin</p>
                    </>
                  ) : (
                    <>
                      <Power className="w-12 h-12 text-[#3b4a54] mb-3" />
                      <p className="text-[#667781] text-sm mb-3">Hat bağlı değil</p>
                      <Button
                        size="sm"
                        onClick={startSession}
                        disabled={connecting}
                        className="bg-[#00a884] hover:bg-[#06cf9c] text-white h-9 text-xs gap-1.5"
                      >
                        {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                        Bağlantıyı Başlat
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===== RIGHT PANEL ===== */}
          <div className="flex-1 flex flex-col bg-[#efeae2]" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M20 0 L20 40 M0 20 L40 20\' stroke=\'%23ffffff\' stroke-width=\'0.3\' opacity=\'0.03\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'url(%23p)\' width=\'400\' height=\'400\'/%3E%3C/svg%3E")',
          }}>
            {activeChat ? (
              <>
                {/* Chat header */}
                <div className="bg-[#f0f2f5] px-4 py-2 flex items-center justify-between border-b border-[#e9edef] flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setActiveChat(null); setChatMessages([]); }}
                      className="p-1.5 rounded-full hover:bg-[#e9edef] text-[#54656f] lg:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[#111b21] text-sm font-medium">
                        {activeChat.name || activeChat.id?.user || 'Sohbet'}
                      </p>
                      <p className="text-[#667781] text-xs">{activeChat.id?.user || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchChatMessages(activeChat)}
                      className="p-2 rounded-full hover:bg-[#e9edef] text-[#54656f]"
                      title="Mesajları yenile"
                    >
                      <RefreshCw className={`w-4 h-4 ${messagesLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-[8%] py-4">
                  {messagesLoading && chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
                    </div>
                  ) : chatMessages.length > 0 ? (
                    <div className="space-y-1">
                      {chatMessages.map((msg, i) => {
                        const isMe = msg.fromMe;
                        // Show date separator
                        const prevMsg = chatMessages[i - 1];
                        const showDate = !prevMsg || formatDate(msg.timestamp) !== formatDate(prevMsg?.timestamp);
                        return (
                          <div key={i}>
                            {showDate && msg.timestamp && (
                              <div className="flex justify-center my-3">
                                <span className="bg-white/90 text-[#667781] text-[11px] px-3 py-1 rounded-lg shadow">
                                  {formatDate(msg.timestamp)}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[65%] rounded-lg px-3 py-1.5 mb-0.5 shadow-sm ${
                                isMe ? 'bg-[#d9fdd3] text-[#111b21]' : 'bg-[#f0f2f5] text-[#111b21]'
                              }`}>
                                <p className="text-[13px] whitespace-pre-wrap break-words leading-relaxed">{msg.body || ''}</p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <span className="text-[10px] text-[#667781]">
                                    {msg.timestamp ? formatTime(msg.timestamp) : ''}
                                  </span>
                                  {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="bg-white/90 rounded-xl px-6 py-4 shadow">
                          <p className="text-[#667781] text-sm">Henüz mesaj yok</p>
                          <p className="text-[#667781] text-xs mt-1">Aşağıdan mesaj yazarak sohbete başlayın</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="bg-[#f0f2f5] px-4 py-2.5 border-t border-[#e9edef] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-[#e9edef] text-[#667781] flex-shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Bir mesaj yazın"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                        className="w-full bg-[#f5f6f6] text-[#111b21] text-sm placeholder:text-[#667781] outline-none rounded-lg px-4 py-2.5"
                      />
                    </div>
                    {chatMessage.trim() ? (
                      <button
                        onClick={sendMessage}
                        disabled={sending}
                        className="p-2 rounded-full hover:bg-[#e9edef] text-[#00a884] flex-shrink-0"
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    ) : (
                      <button className="p-2 rounded-full hover:bg-[#e9edef] text-[#667781] flex-shrink-0">
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* No active chat - QR or welcome */
              <div className="flex-1 flex items-center justify-center">
                {(sessionStatus === 'SCAN_QR_CODE' || qrCode) && sessionStatus !== 'WORKING' ? (
                  <div className="bg-[#f0f2f5] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
                    <div className="w-16 h-16 rounded-full bg-[#00a884] flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-[#111b21] text-xl font-light mb-2">QR Kod ile Bağlanın</h3>
                    <p className="text-[#667781] text-sm mb-6">
                      Telefonunuzda WhatsApp → Ayarlar → Bağlı Cihazlar → Cihaz Bağla
                    </p>
                    {qrCode ? (
                      <div className="bg-white rounded-xl p-4 inline-block mb-4">
                        <img
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                          alt="QR Code"
                          className="w-56 h-56 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-8">
                        <Loader2 className="w-10 h-10 animate-spin text-[#00a884]" />
                        <p className="text-[#667781] text-sm">QR kod yükleniyor...</p>
                      </div>
                    )}
                    <button
                      onClick={() => selectedLine && fetchQrCode(selectedLine)}
                      className="text-[#00a884] text-sm hover:underline flex items-center gap-1 mx-auto mt-2"
                    >
                      <RefreshCw className="w-3 h-3" /> Yenile
                    </button>
                  </div>
                ) : sessionStatus === 'WORKING' ? (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-[#3b4a54]" />
                    </div>
                    <h2 className="text-[#111b21] text-2xl font-light mb-2">WhatsApp Destek</h2>
                    <p className="text-[#667781] text-sm max-w-sm mx-auto">
                      Soldaki listeden bir sohbet seçin veya yeni sohbet başlatın
                    </p>
                    <button
                      onClick={() => setShowNewChatDialog(true)}
                      className="mt-4 bg-[#00a884] hover:bg-[#06cf9c] text-white px-6 py-2 rounded-lg text-sm inline-flex items-center gap-2 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Yeni Sohbet
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-12 h-12 text-[#3b4a54]" />
                    </div>
                    <h2 className="text-[#111b21] text-2xl font-light mb-2">WhatsApp Destek</h2>
                    <p className="text-[#667781] text-sm max-w-sm mx-auto">
                      {selectedLine 
                        ? 'Oturumu başlatmak için üstteki "Bağlan" butonuna tıklayın'
                        : 'Sol üstten bir hat seçerek başlayın'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="bg-white border-[#e9edef] text-[#111b21] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#111b21] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#00a884]" />
              Yeni Sohbet Başlat
            </DialogTitle>
            <DialogDescription className="text-[#667781]">
              Müşteri bilgilerini girerek sohbet başlatın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[#667781] text-xs mb-1 block">Ad</label>
              <Input
                placeholder="Müşteri adı"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="bg-[#f5f6f6] border-[#e9edef] text-[#111b21] placeholder:text-[#667781] focus:border-[#00a884]"
              />
            </div>
            <div>
              <label className="text-[#667781] text-xs mb-1 block">Soyad</label>
              <Input
                placeholder="Müşteri soyadı"
                value={newChatSurname}
                onChange={(e) => setNewChatSurname(e.target.value)}
                className="bg-[#f5f6f6] border-[#e9edef] text-[#111b21] placeholder:text-[#667781] focus:border-[#00a884]"
              />
            </div>
            <div>
              <label className="text-[#667781] text-xs mb-1 block">Telefon Numarası *</label>
              <Input
                placeholder="905XXXXXXXXX"
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                className="bg-[#f5f6f6] border-[#e9edef] text-[#111b21] placeholder:text-[#667781] focus:border-[#00a884]"
              />
              <p className="text-[#667781] text-[10px] mt-1">Ülke kodu ile birlikte girin (örn: 905XX)</p>
            </div>
            <Button
              onClick={startNewChat}
              disabled={!newChatPhone.trim()}
              className="w-full bg-[#00a884] hover:bg-[#06cf9c] text-white mt-2"
            >
              <Send className="w-4 h-4 mr-2" /> Sohbeti Başlat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Line Dialog */}
      <Dialog open={showAddLineDialog} onOpenChange={setShowAddLineDialog}>
        <DialogContent className="bg-white border-[#e9edef] text-[#111b21] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#111b21] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#00a884]" />
              Yeni Hat Ekle
            </DialogTitle>
            <DialogDescription className="text-[#667781]">
              WhatsApp hattı bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[#667781] text-xs mb-1 block">Hat Adı</label>
              <Input
                placeholder="Örn: Destek Hattı 1"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="bg-[#f5f6f6] border-[#e9edef] text-[#111b21] placeholder:text-[#667781] focus:border-[#00a884]"
              />
            </div>
            <div>
              <label className="text-[#667781] text-xs mb-1 block">Telefon Numarası</label>
              <Input
                placeholder="905XXXXXXXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-[#f5f6f6] border-[#e9edef] text-[#111b21] placeholder:text-[#667781] focus:border-[#00a884]"
              />
            </div>
            <Button
              onClick={addLine}
              disabled={adding || !newPhone.trim() || !newLabel.trim()}
              className="w-full bg-[#00a884] hover:bg-[#06cf9c] text-white"
            >
              {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Hat Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Line Dialog */}
      <Dialog open={!!editingLine} onOpenChange={(open) => !open && setEditingLine(null)}>
        <DialogContent className="bg-white border-[#e9edef] text-[#111b21] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#111b21] flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#00a884]" />
              Hattı Düzenle
            </DialogTitle>
            <DialogDescription className="text-[#667781]">
              Hat bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[#667781] text-xs mb-1 block">Hat Adı</label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="bg-[#f5f6f6] border-[#e9edef] text-[#111b21] focus:border-[#00a884]"
              />
            </div>
            <div>
              <label className="text-[#667781] text-xs mb-1 block">Telefon Numarası</label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="bg-[#f5f6f6] border-[#e9edef] text-[#111b21] focus:border-[#00a884]"
              />
            </div>
            <Button
              onClick={saveEdit}
              className="w-full bg-[#00a884] hover:bg-[#06cf9c] text-white"
            >
              <Save className="w-4 h-4 mr-2" /> Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsappManagement;
