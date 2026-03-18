import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Helmet } from "react-helmet-async";
import DokiIcon from "@/components/DokiIcon";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Loader2,
  Copy,
  Trash2,
  FileText,
  CreditCard,
  Scale,
  UserPlus,
  Phone,
  MessageSquare,
  RotateCcw,
  Check,
  Plus,
  ArrowLeft,
  Menu,
  X,
  ImagePlus,
  Code,
  Globe,
  BookOpen,
  Sparkles,
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; images?: string[] };
type Conversation = { id: string; title: string; created_at: string; updated_at: string };
type AssistantResponse = { content: string; images?: string[] };

const QUICK_PROMPTS = [
  { icon: Sparkles, label: "Genel Soru", prompt: "Merhaba Doki, bana nasıl yardımcı olabilirsin?" },
  { icon: Code, label: "Kod Yardımı", prompt: "Bir React componenti nasıl oluştururum? Örnek kodla açıkla." },
  { icon: CreditCard, label: "Ödeme Hatırlatma", prompt: "Aylık abonelik ödemesini yapmayan bir uzmana ödeme hatırlatma mesajı yaz." },
  { icon: Scale, label: "Cayma Bedeli", prompt: "Sözleşme kapsamında cayma bedeli uygulanacak bir uzmana resmi bildirim metni yaz." },
  { icon: FileText, label: "Sözleşme Uyarısı", prompt: "Sözleşme şartlarını ihlal eden bir uzmana resmi uyarı metni hazırla." },
  { icon: UserPlus, label: "Hoş Geldin", prompt: "Platforma yeni kayıt olan bir uzmana hoş geldin mesajı yaz." },
  { icon: Globe, label: "SEO Analizi", prompt: "Bir web sayfası için SEO optimizasyonu önerileri sun." },
  { icon: BookOpen, label: "Blog Yazısı", prompt: "Psikolojik sağlık hakkında profesyonel bir blog yazısı taslağı hazırla." },
];

