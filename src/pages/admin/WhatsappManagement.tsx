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

const CHAT_HISTORY_PAGE_SIZE = 100;
const CHAT_HISTORY_MAX_PAGES = 100;
const CHAT_LIST_PAGE_SIZE = 200;

const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '');

const getStringCandidates = (value: unknown): string[] => {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;

  return [
    record._serialized,
    record.serialized,
    record.chatId,
    record.remote,
    record.user,
    record.id,
    record.phone,
    record.number,
    record.userid,
    record.value,
    record.lid,
  ].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);
};

const normalizeTurkishPhone = (value: string) => {
  const digits = normalizePhoneDigits(value);

  if (!digits) return '';
  if (digits.startsWith('90') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `9${digits}`;
  if (digits.length === 10) return `90${digits}`;

  return digits;
};

const normalizeChatIdCandidate = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue.includes('@')) return '';

  const [rawUser, rawServer] = trimmedValue.split('@');
  if (!rawUser || !rawServer) return '';

  const server = rawServer.toLowerCase();
  if (!['c.us', 'lid', 'g.us', 's.whatsapp.net'].includes(server)) {
    return '';
  }

  if (server === 'g.us') {
    return `${rawUser}@${server}`;
  }

  const normalizedPhone = normalizeTurkishPhone(rawUser);
  if (normalizedPhone.startsWith('90') && normalizedPhone.length === 12) {
    return `${normalizedPhone}@${server === 's.whatsapp.net' ? 'c.us' : server}`;
  }

  return `${rawUser}@${server}`;
};

const getExpandedChatIdCandidates = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue.includes('@')) return [];

  const [rawUser, rawServer] = trimmedValue.split('@');
  if (!rawUser || !rawServer) return [];

  const server = rawServer.toLowerCase();
  if (!['c.us', 'lid', 'g.us', 's.whatsapp.net'].includes(server)) {
    return [];
  }

  const canonicalServer = server === 's.whatsapp.net' ? 'c.us' : server;
  const baseUser = rawUser.includes(':') ? rawUser.split(':')[0].trim() : rawUser.trim();
  const normalizedPhone = canonicalServer === 'g.us' ? '' : normalizeTurkishPhone(baseUser || rawUser);
  const candidates: string[] = [];

  const addCandidate = (candidate: string) => {
    const normalizedCandidate = normalizeChatIdCandidate(candidate);
    if (normalizedCandidate && !candidates.includes(normalizedCandidate)) {
      candidates.push(normalizedCandidate);
    }
  };

  if (normalizedPhone.startsWith('90') && normalizedPhone.length === 12) {
    addCandidate(`${normalizedPhone}@c.us`);
    addCandidate(`${normalizedPhone}@lid`);
  }

  addCandidate(`${rawUser}@${canonicalServer}`);

  if (baseUser && baseUser !== rawUser) {
    addCandidate(`${baseUser}@${canonicalServer}`);
  }

  return candidates;
};

const getChatDisplayName = (chat: any) => (
  chat?.name
  ?? chat?._chat?.name
  ?? chat?.pushName
  ?? chat?._chat?.pushName
  ?? chat?.pushname
  ?? chat?._chat?.pushname
  ?? chat?.formattedTitle
  ?? chat?._chat?.formattedTitle
  ?? chat?._data?.formattedTitle
  ?? chat?._chat?._data?.formattedTitle
  ?? chat?.contact?.pushName
  ?? chat?._chat?.contact?.pushName
  ?? chat?.id?.user
  ?? chat?._chat?.id?.user
  ?? (typeof chat?.id === 'string' ? chat.id.replace(/@(c\.us|lid|g\.us|s\.whatsapp\.net)$/i, '') : null)
  ?? 'Bilinmeyen'
);

const getChatPictureUrl = (chat: any) => {
  const picture = chat?.picture ?? chat?._chat?.picture ?? chat?._data?.picture ?? chat?._chat?._data?.picture ?? null;
  return typeof picture === 'string' && picture.trim() ? picture : null;
};

const getAvatarUrlFromData = (data: any) => (
  typeof data === 'string'
    ? data
    : data?.profilePictureURL ?? data?.profilePictureUrl ?? data?.profilePicUrl ?? data?.url ?? data?.picture ?? null
);

