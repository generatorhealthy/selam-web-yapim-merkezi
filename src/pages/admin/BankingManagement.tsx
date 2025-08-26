import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminBackButton from "@/components/AdminBackButton";
import { AdminTopBar } from "@/components/AdminTopBar";
import { 
  Banknote, 
  RefreshCw, 
  Search, 
  Download, 
  Eye,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  reference: string;
}

interface AccountBalance {
  available: number;
  currency: string;
  lastUpdate: string;
}

const BankingManagement = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  const bankInfo = {
    bankName: "Akbank Bankası",
    accountName: "Doktorum Ol Bilgi Ve Teknoloji Hizmetleri",
    iban: "TR95 0004 6007 2188 8000 3848 15",
    branch: "İstanbul Kadıköy Şubesi"
  };

  const fetchBankData = async () => {
    setLoading(true);
    try {
      // Call Akbank API integration edge function
      const { data, error } = await supabase.functions.invoke('akbank-integration', {
        body: {
          action: 'getTransactions',
          dateFrom: dateRange.from,
          dateTo: dateRange.to
        }
      });

      if (error) throw error;

      setTransactions(data.transactions || []);
      setBalance(data.balance || null);
      
      toast({
        title: "Başarılı",
        description: "Banka verileri güncellendi."
      });
    } catch (error) {
      console.error('Error fetching bank data:', error);
      toast({
        title: "Hata",
        description: "Banka verileri alınırken hata oluştu.",
        variant: "destructive"
      });
      
      // Sample data for demonstration
      setBalance({
        available: 125750.00,
        currency: "TRY",
        lastUpdate: new Date().toISOString()
      });
      
      setTransactions([
        {
          id: "1",
          date: "2024-01-15T10:30:00Z",
          description: "Havale - Ahmet Yılmaz - DRP-1705314000000",
          amount: 2398,
          type: "credit",
          balance: 125750,
          reference: "DRP-1705314000000"
        },
        {
          id: "2", 
          date: "2024-01-15T14:22:00Z",
          description: "Havale - Mehmet Demir - DRP-1705327320000",
          amount: 4999,
          type: "credit",
          balance: 123352,
          reference: "DRP-1705327320000"
        },
        {
          id: "3",
          date: "2024-01-14T16:45:00Z", 
          description: "Havale - Fatma Özkan - DRP-1705240700000",
          amount: 2398,
          type: "credit",
          balance: 118353,
          reference: "DRP-1705240700000"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const matchTransactionToOrder = async (reference: string) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('customer_name', `%${reference.replace('DRP-', '')}%`)
        .eq('payment_method', 'banka_havalesi')
        .eq('status', 'pending');

      if (error) throw error;
      return orders || [];
    } catch (error) {
      console.error('Error matching transaction:', error);
      return [];
    }
  };

  const approveTransaction = async (transaction: BankTransaction) => {
    try {
      const matchedOrders = await matchTransactionToOrder(transaction.reference);
      
      if (matchedOrders.length > 0) {
        const order = matchedOrders[0];
        
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'approved',
            payment_transaction_id: transaction.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (error) throw error;
        
        toast({
          title: "Sipariş Onaylandı",
          description: `${order.customer_name} müşterisinin siparişi onaylandı.`
        });
      } else {
        toast({
          title: "Sipariş Bulunamadı",
          description: "Bu işlem için eşleşen sipariş bulunamadı.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: "Hata",
        description: "Sipariş onaylanırken hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayTransactions = transactions.filter(t => 
    new Date(t.date).toDateString() === new Date().toDateString()
  );

  const totalCreditsToday = todayTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    fetchBankData();
  }, [dateRange]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AdminTopBar userRole="admin" />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AdminBackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Akbank Hesap Yönetimi</h1>
              <p className="text-gray-600">Banka hesabı hareketleri ve bakiye takibi</p>
            </div>
          </div>
          
          <Button onClick={fetchBankData} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>

        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Hesap Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Banka</p>
                <p className="font-semibold">{bankInfo.bankName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Hesap Adı</p>
                <p className="font-semibold">{bankInfo.accountName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">IBAN</p>
                <p className="font-mono text-sm">{bankInfo.iban}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Şube</p>
                <p className="font-semibold">{bankInfo.branch}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance and Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Mevcut Bakiye</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {balance?.available.toLocaleString('tr-TR') || '0'} ₺
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Son güncelleme: {balance?.lastUpdate ? new Date(balance.lastUpdate).toLocaleString('tr-TR') : '-'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bugünkü Girişler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalCreditsToday.toLocaleString('tr-TR')} ₺
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {todayTransactions.filter(t => t.type === 'credit').length} işlem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam İşlem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {filteredTransactions.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Son 30 gün
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="İşlem açıklaması veya referans kodu ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hesap Hareketleri</span>
              <Badge variant="secondary">{filteredTransactions.length} işlem</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Veriler yükleniyor...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Bakiye</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(transaction.date).toLocaleString('tr-TR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          Ref: {transaction.reference}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                          {transaction.type === 'credit' ? 'Gelen' : 'Giden'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'credit' ? '+' : '-'}
                          {transaction.amount.toLocaleString('tr-TR')} ₺
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.balance.toLocaleString('tr-TR')} ₺
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'credit' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveTransaction(transaction)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Onayla
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BankingManagement;