const AdminAIAssistant = () => {
  const { userProfile, loading } = useUserRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("doki_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from("doki_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  }, []);

  useEffect(() => {
    if (userProfile) loadConversations();
  }, [userProfile, loadConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const selectConversation = async (conv: Conversation) => {
    setActiveConversationId(conv.id);
    await loadMessages(conv.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setPendingImages([]);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("doki_conversations").delete().eq("id", id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    loadConversations();
    toast.success("Sohbet silindi");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Dosya boyutu 10MB'dan küçük olmalıdır.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPendingImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const streamChat = async (userMessages: Message[]): Promise<AssistantResponse> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
    }

    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messages: userMessages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.images && m.images.length > 0 ? { images: m.images } : {}),
        })),
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Bilinmeyen hata" }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }

    const contentType = resp.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await resp.json().catch(() => null);
      const images = Array.isArray(data?.images)
        ? data.images.filter((img: unknown): img is string => typeof img === "string" && img.length > 0)
        : [];

      const assistantResponse: AssistantResponse = {
        content: typeof data?.content === "string" ? data.content : "Görsel düzenleme tamamlandı.",
        ...(images.length > 0 ? { images } : {}),
      };

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const nextAssistant: Message = {
          role: "assistant",
          content: assistantResponse.content,
          ...(assistantResponse.images && assistantResponse.images.length > 0 ? { images: assistantResponse.images } : {}),
        };

        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? nextAssistant : m));
        }

        return [...prev, nextAssistant];
      });

      return assistantResponse;
    }

    if (!resp.body) throw new Error("Stream başlatılamadı");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) upsert(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return { content: assistantSoFar };
  };

  const formatAssistantContentForStorage = (assistantResponse: AssistantResponse) => {
    const baseContent = assistantResponse.content?.trim() || "";

    if (!assistantResponse.images || assistantResponse.images.length === 0) {
      return baseContent;
    }

    const imageMarkdown = assistantResponse.images
      .map((img, index) => `![Doki Görsel ${index + 1}](${img})`)
      .join("\n\n");

    return [baseContent, imageMarkdown].filter(Boolean).join("\n\n");
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if ((!msg && pendingImages.length === 0) || isStreaming) return;

    const userMsg: Message = {
      role: "user",
      content: msg || "Bu görseli analiz et.",
      ...(pendingImages.length > 0 ? { images: [...pendingImages] } : {}),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingImages([]);
    setIsStreaming(true);

    try {
      let convId = activeConversationId;
      if (!convId) {
        const title = msg ? (msg.length > 40 ? msg.slice(0, 40) + "..." : msg) : "Görsel analizi";
        const { data: conv } = await supabase
          .from("doki_conversations")
          .insert({ user_id: (await supabase.auth.getUser()).data.user!.id, title })
          .select()
          .single();
        if (conv) {
          convId = conv.id;
          setActiveConversationId(conv.id);
        }
      }

      if (convId) {
        await supabase.from("doki_messages").insert({ conversation_id: convId, role: "user", content: userMsg.content });
      }

      const assistantResponse = await streamChat(newMessages);
      const assistantContentForStorage = formatAssistantContentForStorage(assistantResponse);

      if (convId && assistantContentForStorage) {
        await supabase.from("doki_messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantContentForStorage,
        });
        await supabase.from("doki_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }

      loadConversations();
    } catch (e: any) {
      toast.error(e.message || "Doki yanıt veremedi");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("Kopyalandı");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const regenerateLastMessage = async () => {
    if (isStreaming || messages.length < 2) return;
    const withoutLast = messages.slice(0, -1);
    setMessages(withoutLast);
    setIsStreaming(true);
    try {
      const assistantResponse = await streamChat(withoutLast);
      const assistantContentForStorage = formatAssistantContentForStorage(assistantResponse);
      if (activeConversationId && assistantContentForStorage) {
        const { data: lastMsg } = await supabase
          .from("doki_messages")
          .select("id")
          .eq("conversation_id", activeConversationId)
          .eq("role", "assistant")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (lastMsg) {
          await supabase.from("doki_messages").update({ content: assistantContentForStorage }).eq("id", lastMsg.id);
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Doki yanıt veremedi");
    } finally {
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center animate-pulse">
            <DokiIcon className="w-8 h-8" color="white" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Doki yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !["admin", "staff", "legal", "muhasebe"].includes(userProfile.role)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Helmet>
        <title>Doki | Doktorum Ol</title>
      </Helmet>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 flex-shrink-0 overflow-hidden`}>
        <div className="w-72 h-full flex flex-col bg-slate-900 text-white">
          <div className="p-4 flex items-center gap-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center">
              <DokiIcon className="w-5 h-5" color="white" />
            </div>
            <span className="font-bold text-lg">Doki</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-3">
            <Button
              onClick={startNewConversation}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 gap-2 rounded-xl h-10"
              variant="ghost"
            >
              <Plus className="w-4 h-4" /> Yeni Sohbet
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1 pb-4">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm truncate transition-colors group flex items-center gap-2 ${
                    activeConversationId === conv.id
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full text-white/60 hover:text-white hover:bg-white/10 gap-2 justify-start rounded-xl h-10"
              onClick={() => window.location.href = "/divan_paneli/dashboard"}
            >
              <ArrowLeft className="w-4 h-4" /> Panele Dön
            </Button>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-3 flex-shrink-0">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-slate-500 hover:text-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center">
              <DokiIcon className="w-4 h-4" color="white" />
            </div>
            <span className="font-semibold text-slate-800">Doki</span>
            <span className="text-xs text-slate-400 hidden sm:inline">— Gelişmiş AI Asistan</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-slate-400 hover:text-slate-700"
                onClick={startNewConversation}
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="max-w-4xl mx-auto px-6 py-6 min-h-full flex flex-col">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center mb-5">
                  <DokiIcon className="w-9 h-9" color="hsl(210, 90%, 50%)" />
                </div>
                <h2 className="text-xl font-bold text-slate-700 mb-2">Merhaba! Ben Doki 🚀</h2>
                <p className="text-sm text-slate-400 max-w-md text-center mb-8">
                  Her konuda yardımcı olabilirim: kod yazma, metin üretme, görsel analiz, kurumsal mesajlar, SEO, strateji ve çok daha fazlası.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => handleSend(qp.prompt)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:shadow-md transition-all duration-200"
                    >
                      <qp.icon className="w-3.5 h-3.5" />
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex-1 space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 mt-1 overflow-hidden">
                        <DokiIcon className="w-7 h-7" />
                      </div>
                    )}
                    <div className={`flex-1 ${msg.role === "user" ? "flex flex-col items-end max-w-full" : "max-w-full"}`}>
                      {/* Show images if any */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 justify-end">
                          {msg.images.map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={img}
                              alt="Uploaded"
                              className="max-w-[200px] max-h-[200px] rounded-xl border border-slate-200 object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <div
                        className={`inline-block text-left ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-blue-500 via-blue-600 to-sky-600 text-white shadow-md rounded-2xl rounded-br-md px-5 py-3 max-w-[75%]"
                            : "w-full"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-base max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-800 prose-li:text-slate-700 prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>

                      {msg.role === "assistant" && !isStreaming && (
                        <div className="flex items-center gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            onClick={() => copyMessage(msg.content, i)}
                          >
                            {copiedIndex === i ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Copy className="w-3 h-3 mr-1" />}
                            {copiedIndex === i ? "Kopyalandı" : "Kopyala"}
                          </Button>
                          {i === messages.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              onClick={regenerateLastMessage}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" /> Yeniden Yaz
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm text-white text-xs font-bold">
                        {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <DokiIcon className="w-4 h-4" color="white" />
                    </div>
                    <div className="flex items-center gap-2 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm text-slate-400">Doki düşünüyor...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Pending images preview */}
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {pendingImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0 mb-0.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                title="Görsel ekle"
              >
                <ImagePlus className="w-5 h-5" />
              </Button>
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Doki'ye her şeyi sorabilirsiniz... (Shift+Enter ile yeni satır)"
                  className="resize-none min-h-[56px] max-h-[200px] pr-14 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-2xl bg-slate-50 text-base py-4 px-5"
                  rows={2}
                  disabled={isStreaming}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && pendingImages.length === 0) || isStreaming}
                  className="absolute right-2 bottom-2 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 h-10 w-10 rounded-xl shadow-lg shadow-blue-500/20 p-0 flex-shrink-0"
                >
                  {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">Doki — Doktorum Ol Gelişmiş AI Asistanı • Görsel yükleyerek analiz yaptırabilirsiniz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAIAssistant;
