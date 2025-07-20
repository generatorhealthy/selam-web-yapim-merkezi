
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BankTransferInfoProps {
  amount: number;
  customerName: string;
  onComplete: () => void;
}

const BankTransferInfo = ({ amount, customerName, onComplete }: BankTransferInfoProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const bankInfo = {
    bankName: "Akbank Bankası",
    accountName: "Doktorum Ol Bilgi Ve Teknoloji Hizmetleri",
    iban: "TR95 0004 6007 2188 8000 3848 15"
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast({
        title: "Kopyalandı",
        description: `${field} panoya kopyalandı.`
      });
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Banknote className="w-6 h-6" />
          Havale/EFT Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-3">Ödeme Bilgileri</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Banka:</span>
              <div className="flex items-center gap-2">
                <span>{bankInfo.bankName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo.bankName, "Banka adı")}
                  className="h-6 w-6 p-0"
                >
                  {copiedField === "Banka adı" ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Hesap Adı:</span>
              <div className="flex items-center gap-2">
                <span>{bankInfo.accountName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo.accountName, "Hesap adı")}
                  className="h-6 w-6 p-0"
                >
                  {copiedField === "Hesap adı" ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">IBAN:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{bankInfo.iban}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(bankInfo.iban, "IBAN")}
                  className="h-6 w-6 p-0"
                >
                  {copiedField === "IBAN" ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Tutar:</span>
              <span className="font-semibold text-green-700">
                {amount.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-2">⚠️ Önemli Bilgilendirme</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Ödeme yaparken açıklama kısmına <strong>Ad Soyad</strong> yazınız</li>
            <li>• Ödeme dekontunuzu Whatsapp Hattımızdan iletebilirsiniz</li>
            <li>• Ödemeniz onaylandıktan sonra hesabınız aktifleştirilecektir</li>
          </ul>
        </div>

        <Button 
          onClick={onComplete}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Tamam, Anladım
        </Button>
      </CardContent>
    </Card>
  );
};

export default BankTransferInfo;
