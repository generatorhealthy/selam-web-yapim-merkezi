import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  MessageCircle, Plus, Trash2, Phone, QrCode, Edit2, Save,
  Send, RefreshCw, LogOut, Power, Loader2, Users, Search,
  MoreVertical, Paperclip, Mic, ArrowLeft, X, CheckCheck,
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
const CHAT_HISTORY_MAX_PAGES = 5;
const CHAT_LIST_PAGE_SIZE = 100;

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

const getQrPayloadValue = (payload: unknown, depth = 0): string | null => {
  if (depth > 5 || payload == null) {
    return null;
  }

  if (typeof payload === 'string') {
    const trimmedPayload = payload.trim();
    return trimmedPayload || null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nestedValue = getQrPayloadValue(item, depth + 1);
      if (nestedValue) {
        return nestedValue;
      }
    }

    return null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.qr,
    record.value,
    record.data,
    record.base64,
    record.image,
    record.qrCode,
    record.code,
    record.src,
    record.url,
  ];

  for (const candidate of candidates) {
    const nestedValue = getQrPayloadValue(candidate, depth + 1);
    if (nestedValue) {
      return nestedValue;
    }
  }

  return null;
};

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

  Array.from(new Set([
    getChatPhoneCandidate(chat),
    getChatSecondaryText(chat),
    directId,
    remoteParticipantId,
  ]))
    .map((candidate) => normalizeTurkishPhone(String(candidate ?? '')))
    .filter((candidate) => candidate.startsWith('90') && candidate.length === 12)
    .forEach((candidate) => {
      preferredIds.add(`${candidate}@c.us`);
      fallbackIds.add(`${candidate}@lid`);
    });

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

const getPositiveNumericValue = (value: unknown) => {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : NaN;

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};

