import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialistName: string;
  specialistSpecialty?: string;
  specialistUrl: string;
}

const WhatsAppContactDialog = ({
  open,
  onOpenChange,
  specialistName,
  specialistSpecialty,
  specialistUrl,
}: Props) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const digits = phone.replace(/\D/g, "");

    if (trimmedName.length < 2) {
      toast({ title: "Ad gerekli", description: "Lütfen adınızı giriniz.", variant: "destructive" });
      return;
    }
    if (digits.length < 10 || digits.length > 12) {
      toast({ title: "Geçersiz telefon", description: "Lütfen geçerli bir telefon numarası giriniz.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-patient-contact", {
        body: {
          patientName: trimmedName,
          patientPhone: phone,
          specialistName,
          specialistSpecialty,
          specialistUrl,
        },
      });

      if (error) throw error;
      if ((data as any)?.success === false) throw new Error((data as any)?.error || "Gönderim başarısız");

      toast({
        title: "Mesaj gönderildi 🎉",
        description: "WhatsApp ve SMS olarak randevu linki telefonunuza iletildi.",
      });
      setName("");
      setPhone("");
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gönderilemedi",
        description: err?.message || "Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Randevu Linki Al
          </DialogTitle>
          <DialogDescription>
            Bilgilerinizi girin; <strong>{specialistName}</strong> için randevu linki WhatsApp ve SMS olarak telefonunuza gönderilsin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="wa-name">Ad Soyad</Label>
            <Input
              id="wa-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız Soyadınız"
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-phone">Telefon Numarası</Label>
            <Input
              id="wa-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              maxLength={20}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gönderiliyor...</>
            ) : (
              <><MessageCircle className="w-4 h-4 mr-2" /> Linki Gönder</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppContactDialog;