const normalizeChatMessage = (message: any) => ({
  ...message,
  body: message?.body ?? message?._data?.body ?? '',
  timestamp: Number(message?.timestamp ?? message?.messageTimestamp ?? message?._data?.t ?? 0),
  fromMe: Boolean(message?.fromMe ?? message?._data?.id?.fromMe ?? false),
});

const getChatMessageKey = (message: any, fallback = '') => String(
  message?.id?._serialized
    ?? message?.id
    ?? message?._data?.id?._serialized
    ?? `${message?.timestamp ?? message?._data?.t ?? 0}-${message?.fromMe ?? message?._data?.id?.fromMe ?? false}-${message?.body ?? message?._data?.body ?? ''}-${fallback}`,
);

const mergeChatMessages = (messages: any[]) => {
  const messageMap = new Map<string, any>();

  messages.forEach((message, index) => {
    const normalizedMessage = normalizeChatMessage(message);
    messageMap.set(getChatMessageKey(normalizedMessage, String(index)), normalizedMessage);
  });

  return Array.from(messageMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

const getSerializedChatId = (chat: any) => {
  const directId =
    chat?.id?._serialized ??
    chat?._data?.id?._serialized ??
    chat?._chat?.id?._serialized ??
    chat?._chat?._data?.id?._serialized ??
    (typeof chat?.id === 'string' ? chat.id : null) ??
    (typeof chat?._chat?.id === 'string' ? chat._chat.id : null) ??
    chat?.chatId ??
    chat?._chat?.chatId ??
    null;

  if (typeof directId === 'string' && directId.trim()) {
    return directId;
  }

  const user = chat?.id?.user ?? chat?._data?.id?.user ?? chat?.wid?.user ?? chat?._chat?.id?.user ?? chat?._chat?._data?.id?.user ?? chat?._chat?.wid?.user ?? '';
  const server = chat?.id?.server ?? chat?._data?.id?.server ?? chat?.wid?.server ?? chat?._chat?.id?.server ?? chat?._chat?._data?.id?.server ?? chat?._chat?.wid?.server ?? 'c.us';

  return user ? `${user}@${server}` : '';
};

const getChatInputValue = (chat: any) => {
  const serializedId = getSerializedChatId(chat);
  return serializedId.replace(/@(c\.us|lid|g\.us|s\.whatsapp\.net)$/i, '');
};

const getChatPhoneCandidate = (chat: any) => {
  const candidates = [
    chat?.name,
    chat?._chat?.name,
    chat?.pushName,
    chat?._chat?.pushName,
    chat?.pushname,
    chat?._chat?.pushname,
    chat?.formattedTitle,
    chat?._chat?.formattedTitle,
    chat?._data?.formattedTitle,
    chat?._chat?._data?.formattedTitle,
    chat?.lastMessage?._data?.notifyName,
    chat?._chat?.lastMessage?._data?.notifyName,
    chat?.id,
    chat?._chat?.id,
    chat?._data?.id,
    chat?._chat?._data?.id,
    chat?.wid,
    chat?._chat?.wid,
    chat?.contact,
    chat?._chat?.contact,
    chat?._data?.contact,
    chat?._chat?._data?.contact,
    chat?._chat?.contact,
    chat?.lastMessage?.id?.remote,
    chat?._chat?.lastMessage?.id?.remote,
    chat?.lastMessage?.from,
    chat?._chat?.lastMessage?.from,
    chat?.lastMessage?.to,
    chat?._chat?.lastMessage?.to,
    chat?.lastMessage?.author,
    chat?._chat?.lastMessage?.author,
    chat?.lastMessage?._data?.from,
    chat?._chat?.lastMessage?._data?.from,
    chat?.lastMessage?._data?.to,
    chat?._chat?.lastMessage?._data?.to,
    chat?.lastMessage?._data?.author,
    chat?._chat?.lastMessage?._data?.author,
  ];

  for (const candidate of candidates.flatMap(getStringCandidates)) {
    if (!candidate) continue;

    const normalized = normalizeTurkishPhone(candidate);
    if (normalized.startsWith('90') && normalized.length === 12) {
      return normalized;
    }
  }

  return '';
};

const getRemoteParticipantCandidate = (chat: any) => {
  const rawCandidates = [
    chat?.id,
    chat?._chat?.id,
    chat?._data?.id,
    chat?._chat?._data?.id,
    chat?.wid,
    chat?._chat?.wid,
    chat?.contact?.id,
    chat?._chat?.contact?.id,
    chat?._data?.contact?.id,
    chat?._chat?._data?.contact?.id,
    chat?._chat?.contact?.id,
    chat?.lastMessage?.id?.remote,
    chat?._chat?.lastMessage?.id?.remote,
    chat?.lastMessage?._data?.id?.remote,
    chat?._chat?.lastMessage?._data?.id?.remote,
    chat?.lastMessage?.to,
    chat?._chat?.lastMessage?.to,
    chat?.lastMessage?._data?.to,
    chat?._chat?.lastMessage?._data?.to,
    chat?.lastMessage?.from,
    chat?._chat?.lastMessage?.from,
    chat?.lastMessage?._data?.from,
    chat?._chat?.lastMessage?._data?.from,
    chat?.lastMessage?.author,
    chat?._chat?.lastMessage?.author,
    chat?.lastMessage?._data?.author,
    chat?._chat?.lastMessage?._data?.author,
  ];

  const preferredIds: string[] = [];
  const fallbackIds: string[] = [];

  for (const candidate of rawCandidates.flatMap(getStringCandidates)) {
    for (const expandedCandidate of getExpandedChatIdCandidates(candidate)) {
      if (expandedCandidate.endsWith('@c.us')) {
        if (!preferredIds.includes(expandedCandidate)) {
          preferredIds.push(expandedCandidate);
        }
        continue;
      }

      if (expandedCandidate.endsWith('@lid') && !fallbackIds.includes(expandedCandidate)) {
        fallbackIds.push(expandedCandidate);
      }
    }
  }

  return preferredIds[0] ?? fallbackIds[0] ?? '';
};

const getChatIdCandidates = (chat: any) => {
  const preferredIds = new Set<string>();
  const fallbackIds = new Set<string>();
  const directId = getSerializedChatId(chat);
  const remoteParticipantId = getRemoteParticipantCandidate(chat);

  const addId = (value: string, preferred = false) => {
    getExpandedChatIdCandidates(value).forEach((normalizedId) => {
      if (preferred || normalizedId.endsWith('@c.us')) {
        preferredIds.add(normalizedId);
        return;
      }

      fallbackIds.add(normalizedId);
    });
  };

  if (directId) {
    addId(directId);
  }

  if (remoteParticipantId) {
    addId(remoteParticipantId, true);
  }

  [
    chat?.contact?.id,
    chat?._data?.contact?.id,
    chat?._chat?.contact?.id,
    chat?.wid,
    chat?._chat?.wid,
    chat?.id,
    chat?._chat?.id,
  ]
    .flatMap(getStringCandidates)
    .forEach((candidate) => addId(candidate, candidate.includes('@c.us')));

  const phoneCandidate = remoteParticipantId ? normalizeTurkishPhone(remoteParticipantId) : getChatPhoneCandidate(chat);
  if (phoneCandidate) {
    preferredIds.add(`${phoneCandidate}@c.us`);
    preferredIds.add(`${phoneCandidate}@lid`);
  }

  return Array.from(new Set([...preferredIds, ...fallbackIds])).filter(Boolean);
};

const getLastChatMessage = (chat: any) => (
  chat?.lastMessage
  ?? chat?._chat?.lastMessage
  ?? chat?._chat?._data?.lastMessage
  ?? null
);

const getLastMessageTimestamp = (chat: any) => Number(
  getLastChatMessage(chat)?.timestamp
    ?? getLastChatMessage(chat)?._data?.timestamp
    ?? chat?._chat?.timestamp
    ?? chat?.timestamp
    ?? 0,
);

const getLastMessageBody = (chat: any) => (
  getLastChatMessage(chat)?.body
  ?? getLastChatMessage(chat)?._data?.body
  ?? ''
);

const getChatSecondaryText = (chat: any) => {
  const phoneCandidate = getChatPhoneCandidate(chat);
  if (phoneCandidate) {
    return phoneCandidate;
  }

  const serializedId = getSerializedChatId(chat);
  return serializedId.replace(/@(c\.us|lid|g\.us|s\.whatsapp\.net)$/i, '');
};

const getChatSelectionKey = (chat: any) => (
  getChatIdCandidates(chat)[0]
  ?? getSerializedChatId(chat)
  ?? `${getChatDisplayName(chat)}-${getLastMessageTimestamp(chat)}`
);

const WhatsappManagement = () => {
  const { userProfile } = useUserRole();
  const isAdmin = userProfile?.role === 'admin';

  const [lines, setLines] = useState<WhatsappLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState<WhatsappLine | null>(null);
  const [showAddLineDialog, setShowAddLineDialog] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingLine, setEditingLine] = useState<WhatsappLine | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editLabel, setEditLabel] = useState('');

  const [sessionStatus, setSessionStatus] = useState<string>('UNKNOWN');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [chatMessage, setChatMessage] = useState('');
  const [chatTo, setChatTo] = useState('');
  const [sending, setSending] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [newChatName, setNewChatName] = useState('');
  const [newChatSurname, setNewChatSurname] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');

  const getSessionName = (line: WhatsappLine) => `line_${line.id.replace(/-/g, '').substring(0, 16)}`;

  const ContactAvatar = ({ chat, size = 'md' }: { chat: any; size?: 'sm' | 'md' }) => {
    const contactIds = getChatIdCandidates(chat);
    const picUrl = contactIds.map((id) => profilePics[id]).find(Boolean) || getChatPictureUrl(chat);
    const dim = size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
    const iconSize = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

    return (
      <div className={`${dim} rounded-full overflow-hidden bg-[#dfe5e7] flex items-center justify-center flex-shrink-0`}>
        {picUrl && (
          <img
            src={picUrl}
            alt={`${getChatDisplayName(chat)} profil fotoğrafı`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              const fallback = event.currentTarget.parentElement?.querySelector('[data-avatar-fallback]');
              fallback?.classList.remove('hidden');
            }}
          />
        )}
        <Users data-avatar-fallback className={`${iconSize} text-white ${picUrl ? 'hidden' : ''}`} />
      </div>
    );
  };

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
      toast.error('Hatlar yüklenemedi');
    } else {
      setLines(data || []);
      if (!selectedLine && data && data.length > 0) {
        const activeLine = data.find((line) => line.is_active) || data[0];
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
      toast.success('Oturum başlatılıyor...');
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
      toast.success('Oturum kapatıldı');
    } catch {
      toast.error('Oturum kapatılamadı');
    }
    setDisconnecting(false);
  };

  const getActiveChatId = () => {
    if (activeChat) {
      return getChatIdCandidates(activeChat)[0] ?? getSerializedChatId(activeChat);
    }
    const num = chatTo.replace(/[^0-9]/g, '');
    return num ? `${num}@c.us` : '';
  };

  const sendMessage = async () => {
    if (!selectedLine || !chatMessage.trim()) return;
    const chatId = getActiveChatId();
    if (!chatId) {
      toast.error('Alıcı numarası gerekli');
      return;
    }
    setSending(true);
    const msgText = chatMessage;
    setChatMessage('');
    setChatMessages((prev) => [...prev, { body: msgText, fromMe: true, timestamp: Math.floor(Date.now() / 1000), _optimistic: true }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      await wahaApi('sendText', getSessionName(selectedLine), { chatId, text: msgText });
    } catch (err: any) {
      toast.error(`Mesaj gönderilemedi: ${err.message || ''}`);
      setChatMessage(msgText);
      setChatMessages((prev) => prev.filter((message) => !message._optimistic));
    }
    setSending(false);
  };

  const fetchProfilePic = async (chatOrContact: any) => {
    if (!selectedLine) return;

    const sessionName = getSessionName(selectedLine);
    const candidateIds = typeof chatOrContact === 'string'
      ? [chatOrContact]
      : getChatIdCandidates(chatOrContact);
    const uniqueIds = Array.from(new Set(candidateIds.filter(Boolean)));

    if (uniqueIds.length === 0) return;
    if (uniqueIds.some((id) => profilePics[id])) return;

    const embeddedPic = typeof chatOrContact === 'object' ? getChatPictureUrl(chatOrContact) : null;
    if (embeddedPic) {
      setProfilePics((prev) => {
        const next = { ...prev };
        uniqueIds.forEach((id) => {
          next[id] = embeddedPic;
        });
        return next;
      });
      return;
    }

    try {
      const res = await wahaApi('contacts.profile-picture', sessionName, {
        contactId: uniqueIds[0],
        contactIds: uniqueIds,
        refresh: false,
      });
      const picUrl = getAvatarUrlFromData(res.data);
      if (picUrl) {
        setProfilePics((prev) => {
          const next = { ...prev };
          uniqueIds.forEach((id) => {
            next[id] = picUrl;
          });
          return next;
        });
      }
    } catch {}
  };

  const fetchChats = async () => {
    if (!selectedLine) return;
    setChatsLoading(true);
    try {
      const sessionName = getSessionName(selectedLine);
      let rawChatList: any[] = [];

      try {
        const overviewRes = await wahaApi('chats.overview', sessionName, {
          limit: CHAT_LIST_PAGE_SIZE,
          offset: 0,
          merge: true,
        });
        rawChatList = Array.isArray(overviewRes.data) ? overviewRes.data : [];
      } catch (overviewError) {
        console.warn('Chats overview alınamadı, chats.list fallback çalışıyor:', overviewError);
        const listRes = await wahaApi('chats.list', sessionName, {
          limit: CHAT_LIST_PAGE_SIZE,
          offset: 0,
          merge: true,
          sortBy: 'timestamp',
          sortOrder: 'desc',
        });
        rawChatList = Array.isArray(listRes.data) ? listRes.data : [];
      }

      if (rawChatList.length > 0) {
        const uniqueChatMap = new Map<string, any>();

        rawChatList.forEach((chat: any) => {
          const preferredKey = getChatSelectionKey(chat);
          const existing = uniqueChatMap.get(preferredKey);

          if (!existing) {
            uniqueChatMap.set(preferredKey, chat);
            return;
          }

          const existingTimestamp = getLastMessageTimestamp(existing);
          const currentTimestamp = getLastMessageTimestamp(chat);

          if (currentTimestamp >= existingTimestamp) {
            uniqueChatMap.set(preferredKey, chat);
          }
        });

        const chatList = Array.from(uniqueChatMap.values())
          .sort((a, b) => getLastMessageTimestamp(b) - getLastMessageTimestamp(a));

        setChats(chatList);
        setActiveChat((prev) => {
          if (!prev) return prev;
          return chatList.find((chat) => getChatSelectionKey(chat) === getChatSelectionKey(prev)) ?? prev;
        });

        const embeddedPictures: Record<string, string> = {};
        chatList.forEach((chat: any) => {
          const chatPicture = getChatPictureUrl(chat);
          if (!chatPicture) return;
          getChatIdCandidates(chat).forEach((id) => {
            embeddedPictures[id] = chatPicture;
          });
        });

        if (Object.keys(embeddedPictures).length > 0) {
          setProfilePics((prev) => ({ ...prev, ...embeddedPictures }));
        }

        chatList.forEach((chat: any) => {
          const candidateIds = getChatIdCandidates(chat);
          const hasPicture = candidateIds.some((id) => embeddedPictures[id] || profilePics[id]);
          if (!hasPicture) {
            void fetchProfilePic(chat);
          }
        });
      }
    } catch (error) {
      console.error('Sohbetler alınamadı:', error);
      toast.error('Sohbetler alınamadı');
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchChatMessages = async (chat?: any, silent = false) => {
    if (!selectedLine) return;
    const targetChat = chat || activeChat;
    if (!targetChat) return;

    const sessionName = getSessionName(selectedLine);
    const chatIdCandidates = getChatIdCandidates(targetChat);

    if (!silent) setMessagesLoading(true);

    if (chatIdCandidates.length === 0) {
      if (!silent) {
        toast.error('Sohbet kimliği bulunamadı');
        setMessagesLoading(false);
      }
      return;
    }

    const fetchMessagesForChatId = async (chatId: string, maxPages: number) => {
      const allMessages: any[] = [];
      const seenMessageKeys = new Set<string>();
      let succeeded = false;

      for (let page = 0; page < maxPages; page += 1) {
        let res: any;
        let lastRequestError: unknown = null;

        const requestPayloads = [
          {
            chatId,
            limit: CHAT_HISTORY_PAGE_SIZE,
            offset: page * CHAT_HISTORY_PAGE_SIZE,
            downloadMedia: false,
            merge: true,
            sortBy: 'timestamp',
            sortOrder: 'asc',
          },
          {
            chatId,
            limit: CHAT_HISTORY_PAGE_SIZE,
            offset: page * CHAT_HISTORY_PAGE_SIZE,
            downloadMedia: false,
            merge: true,
          },
          {
            chatId,
            limit: CHAT_HISTORY_PAGE_SIZE,
            offset: page * CHAT_HISTORY_PAGE_SIZE,
            downloadMedia: false,
            merge: false,
          },
        ];

        for (const requestPayload of requestPayloads) {
          try {
            res = await wahaApi('chats.messages', sessionName, requestPayload);
            succeeded = true;
            break;
          } catch (error) {
            lastRequestError = error;
          }
        }

        if (!res) {
          if (page === 0) throw lastRequestError;
          break;
        }

        const batch = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.messages)
            ? res.data.messages
            : Array.isArray(res.data?.items)
              ? res.data.items
              : [];
        if (batch.length === 0) break;

        let newMessageCount = 0;

        batch.forEach((message: any, index: number) => {
          const normalizedMessage = normalizeChatMessage(message);
          const messageKey = getChatMessageKey(normalizedMessage, `${chatId}-${page}-${index}`);

          if (!seenMessageKeys.has(messageKey)) {
            seenMessageKeys.add(messageKey);
            allMessages.push(normalizedMessage);
            newMessageCount += 1;
          }
        });

        if (batch.length < CHAT_HISTORY_PAGE_SIZE || newMessageCount === 0) break;
      }

      return {
        succeeded,
        messages: mergeChatMessages(allMessages),
      };
    };

    let lastError: unknown = null;
    let hadSuccessfulResponse = false;
    const collectedMessages: any[] = [];

    try {
      void fetchProfilePic(targetChat);

      for (const chatId of chatIdCandidates) {
        try {
          const result = await fetchMessagesForChatId(chatId, silent ? 1 : CHAT_HISTORY_MAX_PAGES);
          if (!result.succeeded) continue;
          hadSuccessfulResponse = true;

          if (result.messages.length > 0) {
            collectedMessages.push(...result.messages);
          }
        } catch (error) {
          lastError = error;
        }
      }

      if (hadSuccessfulResponse) {
        const mergedMessages = mergeChatMessages(collectedMessages);

        if (silent) {
          if (mergedMessages.length > 0) {
            setChatMessages((prev) => mergeChatMessages([...prev, ...mergedMessages]));
          }
        } else {
          setChatMessages(mergedMessages);
          if (mergedMessages.length > 0) {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        }

        return;
      }

      throw lastError ?? new Error('Mesaj geçmişi alınamadı');
    } catch (error) {
      console.error('Mesaj geçmişi alınamadı:', error);
      if (!silent) {
        toast.error('Mesaj geçmişi alınamadı');
      }
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  const openChat = (chat: any) => {
    setActiveChat(chat);
    setChatTo(getChatPhoneCandidate(chat) || getChatInputValue(chat));
    setChatMessages([]);
    void fetchProfilePic(chat);
    void fetchChatMessages(chat);
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
    const searchableText = `${getChatDisplayName(chat)} ${getChatSecondaryText(chat)}`.toLowerCase();
    return searchableText.includes(searchQuery.toLowerCase());
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
                      const isActive = activeChat && (getChatSelectionKey(activeChat) === getChatSelectionKey(chat));
                      const lastMsgTime = getLastMessageTimestamp(chat);
                      return (
                        <div
                          key={i}
                          onClick={() => openChat(chat)}
                          className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-[#f0f2f5] ${
                            isActive ? 'bg-[#f5f6f6]' : 'hover:bg-[#f0f2f5]'
                          }`}
                        >
                          <ContactAvatar chat={chat} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-[#111b21] text-sm font-medium truncate">
                                {getChatDisplayName(chat)}
                              </p>
                              <span className="text-[#667781] text-[11px] flex-shrink-0 ml-2">
                                {lastMsgTime ? formatDate(lastMsgTime) : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {Boolean(getLastChatMessage(chat)?.fromMe) && <CheckCheck className="w-3 h-3 text-[#53bdeb] flex-shrink-0" />}
                              <p className="text-[#667781] text-xs truncate">
                                {getLastMessageBody(chat)}
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
                     <ContactAvatar chat={activeChat} size="sm" />
                    <div>
                      <p className="text-[#111b21] text-sm font-medium">
                        {getChatDisplayName(activeChat)}
                      </p>
                      <p className="text-[#667781] text-xs">{getChatSecondaryText(activeChat)}</p>
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
