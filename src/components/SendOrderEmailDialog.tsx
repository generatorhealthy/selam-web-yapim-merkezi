import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Upload, FileText, X, Loader2 } from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  package_name: string;
}

interface SendOrderEmailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedFile {
  file: File;
  base64: string;
}

const SendOrderEmailDialog = ({ order, open, onOpenChange }: SendOrderEmailDialogProps) => {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState<string>(order?.customer_email ?? "");
  const [message, setMessage] = useState<string>(
    `Merhaba,\n\nSipariş belgeleriniz ekte yer almaktadır.\n\nHerhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.\n\nSaygılarımızla,\nDoktorumol Ekibi`
  );
  const [invoiceFile, setInvoiceFile] = useState<UploadedFile | null>(null);
  const [contractFile, setContractFile] = useState<UploadedFile | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setRecipientEmail(order?.customer_email ?? "");
  }, [order?.customer_email, open]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'invoice' | 'contract'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Hata",
        description: "Sadece PDF dosyaları yükleyebilirsiniz",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Hata",
        description: "Dosya boyutu 10MB'dan büyük olamaz",
        variant: "destructive"
      });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const uploadedFile: UploadedFile = { file, base64 };
      
      if (type === 'invoice') {
        setInvoiceFile(uploadedFile);
      } else {
        setContractFile(uploadedFile);
      }
    } catch (error) {
      console.error('Error converting file to base64:', error);
      toast({
        title: "Hata",
        description: "Dosya yüklenirken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const removeFile = (type: 'invoice' | 'contract') => {
    if (type === 'invoice') {
      setInvoiceFile(null);
    } else {
      setContractFile(null);
    }
  };

  const handleSendEmail = async () => {
    if (!order) return;

    const normalizedEmail = recipientEmail.trim().toLowerCase();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!emailIsValid) {
      toast({
        title: "Hata",
        description: `E-posta adresi hatalı görünüyor: ${recipientEmail}`,
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen bir mesaj yazın",
        variant: "destructive"
      });
      return;
    }

    if (!invoiceFile && !contractFile) {
      toast({
        title: "Hata",
        description: "Lütfen en az bir dosya yükleyin",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-order-documents-email', {
        body: {
          customerEmail: normalizedEmail,
          customerName: order.customer_name,
          packageName: order.package_name,
          message: message,
          invoicePdf: invoiceFile?.base64,
          contractPdf: contractFile?.base64,
          invoiceFileName: invoiceFile?.file.name,
          contractFileName: contractFile?.file.name
        }
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `E-posta ${normalizedEmail} adresine gönderildi`,
      });

      // Reset form
      setInvoiceFile(null);
      setContractFile(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Hata",
        description: error.message || "E-posta gönderilirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Sipariş Belgelerini Gönder
          </DialogTitle>
          <DialogDescription>
            {order?.customer_name} ({recipientEmail || order?.customer_email}) adresine fatura ve sözleşme belgelerini gönderin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Alıcı E-posta</Label>
            <Input
              id="recipientEmail"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="ornek@domain.com"
              autoComplete="email"
            />
          </div>

          {/* Invoice Upload */}
          <div className="space-y-2">
            <Label htmlFor="invoice">Fatura (PDF)</Label>
            {invoiceFile ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium truncate max-w-[200px]">
                    {invoiceFile.file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('invoice')}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Fatura PDF yükle</p>
                </div>
                <input
                  id="invoice"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'invoice')}
                />
              </label>
            )}
          </div>

          {/* Contract Upload */}
          <div className="space-y-2">
            <Label htmlFor="contract">Sözleşme (PDF)</Label>
            {contractFile ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium truncate max-w-[200px]">
                    {contractFile.file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('contract')}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Sözleşme PDF yükle</p>
                </div>
                <input
                  id="contract"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'contract')}
                />
              </label>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Müşteriye gönderilecek mesajı yazın..."
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            İptal
          </Button>
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Gönder
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendOrderEmailDialog;
