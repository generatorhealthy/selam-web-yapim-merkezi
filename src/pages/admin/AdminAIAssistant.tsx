import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
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
} from "lucide-react";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const AdminAIAssistant = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content:
        "You are a helpful AI assistant named Doktorum AI. You are here to help the Doktorum team with their tasks. You are able to understand natural language and respond accordingly. You can generate content, translate languages, summarize text, answer questions, and more. You are trained on a massive amount of text data and are able to communicate and generate human-like text in response to a wide range of prompts and questions. For example, you could provide summaries of factual topics or create stories.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isRegenerate, setIsRegenerate] = useState(false);
  const [userRole, isLoading] = useUserRole();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (userRole !== "admin") {
      window.location.href = "/";
    }
  }, [userRole]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("openai", {
        body: { messages: updatedMessages },
      });

      if (error) {
        console.error("Function invocation error:", error);
        setError(error.message || "An error occurred");
        toast.error(error.message || "An error occurred");
      } else {
        const aiResponse: ChatMessage = {
          role: "assistant",
          content: data.choices[0].message.content,
        };
        setMessages([...updatedMessages, aiResponse]);
      }
    } catch (err: any) {
      console.error("Error calling the function:", err);
      setError(err.message || "An unexpected error occurred");
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = () => {
    const fullText = messages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        setIsCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setIsCopied(false), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy text to clipboard.");
      });
  };

  const resetConversation = () => {
    setMessages([
      {
        role: "system",
        content:
          "You are a helpful AI assistant named Doktorum AI. You are here to help the Doktorum team with their tasks. You are able to understand natural language and respond accordingly. You can generate content, translate languages, summarize text, answer questions, and more. You are trained on a massive amount of text data and are able to communicate and generate human-like text in response to a wide range of prompts and questions. For example, you could provide summaries of factual topics or create stories.",
      },
    ]);
    setIsReset(true);
    toast.success("Conversation reset!");
    setTimeout(() => setIsReset(false), 3000);
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) {
      toast.error("Nothing to regenerate.");
      return;
    }

    const previousMessages = messages.slice(0, -1);
    setMessages(previousMessages);

    const lastUserMessage = previousMessages.find(
      (message) => message.role === "user"
    );

    if (lastUserMessage) {
      setLoading(true);
      setError(null);
      setIsRegenerate(true);

      try {
        const { data, error } = await supabase.functions.invoke("openai", {
          body: { messages: previousMessages },
        });

        if (error) {
          console.error("Function invocation error:", error);
          setError(error.message || "An error occurred");
          toast.error(error.message || "An error occurred");
        } else {
          const aiResponse: ChatMessage = {
            role: "assistant",
            content: data.choices[0].message.content,
          };
          setMessages([...previousMessages, aiResponse]);
        }
      } catch (err: any) {
        console.error("Error calling the function:", err);
        setError(err.message || "An unexpected error occurred");
        toast.error(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
        setIsRegenerate(false);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin AI Assistant | Doktorum</title>
      </Helmet>
      <HorizontalNavigation />
      <AdminBackButton />
      <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
        <div className="flex flex-col items-center justify-center">
          <DokiIcon className="h-16 w-16 md:h-24 md:w-24" />
          <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0 md:text-5xl lg:text-5xl">
            Doktorum AI Assistant
          </h1>
          <p className="max-w-[85%] text-sm text-muted-foreground sm:text-lg">
            Ask me anything. I am here to help the Doktorum team with their
            tasks.
          </p>
        </div>
        <Card className="col-span-2 w-full">
          <CardContent className="flex flex-col gap-4">
            <div
              ref={chatContainerRef}
              className="mb-4 h-[50vh] overflow-y-auto rounded-md border bg-secondary p-4"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 rounded-md p-2 ${
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-secondary/50"
                  }`}
                >
                  <div className="mb-1 font-bold">
                    {message.role === "user" ? "You:" : "Doktorum AI:"}
                  </div>
                  <div>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mb-2 rounded-md bg-muted p-2">
                  <div className="mb-1 font-bold">Doktorum AI:</div>
                  <div>
                    <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              {error && (
                <div className="mb-2 rounded-md bg-red-100 p-2 text-red-700">
                  Error: {error}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="flex-grow"
              />
              <Button onClick={sendMessage} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <div className="flex justify-between">
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={isCopied}
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Conversation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConversation}
                  disabled={isReset}
                  className="ml-2"
                >
                  {isReset ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Reset!
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset Conversation
                    </>
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateResponse}
                disabled={loading || isRegenerate}
              >
                {loading || isRegenerate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate Response
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <Footer />
    </>
  );
};

export default AdminAIAssistant;
