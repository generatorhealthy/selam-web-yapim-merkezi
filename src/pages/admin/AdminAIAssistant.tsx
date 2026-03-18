import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Loader2,
  Sparkles,
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
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  { icon: CreditCard, label: "Ödeme Hatırlatma", prompt: "Aylık abonelik ödemesini yapmayan bir uzmana ödeme hatırlatma mesajı yaz. Uzman adı ve paket bilgisini ben vereceğim.", color: "from-rose-500 to-pink-600" },
  { icon: Scale, label: "Cayma Bedeli Bildirimi", prompt: "Sözleşme kapsamında cayma bedeli uygulanacak bir uzmana resmi bildirim metni yaz. Detayları ben vereceğim.", color: "from-amber-500 to-orange-600" },
  { icon: FileText, label: "Sözleşme Uyarısı", prompt: "Sözleşme şartlarını ihlal eden bir uzmana yazılacak resmi uyarı metni hazırla.", color: "from-blue-500 to-indigo-600" },
  { icon: UserPlus, label: "Hoş Geldin Mesajı", prompt: "Platforma yeni kayıt olan bir uzmana hoş geldin mesajı yaz. Profesyonel ve sıcak bir dil kullan.", color: "from-emerald-500 to-teal-600" },
  { icon: Phone, label: "İletişim Mesajı", prompt: "Bir müşteriye telefonla ulaşamadığımız için SMS ile gönderilecek kısa bir bilgilendirme mesajı yaz.", color: "from-violet-500 to-purple-600" },
  { icon: MessageSquare, label: "Genel Bilgilendirme", prompt: "Platformdaki değişiklikler hakkında tüm uzmanlara gönderilecek toplu bilgilendirme mesajı yaz.", color: "from-cyan-500 to-blue-600" },
];

const AdminAIAssistant = () => {
  const { userProfile, loading } = useUserRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
      return;
    }

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: userMessages }),
      }
    );

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Bilinmeyen hata" }));
      throw new Error(err.error || `HTTP ${resp.status}`);
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
        if (jsonStr === "[DONE]") { streamDone = true; break; }
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
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;

    const userMsg: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    try {
      await streamChat(newMessages);
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
    toast.success("Mesaj panoya kopyalandı");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const regenerateLastMessage = async () => {
    if (isStreaming || messages.length < 2) return;
    // Remove last assistant message and re-send
    const withoutLast = messages.slice(0, -1);
    setMessages(withoutLast);
    setIsStreaming(true);
    try {
      await streamChat(withoutLast);
    } catch (e: any) {
      toast.error(e.message || "Doki yanıt veremedi");
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.info("Sohbet temizlendi");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Doki yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !["admin", "staff", "legal", "muhasebe"].includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/20">
      <Helmet>
        <title>Doki | Doktorum Ol Admin</title>
      </Helmet>
      <HorizontalNavigation />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <AdminBackButton />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
              Doki
            </h1>
            <p className="text-sm text-slate-500">Kurumsal yapay zeka asistanınız • Mesaj & metin oluşturucu</p>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearChat} className="gap-1.5 rounded-xl border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors">
              <Trash2 className="w-4 h-4" /> Temizle
            </Button>
          )}
        </div>

        {/* Quick prompts */}
        {messages.length === 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Hızlı Şablonlar</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleSend(qp.prompt)}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${qp.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className="relative flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${qp.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <qp.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{qp.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{qp.prompt.slice(0, 55)}...</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
        <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-5" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-700 mb-2">Merhaba! Ben Doki 👋</h2>
                  <p className="text-sm text-slate-400 max-w-sm">
                    Kurumsal mesaj, ödeme hatırlatma, sözleşme metni ve daha fazlası için buradayım. Nasıl yardımcı olabilirim?
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`mb-5 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 mr-3 mt-1 shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20"
                          : "bg-white border border-slate-100 shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-800 prose-li:text-slate-600">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>

                    {msg.role === "assistant" && !isStreaming && (
                      <div className="flex items-center gap-1 mt-1.5 ml-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          onClick={() => copyMessage(msg.content, i)}
                        >
                          {copiedIndex === i ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Copy className="w-3 h-3 mr-1" />}
                          {copiedIndex === i ? "Kopyalandı" : "Kopyala"}
                        </Button>
                        {i === messages.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            onClick={regenerateLastMessage}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Yeniden Yaz
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 mr-3 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                      <span className="text-sm text-slate-400">Doki düşünüyor...</span>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
              <div className="flex gap-3 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Doki'ye bir şey sorun... (Shift+Enter ile yeni satır)"
                  className="resize-none min-h-[48px] max-h-[120px] border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl bg-white"
                  rows={1}
                  disabled={isStreaming}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-700 px-5 h-12 rounded-xl shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">Doki, Doktorum Ol platformunun kurumsal yapay zeka asistanıdır.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminAIAssistant;
