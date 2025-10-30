import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, Download, RefreshCw, Clock, HardDrive, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DatabaseBackup {
  id: number;
  backup_timestamp: string;
  backup_type: string;
  backup_status: string;
  tables_count: number;
  total_records: number;
  created_by: string | null;
  notes: string | null;
}

export const DatabaseBackupCard = () => {
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<DatabaseBackup | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('list_database_backups');
      
      if (error) throw error;
      
      setBackups(data || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast({
        title: "Hata",
        description: "Yedekler yüklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createManualBackup = async () => {
    try {
      setCreating(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;
      
      const { error } = await supabase.rpc('create_full_database_backup', {
        p_backup_type: 'manual',
        p_created_by: userId,
        p_notes: 'Manuel yedek - ' + new Date().toLocaleString('tr-TR'),
      });
      
      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: "Veritabanı yedeği oluşturuldu",
      });
      
      await fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: "Hata",
        description: "Yedek oluşturulurken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreClick = (backup: DatabaseBackup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;
    
    try {
      setRestoring(true);
      setRestoreDialogOpen(false);
      
      const { error } = await supabase.rpc('restore_from_backup', {
        p_backup_id: selectedBackup.id,
      });
      
      if (error) throw error;
      
      toast({
        title: "Başarılı",
        description: "Veritabanı geri yüklendi. Sayfa yenilenecek...",
      });
      
      // Reload page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Hata",
        description: "Geri yükleme sırasında hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
      setRestoring(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      failed: "destructive",
      in_progress: "secondary",
    };
    
    const labels: Record<string, string> = {
      completed: "Tamamlandı",
      failed: "Başarısız",
      in_progress: "Devam Ediyor",
    };
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const latestBackup = backups.find(b => b.backup_status === 'completed');

  return (
    <>
      <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Veritabanı Yedekleme</CardTitle>
                <CardDescription>
                  Otomatik yedekleme: Her gün 19:00
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={createManualBackup}
              disabled={creating || loading}
              size="sm"
              className="gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Manuel Yedek Al
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Son Yedek</span>
              </div>
              <p className="text-lg font-semibold">
                {latestBackup 
                  ? formatDate(latestBackup.backup_timestamp)
                  : "Henüz yok"}
              </p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">Toplam Yedek</span>
              </div>
              <p className="text-lg font-semibold">{backups.length}</p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Database className="h-4 w-4" />
                <span className="text-sm">Son Kayıt Sayısı</span>
              </div>
              <p className="text-lg font-semibold">
                {latestBackup?.total_records?.toLocaleString('tr-TR') || "0"}
              </p>
            </div>
          </div>

          {/* Backups List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Mevcut Yedekler</h3>
              <Button
                onClick={fetchBackups}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz yedek bulunmuyor
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">Tablo</TableHead>
                      <TableHead className="text-right">Kayıt</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">
                          {formatDate(backup.backup_timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {backup.backup_type === 'automatic' ? 'Otomatik' : 'Manuel'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(backup.backup_status)}
                            {getStatusBadge(backup.backup_status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {backup.tables_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {backup.total_records?.toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleRestoreClick(backup)}
                            disabled={backup.backup_status !== 'completed' || restoring}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Geri Yükle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Önemli Uyarı:</p>
              <p>Yedekleri geri yükleme işlemi mevcut tüm verileri siler ve yedeği geri yükler. Bu işlem geri alınamaz!</p>
              <p className="mt-1">Yedekler 30 gün boyunca saklanır, daha eski yedekler otomatik olarak silinir.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Veritabanını Geri Yükle</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Aşağıdaki yedek noktasına geri dönmek istediğinizden emin misiniz?
              </p>
              {selectedBackup && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <p><strong>Tarih:</strong> {formatDate(selectedBackup.backup_timestamp)}</p>
                  <p><strong>Tür:</strong> {selectedBackup.backup_type === 'automatic' ? 'Otomatik' : 'Manuel'}</p>
                  <p><strong>Tablo Sayısı:</strong> {selectedBackup.tables_count}</p>
                  <p><strong>Kayıt Sayısı:</strong> {selectedBackup.total_records?.toLocaleString('tr-TR')}</p>
                </div>
              )}
              <p className="text-destructive font-semibold mt-4">
                ⚠️ Bu işlem mevcut tüm verileri silecek ve geri alınamaz!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="bg-destructive hover:bg-destructive/90"
            >
              Geri Yükle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};