const getChatUnreadCount = (chat: any) => {
  const unreadCandidates = [
    chat?.unreadCount,
    chat?.unread,
    chat?.unreadMessages,
    chat?.unreadMessagesCount,
    chat?.counter,
    chat?._chat?.unreadCount,
    chat?._chat?.unread,
    chat?._chat?.unreadMessages,
    chat?._chat?.unreadMessagesCount,
    chat?._chat?.counter,
    chat?._data?.unreadCount,
    chat?._data?.unread,
    chat?._data?.unreadMessages,
    chat?._data?.unreadMessagesCount,
    chat?._data?.counter,
    chat?._chat?._data?.unreadCount,
    chat?._chat?._data?.unread,
    chat?._chat?._data?.unreadMessages,
    chat?._chat?._data?.unreadMessagesCount,
    chat?._chat?._data?.counter,
  ];

  return unreadCandidates.reduce(
    (maxCount, candidate) => Math.max(maxCount, getPositiveNumericValue(candidate)),
    0,
  );
};

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
  const [allLinesMode, setAllLinesMode] = useState(true);
  const [lineSessionStatuses, setLineSessionStatuses] = useState<Record<string, string>>({});
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
  const [chats, setChatsState] = useState<any[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatMessages, setChatMessagesState] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [newChatName, setNewChatName] = useState('');
  const [newChatSurname, setNewChatSurname] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');
  const chatsRef = useRef<any[]>([]);
  const chatMessagesRef = useRef<any[]>([]);
  const activeChatSelectionKeyRef = useRef<string | null>(null);
  const notifiedMessageKeysRef = useRef<Set<string>>(new Set());
  const notificationPermissionRequestedRef = useRef(false);

  const setChats = useCallback((value: any[] | ((prev: any[]) => any[])) => {
    const nextValue = typeof value === 'function'
      ? (value as (prev: any[]) => any[])(chatsRef.current)
      : value;

    chatsRef.current = nextValue;
    setChatsState(nextValue);
  }, []);

  const setChatMessages = useCallback((value: any[] | ((prev: any[]) => any[])) => {
    const nextValue = typeof value === 'function'
      ? (value as (prev: any[]) => any[])(chatMessagesRef.current)
      : value;

    chatMessagesRef.current = nextValue;
    setChatMessagesState(nextValue);
  }, []);

  const getSessionName = useCallback((line: WhatsappLine) => `line_${line.id.replace(/-/g, '').substring(0, 16)}`, []);

  const getWorkingLines = useCallback(() => {
    return lines.filter(l => lineSessionStatuses[l.id] === 'WORKING');
  }, [lines, lineSessionStatuses]);

  const anyLineWorking = Object.values(lineSessionStatuses).some(s => s === 'WORKING');

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

  const ensureNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'default' || notificationPermissionRequestedRef.current) {
      return;
    }

    notificationPermissionRequestedRef.current = true;

    try {
      await Notification.requestPermission();
    } catch (error) {
      console.warn('Bildirim izni alınamadı:', error);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First tone
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.value = 880;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      // Second tone (higher)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1320;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc2.start(audioCtx.currentTime + 0.15);
      osc2.stop(audioCtx.currentTime + 0.35);

      setTimeout(() => audioCtx.close(), 500);
    } catch (e) {
      console.warn('Bildirim sesi çalınamadı:', e);
    }
  }, []);

  const showIncomingMessageNotification = useCallback((chat: any, message: any) => {
    if (typeof document === 'undefined') {
      return;
    }

    const normalizedMessage = normalizeChatMessage(message);
    if (normalizedMessage.fromMe) {
      return;
    }

    const selectionKey = getChatSelectionKey(chat);
    const messageKey = getChatMessageKey(normalizedMessage, selectionKey);
    if (notifiedMessageKeysRef.current.has(messageKey)) {
      return;
    }

    notifiedMessageKeysRef.current.add(messageKey);

    // Play notification sound
    playNotificationSound();

    const previewText = normalizedMessage.body?.trim()
      || (message?.hasMedia || message?._data?.hasMedia ? 'Yeni medya mesajı' : 'Yeni mesaj');
    const title = getChatDisplayName(chat);

    toast.info(`${title}: ${previewText}`);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const notification = new Notification(title, {
        body: previewText,
        tag: messageKey,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [playNotificationSound]);

  const cleanupStaleSessions = useCallback(async (line: WhatsappLine) => {
    try {
      const res = await wahaApi('sessions.list');
      const sessions = Array.isArray(res.data) ? res.data : [];
      const validSessionNames = new Set(lines.map(getSessionName));
      const currentSessionName = getSessionName(line);

      const staleSessions = sessions.filter((session: any) => {
        const sessionName = typeof session?.name === 'string' ? session.name : '';
        const status = typeof session?.status === 'string' ? session.status.toUpperCase() : '';

        if (!sessionName || status === 'WORKING') {
          return false;
        }

        if (sessionName === currentSessionName) {
          return ['FAILED', 'STARTING', 'SCAN_QR_CODE', 'STOPPED'].includes(status);
        }

        return !validSessionNames.has(sessionName) && ['FAILED', 'SCAN_QR_CODE', 'STARTING', 'STOPPED'].includes(status);
      });

      if (staleSessions.length === 0) {
        return;
      }

      await Promise.allSettled(
        staleSessions.flatMap((session: any) => [
          wahaApi('sessions.logout', session.name),
          wahaApi('sessions.stop', session.name),
        ]),
      );
    } catch (error) {
      console.warn('WAHA stale session cleanup skipped:', error);
    }
  }, [getSessionName, lines]);

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

  // Check session status for a single line
  const checkLineSessionStatus = useCallback(async (line: WhatsappLine): Promise<string> => {
    try {
      const res = await wahaApi('sessions.status', getSessionName(line));
      if (res.success && res.data) {
        const status = String(res.data.status || 'STOPPED').toUpperCase();
        return status;
      }
      return 'STOPPED';
    } catch {
      return 'STOPPED';
    }
  }, [getSessionName]);

  // Check all lines' session statuses
  const checkAllLineStatuses = useCallback(async (linesList: WhatsappLine[]) => {
    const statuses: Record<string, string> = {};
    await Promise.allSettled(
      linesList.map(async (line) => {
        const status = await checkLineSessionStatus(line);
        statuses[line.id] = status;
      })
    );
    setLineSessionStatuses(statuses);
    return statuses;
  }, [checkLineSessionStatus]);

  const checkSessionStatus = useCallback(async (line: WhatsappLine) => {
    const connectingFallbackStatus = connecting ? 'SCAN_QR_CODE' : 'STOPPED';

    try {
      const res = await wahaApi('sessions.status', getSessionName(line));
      if (res.success && res.data) {
        const status = String(res.data.status || 'STOPPED').toUpperCase();

        if (connecting && status !== 'WORKING') {
          setSessionStatus('SCAN_QR_CODE');
          return 'SCAN_QR_CODE';
        }

        setSessionStatus(status);
        // Also update per-line status
        setLineSessionStatuses(prev => ({ ...prev, [line.id]: status }));
        if (status === 'WORKING') {
          setQrCode(null);
          setConnecting(false);
          stopQrPolling();
        }
        return status;
      } else {
        setSessionStatus(connectingFallbackStatus);
        return connectingFallbackStatus;
      }
    } catch {
      setSessionStatus(connectingFallbackStatus);
      return connectingFallbackStatus;
    }
  }, [connecting, getSessionName]);

  const fetchQrCode = useCallback(async (line: WhatsappLine) => {
    try {
      const res = await wahaApi('auth.qr', getSessionName(line));
      const nextQrCode = getQrPayloadValue(res.data);
      if (nextQrCode) {
        setQrCode(nextQrCode);
        setSessionStatus('SCAN_QR_CODE');
        return nextQrCode;
      }
    } catch {}

    return null;
  }, [getSessionName]);

  const startSession = async () => {
    if (!selectedLine) return;
    const line = selectedLine;
    void ensureNotificationPermission();
    setConnecting(true);
    setQrCode(null);
    stopQrPolling();

    await cleanupStaleSessions(line);

    try {
      await wahaApi('sessions.start', getSessionName(line));
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

    for (const delay of [500, 1000, 1500, 2500]) {
      await new Promise(r => setTimeout(r, delay));
      const qr = await fetchQrCode(line);
      if (qr) {
        setConnecting(false);
        return;
      }
    }

    void checkSessionStatus(line);
  };

  const stopSession = async () => {
    if (!selectedLine) return;
    setDisconnecting(true);
    try {
      await wahaApi('sessions.logout', getSessionName(selectedLine));
      await wahaApi('sessions.stop', getSessionName(selectedLine));
      setSessionStatus('STOPPED');
      setLineSessionStatuses(prev => ({ ...prev, [selectedLine.id]: 'STOPPED' }));
      setQrCode(null);
      setConnecting(false);
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
    const effectiveLine = activeChat?._lineId ? lines.find(l => l.id === activeChat._lineId) : selectedLine;
    if (!effectiveLine || !chatMessage.trim()) return;
    const chatId = getActiveChatId();
    if (!chatId) {
      toast.error('Alıcı numarası gerekli');
      return;
    }
    setSending(true);
    const msgText = chatMessage;
    const msgTimestamp = Math.floor(Date.now() / 1000);
    setChatMessage('');
    setChatMessages((prev) => [...prev, { body: msgText, fromMe: true, timestamp: msgTimestamp, _optimistic: true }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      await wahaApi('sendText', getSessionName(effectiveLine), { chatId, text: msgText });
      // Store sent message to Supabase for history
      const sessionName = getSessionName(effectiveLine);
      supabase.from('whatsapp_messages').insert({
        session_name: sessionName,
        chat_id: chatId,
        message_id: `sent_${msgTimestamp}_${Math.random().toString(36).substring(2, 8)}`,
        body: msgText,
        from_me: true,
        timestamp: msgTimestamp,
        has_media: false,
        sender_name: null,
      }).then(({ error }) => {
        if (error) console.warn('Gönderilen mesaj DB kayıt hatası:', error);
      });
    } catch (err: any) {
      toast.error(`Mesaj gönderilemedi: ${err.message || ''}`);
      setChatMessage(msgText);
      setChatMessages((prev) => prev.filter((message) => !message._optimistic));
    }
    setSending(false);
  };

  const fetchProfilePic = async (chatOrContact: any, line?: WhatsappLine) => {
    const effectiveLine = line || (chatOrContact?._lineId ? lines.find(l => l.id === chatOrContact._lineId) : null) || selectedLine;
    if (!effectiveLine) return;

    const sessionName = getSessionName(effectiveLine);
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

  // Fetch chats for a specific line
  const fetchChatsForLine = async (line: WhatsappLine): Promise<any[]> => {
    const sessionName = getSessionName(line);
    let rawChatList: any[] = [];

    try {
      const overviewRes = await wahaApi('chats.overview', sessionName, {
        limit: CHAT_LIST_PAGE_SIZE,
        offset: 0,
        merge: true,
      });
      rawChatList = Array.isArray(overviewRes.data) ? overviewRes.data : [];
    } catch (overviewError) {
      console.warn(`Chats overview alınamadı (${line.label}), chats.list fallback:`, overviewError);
      try {
        const listRes = await wahaApi('chats.list', sessionName, {
          limit: CHAT_LIST_PAGE_SIZE,
          offset: 0,
          merge: true,
          sortBy: 'timestamp',
          sortOrder: 'desc',
        });
        rawChatList = Array.isArray(listRes.data) ? listRes.data : [];
      } catch {
        return [];
      }
    }

    // Tag each chat with line info
    return rawChatList.map((chat: any) => ({
      ...chat,
      _lineId: line.id,
      _lineLabel: line.label,
      _sessionName: sessionName,
    }));
  };

  const fetchChats = async (silent = false) => {
    // Determine which lines to fetch from
    const linesToFetch = allLinesMode
      ? lines.filter(l => lineSessionStatuses[l.id] === 'WORKING')
      : (selectedLine && (lineSessionStatuses[selectedLine.id] === 'WORKING' || sessionStatus === 'WORKING') ? [selectedLine] : []);

    if (linesToFetch.length === 0) {
      if (!silent) setChats([]);
      return;
    }

    if (!silent) setChatsLoading(true);
    try {
      // Fetch chats from all working lines in parallel
      const results = await Promise.allSettled(
        linesToFetch.map(line => fetchChatsForLine(line))
      );

      const allRawChats: any[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allRawChats.push(...result.value);
        }
      });

      if (allRawChats.length > 0) {
        const previousChats = chatsRef.current;
        const previousChatMap = new Map(
          previousChats.map((chat: any) => [getChatSelectionKey(chat), chat]),
        );
        const uniqueChatMap = new Map<string, any>();

        allRawChats.forEach((chat: any) => {
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
          .sort((a, b) => getLastMessageTimestamp(b) - getLastMessageTimestamp(a))
          .map((chat: any) => {
            const selectionKey = getChatSelectionKey(chat);
            const previousChat = previousChatMap.get(selectionKey);
            const backendUnreadCount = getChatUnreadCount(chat);
            const previousUnreadCount = getChatUnreadCount(previousChat);
            const currentLastMessage = getLastChatMessage(chat);
            const currentTimestamp = getLastMessageTimestamp(chat);
            const previousTimestamp = getLastMessageTimestamp(previousChat);
            const normalizedLastMessage = currentLastMessage
              ? normalizeChatMessage(currentLastMessage)
              : null;
            const hasNewIncomingMessage = Boolean(
              previousChat
                && currentTimestamp
                && currentTimestamp > previousTimestamp
                && normalizedLastMessage
                && !normalizedLastMessage.fromMe,
            );

            return {
              ...chat,
              unreadCount: selectionKey === activeChatSelectionKeyRef.current
                ? 0
                : backendUnreadCount > 0
                  ? backendUnreadCount
                  : hasNewIncomingMessage
                    ? Math.max(previousUnreadCount + 1, 1)
                    : previousUnreadCount,
            };
          });

        setChats(chatList);

        if (silent && previousChats.length > 0) {
          chatList.forEach((chat: any) => {
            const selectionKey = getChatSelectionKey(chat);
            if (selectionKey === activeChatSelectionKeyRef.current) {
              return;
            }

            const previousChat = previousChatMap.get(selectionKey);
            const currentLastMessage = getLastChatMessage(chat);
            const currentTimestamp = getLastMessageTimestamp(chat);
            const previousTimestamp = getLastMessageTimestamp(previousChat);

            if (!currentLastMessage || !currentTimestamp || currentTimestamp <= previousTimestamp) {
              return;
            }

            const normalizedLastMessage = normalizeChatMessage(currentLastMessage);
            if (!normalizedLastMessage.fromMe) {
              showIncomingMessageNotification(chat, normalizedLastMessage);
            }
          });
        }

        setActiveChat((prev: any) => {
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

        const visibleChats = chatList.slice(0, 20);
        visibleChats.forEach((chat: any) => {
          const candidateIds = getChatIdCandidates(chat);
          const hasPicture = candidateIds.some((id) => embeddedPictures[id] || profilePics[id]);
          if (!hasPicture) {
            void fetchProfilePic(chat);
          }
        });
      } else if (!silent) {
        setChats([]);
      }
    } catch (error) {
      console.error('Sohbetler alınamadı:', error);
      if (!silent) {
        toast.error('Sohbetler alınamadı');
      }
    } finally {
      if (!silent) setChatsLoading(false);
    }
  };

  const fetchMessagesFromSupabase = async (sessionName: string, chatIdCandidates: string[]) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('session_name', sessionName)
        .in('chat_id', chatIdCandidates)
        .order('timestamp', { ascending: true })
        .limit(500);

      if (error) {
        console.error('Supabase mesaj sorgusu hatası:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        body: row.body || '',
        fromMe: Boolean(row.from_me),
        timestamp: Number(row.timestamp || 0),
        hasMedia: Boolean(row.has_media),
        type: row.media_type,
        id: row.message_id || row.id,
        _fromDb: true,
        _data: {
          notifyName: row.sender_name || '',
        },
      }));
    } catch (err) {
      console.error('Supabase mesaj yükleme hatası:', err);
      return [];
    }
  };

  const fetchChatMessages = async (chat?: any, silent = false) => {
    const targetChat = chat || activeChat;
    if (!targetChat) return;

    // Use the chat's own line if available
    const effectiveLine = targetChat?._lineId ? lines.find(l => l.id === targetChat._lineId) : selectedLine;
    if (!effectiveLine) return;

    const sessionName = getSessionName(effectiveLine);
    const targetChatSelectionKey = getChatSelectionKey(targetChat);
    const chatIdCandidates = getChatIdCandidates(targetChat);
    const latestKnownTimestamp = silent
      ? chatMessagesRef.current.reduce((maxTimestamp, message) => Math.max(maxTimestamp, Number(message?.timestamp ?? 0)), 0)
      : 0;

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

        const requestPayloads = silent
          ? [
              {
                chatId,
                limit: CHAT_HISTORY_PAGE_SIZE,
                downloadMedia: false,
                ...(latestKnownTimestamp > 0
                  ? { 'filter.timestamp.gte': Math.max(latestKnownTimestamp - 1, 0) }
                  : {}),
              },
              {
                chatId,
                limit: CHAT_HISTORY_PAGE_SIZE,
                offset: 0,
                downloadMedia: false,
              },
            ]
          : [
              {
                chatId,
                limit: CHAT_HISTORY_PAGE_SIZE,
                offset: page * CHAT_HISTORY_PAGE_SIZE,
                downloadMedia: false,
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

      // Try WAHA API first
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

      // If WAHA API failed or returned no messages, try Supabase DB
      if (!hadSuccessfulResponse || collectedMessages.length === 0) {
        console.log('WAHA API mesaj döndüremedi, Supabase DB deneniyor...');
        const dbMessages = await fetchMessagesFromSupabase(sessionName, chatIdCandidates);
        if (dbMessages.length > 0) {
          collectedMessages.push(...dbMessages);
          hadSuccessfulResponse = true;
        }
      }

      if (hadSuccessfulResponse) {
        const mergedMessages = mergeChatMessages(collectedMessages);

        if (silent) {
          if (mergedMessages.length > 0) {
            const previousMessages = chatMessagesRef.current;
            const previousMessageKeys = new Set(
              previousMessages.map((message, index) => getChatMessageKey(normalizeChatMessage(message), `${targetChatSelectionKey}-prev-${index}`)),
            );
            const nextMessages = mergeChatMessages([...previousMessages, ...mergedMessages]);
            const newIncomingMessages = nextMessages.filter((message, index) => {
              if (message.fromMe) {
                return false;
              }

              const messageKey = getChatMessageKey(message, `${targetChatSelectionKey}-next-${index}`);
              return !previousMessageKeys.has(messageKey);
            });

            setChatMessages(nextMessages);

            if (newIncomingMessages.length > 0) {
              if (typeof document !== 'undefined' && document.hidden) {
                newIncomingMessages.forEach((message) => showIncomingMessageNotification(targetChat, message));
              }

              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
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
    void ensureNotificationPermission();
    const selectionKey = getChatSelectionKey(chat);
    activeChatSelectionKeyRef.current = selectionKey;
    setChats((prev) => prev.map((item) => (
      getChatSelectionKey(item) === selectionKey
        ? { ...item, unreadCount: 0 }
        : item
    )));
    setActiveChat({ ...chat, unreadCount: 0 });
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
    
    // In all lines mode, use the first working line for new chats
    const workingLines = getWorkingLines();
    const targetLine = selectedLine && lineSessionStatuses[selectedLine.id] === 'WORKING' 
      ? selectedLine 
      : workingLines[0];
    
    const fakeChatObj = {
      id: { _serialized: num + '@c.us', user: num },
      name: fullName || num,
      _isNewChat: true,
      _lineId: targetLine?.id || selectedLine?.id,
      _lineLabel: targetLine?.label || selectedLine?.label,
      _sessionName: targetLine ? getSessionName(targetLine) : undefined,
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
    activeChatSelectionKeyRef.current = activeChat ? getChatSelectionKey(activeChat) : null;
  }, [activeChat]);

  // Check all line statuses when lines load
  useEffect(() => {
    if (lines.length > 0) {
      void checkAllLineStatuses(lines);
    }
  }, [lines]);

  useEffect(() => {
    if (selectedLine && !allLinesMode) {
      stopQrPolling();
      setConnecting(false);
      setQrCode(null);
      void checkSessionStatus(selectedLine);
      activeChatSelectionKeyRef.current = null;
      notifiedMessageKeysRef.current = new Set();
      setActiveChat(null);
      setChats([]);
      setChatMessages([]);
    }
    return () => stopQrPolling();
  }, [selectedLine, allLinesMode]);

  useEffect(() => {
    if (!selectedLine || (!connecting && sessionStatus !== 'SCAN_QR_CODE')) return;

    let cancelled = false;
    const line = selectedLine;

    const pollQrCode = async () => {
      if (cancelled) return;

      const qr = await fetchQrCode(line);
      if (cancelled || qr) {
        setConnecting(false);
        return;
      }

      const status = await checkSessionStatus(line);
      if (cancelled) return;

      if (status === 'WORKING') {
        toast.success('WhatsApp bağlantısı başarılı!');
        // Refresh all statuses
        void checkAllLineStatuses(lines);
      }
    };

    stopQrPolling();
    void pollQrCode();
    qrIntervalRef.current = setInterval(() => {
      void pollQrCode();
    }, 4000);

    return () => {
      cancelled = true;
      stopQrPolling();
    };
  }, [selectedLine, sessionStatus, checkSessionStatus, fetchQrCode]);

  // Fetch chats when any line is working (all lines mode) or selected line is working
  useEffect(() => {
    const hasWorkingLine = allLinesMode 
      ? anyLineWorking 
      : (selectedLine && sessionStatus === 'WORKING');
    
    if (!hasWorkingLine) return;

    void fetchChats();
    const interval = setInterval(() => {
      void fetchChats(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [allLinesMode, anyLineWorking, sessionStatus, selectedLine, lineSessionStatuses]);

  // Refresh messages for active chat
  useEffect(() => {
    if (!activeChat) return;
    const effectiveLine = activeChat?._lineId ? lines.find(l => l.id === activeChat._lineId) : selectedLine;
    const lineStatus = effectiveLine ? lineSessionStatuses[effectiveLine.id] : sessionStatus;
    if (lineStatus !== 'WORKING') return;
    const interval = setInterval(() => fetchChatMessages(activeChat, true), 5000);
    return () => clearInterval(interval);
  }, [activeChat, selectedLine, lineSessionStatuses, lines]);

  // Periodically refresh all line statuses
  useEffect(() => {
    if (lines.length === 0) return;
    const interval = setInterval(() => {
      void checkAllLineStatuses(lines);
    }, 30000);
    return () => clearInterval(interval);
  }, [lines, checkAllLineStatuses]);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const searchableText = `${getChatDisplayName(chat)} ${getChatSecondaryText(chat)} ${chat._lineLabel || ''}`.toLowerCase();
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

  // Determine overall connection status for display
  const workingLinesCount = Object.values(lineSessionStatuses).filter(s => s === 'WORKING').length;
  const connectionStatusColor = allLinesMode
    ? (anyLineWorking ? 'bg-green-500' : 'bg-red-500')
    : (sessionStatus === 'WORKING' ? 'bg-green-500' : sessionStatus === 'SCAN_QR_CODE' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500');
  const connectionStatusText = allLinesMode
    ? (anyLineWorking ? `${workingLinesCount} hat bağlı` : 'Bağlı değil')
    : (sessionStatus === 'WORKING' ? 'Bağlı' : sessionStatus === 'SCAN_QR_CODE' ? 'QR Bekleniyor' : 'Bağlı Değil');

  // For single line mode, show session status
  const effectiveSessionWorking = allLinesMode ? anyLineWorking : sessionStatus === 'WORKING';

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>WhatsApp Destek - Divan Paneli</title>
      </Helmet>

      <div className="fixed inset-0 bg-[#f0f2f5] flex flex-col light" data-theme="light" style={{ colorScheme: 'light' }}>
        {/* Top bar */}
        <div className="h-12 bg-[#008069] flex items-center px-4 gap-3 flex-shrink-0 z-10">
          <AdminBackButton />
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
             <h1 className="text-white text-sm font-semibold">WhatsApp Destek</h1>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className={`w-2 h-2 rounded-full ${connectionStatusColor}`} />
            <span className="text-white/80 text-xs">{connectionStatusText}</span>
            {!allLinesMode && selectedLine && (
              <span className="text-white/80 text-xs">• {selectedLine.label}</span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1">
            {!allLinesMode && selectedLine && sessionStatus !== 'WORKING' && (
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
            {!allLinesMode && selectedLine && sessionStatus === 'WORKING' && (
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
                        {allLinesMode ? 'Tüm Hatlar' : (selectedLine ? selectedLine.label : 'Hat Seçin')}
                      </p>
                      {allLinesMode && (
                        <p className="text-[#667781] text-[10px]">{workingLinesCount}/{lines.length} aktif</p>
                      )}
                      {!allLinesMode && selectedLine && (
                        <p className="text-[#667781] text-[10px]">{selectedLine.phone_number}</p>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#667781] flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-[#e9edef] w-[320px]" align="start">
                  {/* All Lines option */}
                  <DropdownMenuItem
                    onClick={() => {
                      setAllLinesMode(true);
                      setActiveChat(null);
                      setChatMessages([]);
                      activeChatSelectionKeyRef.current = null;
                    }}
                    className={`text-[#111b21] hover:bg-[#f5f6f6] cursor-pointer py-2.5 ${allLinesMode ? 'bg-[#f5f6f6]' : ''}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884]">
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Tüm Hatlar</p>
                        <p className="text-[#667781] text-xs">{workingLinesCount} hat bağlı</p>
                      </div>
                      {allLinesMode && <span className="text-[10px] text-[#00a884]">● Seçili</span>}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#e9edef]" />
                  {lines.map(line => {
                    const lineStatus = lineSessionStatuses[line.id] || 'UNKNOWN';
                    const isWorking = lineStatus === 'WORKING';
                    return (
                      <DropdownMenuItem
                        key={line.id}
                        onClick={() => {
                          setAllLinesMode(false);
                          setSelectedLine(line);
                          setActiveChat(null);
                          setChatMessages([]);
                          activeChatSelectionKeyRef.current = null;
                          // Set session status for this line
                          setSessionStatus(lineStatus);
                        }}
                        className={`text-[#111b21] hover:bg-[#f5f6f6] cursor-pointer py-2.5 ${!allLinesMode && selectedLine?.id === line.id ? 'bg-[#f5f6f6]' : ''}`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isWorking ? 'bg-[#00a884]' : 'bg-[#dfe5e7]'}`}>
                            <Phone className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{line.label}</p>
                            <p className="text-[#667781] text-xs">{line.phone_number}</p>
                          </div>
                          <span className={`text-[10px] ${isWorking ? 'text-[#00a884]' : 'text-[#667781]'}`}>
                            {isWorking ? '● Aktif' : '○ Kapalı'}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
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
              {isAdmin && !allLinesMode && selectedLine && (
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
              {effectiveSessionWorking && (
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
              {effectiveSessionWorking ? (
                <>
                  {chatsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
                    </div>
                  ) : filteredChats.length > 0 ? (
                    filteredChats.map((chat, i) => {
                      const isActive = activeChat && (getChatSelectionKey(activeChat) === getChatSelectionKey(chat));
                      const lastMsgTime = getLastMessageTimestamp(chat);
                      const chatLineLabel = chat._lineLabel;
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
                              <p className="text-[#667781] text-xs truncate flex-1">
                                {getLastMessageBody(chat)}
                              </p>
                              {allLinesMode && chatLineLabel && (
                                <span className="text-[9px] text-white bg-[#00a884] rounded px-1 py-0.5 flex-shrink-0 ml-1">
                                  {chatLineLabel}
                                </span>
                              )}
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
                      onClick={() => fetchChats()}
                      disabled={chatsLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 text-[#667781] hover:text-[#111b21] text-xs transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${chatsLoading ? 'animate-spin' : ''}`} />
                      Sohbetleri Yenile
                    </button>
                  </div>
                </>
              ) : !allLinesMode && (sessionStatus === 'SCAN_QR_CODE' || connecting) ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00a884] mb-3" />
                  <p className="text-[#667781] text-sm mb-1">QR hazırlanıyor</p>
                  <p className="text-[#667781] text-xs">Birazdan sağ tarafta otomatik görünecek</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
                  ) : allLinesMode ? (
                    <>
                      <Power className="w-12 h-12 text-[#3b4a54] mb-3" />
                      <p className="text-[#667781] text-sm mb-3">Hiçbir hat bağlı değil</p>
                      <p className="text-[#667781] text-xs mb-4">Hatları bağlamak için aşağıdan bir hat seçin</p>
                      {lines.map(line => {
                        const lineStatus = lineSessionStatuses[line.id] || 'UNKNOWN';
                        return (
                          <Button
                            key={line.id}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAllLinesMode(false);
                              setSelectedLine(line);
                              setSessionStatus(lineStatus);
                            }}
                            className="mb-2 text-xs gap-1.5 border-[#e9edef] text-[#111b21] hover:bg-[#f5f6f6]"
                          >
                            <Phone className="w-3 h-3" /> {line.label}
                          </Button>
                        );
                      })}
                    </>
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
                      <div className="flex items-center gap-1">
                        <p className="text-[#667781] text-xs">{getChatSecondaryText(activeChat)}</p>
                        {activeChat._lineLabel && (
                          <span className="text-[9px] text-white bg-[#00a884] rounded px-1 py-0.5 ml-1">
                            {activeChat._lineLabel}
                          </span>
                        )}
                      </div>
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
                {!allLinesMode && (sessionStatus === 'SCAN_QR_CODE' || qrCode) && sessionStatus !== 'WORKING' ? (
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
                ) : effectiveSessionWorking ? (
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
                      {allLinesMode 
                        ? 'Hatları bağlamak için sol üstten bir hat seçin'
                        : selectedLine 
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
