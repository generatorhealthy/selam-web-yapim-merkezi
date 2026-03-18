import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Bot,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Trash2,
  MessageSquare,
  FileText,
  CreditCard,
  Scale,
  UserPlus,
  Phone,
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  { icon: CreditCard, label: "Ödeme Hatırlatma", prompt: "Aylık abonelik ödemesini yapmayan bir uzmana ödeme hatırlatma mesajı yaz. Uzman adı ve paket bilgisini ben vereceğim." },
  { icon: Scale, label: "Cayma Bedeli Bildirimi", prompt: "Sözleşme kapsamında cayma bedeli uygulanacak bir uzmana resmi bildirim metni yaz. Detayları ben vereceğim." },
  { icon: FileText, label: "Sözleşme Uyarısı", prompt: "Sözleşme şartlarını ihlal eden bir uzmana yazılacak resmi uyarı metni hazırla." },
  { icon: UserPlus, label: "Hoş Geldin Mesajı", prompt: "Platforma yeni kayıt olan bir uzmana hoş geldin mesajı yaz. Profesyonel ve sıcak bir dil kullan." },
  { icon: Phone, label: "İletişim Mesajı", prompt: "Bir müşteriye telefonla ulaşamadığımız için SMS ile gönderilecek kısa bir bilgilendirme mesajı yaz." },
  { icon: MessageSquare, label: "Genel Bilgilendirme", prompt: "Platformdaki değişiklikler hakkında tüm uzmanlara gönderilecek toplu bilgilendirme mesajı yaz." },
];

const AdminAIAssistant = () => {
  const { userProfile, loading } = useUserRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
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
      toast.error(e.message || "AI yanıt veremedi");
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

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Mesaj panoya kopyalandı");
  };

  const clearChat = () => {
    setMessages([]);
    toast.info("Sohbet temizlendi");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Helmet>
        <title>AI Asistan | Doktorum Ol Admin</title>
      </Helmet>
      <HorizontalNavigation />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <AdminBackButton />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Asistan</h1>
            <p className="text-sm text-gray-500">Kurumsal mesaj ve metin oluşturucu</p>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearChat} className="ml-auto">
              <Trash2 className="w-4 h-4 mr-1" /> Temizle
            </Button>
          )}
        </div>

        {/* Quick prompts */}
        {messages.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {QUICK_PROMPTS.map((qp) => (
              <Card
                key={qp.label}
                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-purple-100"
                onClick={() => handleSend(qp.prompt)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <qp.icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{qp.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{qp.prompt.slice(0, 60)}...</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chat area */}
        <Card className="border-purple-100 shadow-lg">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <Sparkles className="w-12 h-12 mb-3 text-purple-300" />
                  <p className="text-lg font-medium">Merhaba! Size nasıl yardımcı olabilirim?</p>
                  <p className="text-sm mt-1">Kurumsal mesaj, ödeme hatırlatma, sözleşme metni gibi konularda yardımcı olabilirim.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                        : "bg-white border border-purple-100 shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.role === "assistant" && !isStreaming && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => copyMessage(msg.content)}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Kopyala
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-purple-100 rounded-2xl px-4 py-3 shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-purple-100 p-4 flex gap-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın... (Shift+Enter ile yeni satır)"
                className="resize-none min-h-[48px] max-h-[120px] border-purple-200 focus:border-purple-400"
                rows={1}
                disabled={isStreaming}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 px-6"
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminAIAssistant;
