import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Copy, Check } from "lucide-react";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; specialistName: string; specialistSpecialty?: string; specialistUrl: string; }
const WhatsAppContactDialog = ({ open, onOpenChange, specialistName, specialistUrl }: Props) => {
 const { toast } = useToast();
 const [copied, setCopied] = useState(false);
 let url = "";
 try { const parsed = new URL(specialistUrl); if (["doktorumol.com.tr", "www.doktorumol.com.tr", window.location.hostname].includes(parsed.hostname)) url = `https://doktorumol.com.tr${parsed.pathname}`; } catch { /* invalid link stays disabled */ }
 return <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-md">
   <DialogHeader>
    <DialogTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" />Randevu Linki Al</DialogTitle>
    <DialogDescription>{specialistName}</DialogDescription>
   </DialogHeader>
   <div className="space-y-3 pt-2">
    <p className="break-all text-sm text-muted-foreground">{url}</p>
    <Button className="w-full" disabled={!url} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer")}><MessageCircle className="mr-2 h-4 w-4" />WhatsApp'ta Aç</Button>
    <Button variant="outline" className="w-full" disabled={!url} onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { toast({ title: "Bağlantı kopyalanamadı", variant: "destructive" }); } }}>{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Kopyalandı" : "Bağlantıyı Kopyala"}</Button>
   </div>
  </DialogContent>
 </Dialog>;
};
export default WhatsAppContactDialog;
