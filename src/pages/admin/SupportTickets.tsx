import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminBackButton from "@/components/AdminBackButton";
import { Helmet } from "react-helmet-async";
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar, Tag, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface SupportTicket {
  id: string;
  specialist_id: string;
  specialist_name: string;
  specialist_email: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'general' | 'technical' | 'payment' | 'account' | 'other';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  admin_response?: string;
}

const SupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Hata",
        description: "Destek talepleri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async () => {
    if (!selectedTicket || !adminResponse.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          admin_response: adminResponse,
          status: newStatus || selectedTicket.status,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // Email gönderimi
      const { error: emailError } = await supabase.functions.invoke('send-support-response', {
        body: {
          ticketId: selectedTicket.id,
          specialistEmail: selectedTicket.specialist_email,
          specialistName: selectedTicket.specialist_name,
          ticketTitle: selectedTicket.title,
          adminResponse: adminResponse,
          status: newStatus || selectedTicket.status
        }
      });

      if (emailError) {
        console.error('Email gönderimi hatası:', emailError);
        toast({
          title: "Uyarı",
          description: "Cevap kaydedildi ancak email gönderilemedi.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Başarılı",
          description: "Cevap gönderildi ve uzman bilgilendirildi.",
        });
      }

      setAdminResponse("");
      setNewStatus("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Hata",
        description: "Cevap gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Bu destek talebini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Destek talebi silindi.",
      });

      fetchTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: "Hata",
        description: "Destek talebi silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return 'Genel';
      case 'technical': return 'Teknik';
      case 'payment': return 'Ödeme';
      case 'account': return 'Hesap';
      case 'other': return 'Diğer';
      default: return category;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Acil';
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      case 'closed': return 'Kapalı';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Destek talepleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Destek Talepleri - Doktorum Ol</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <AdminBackButton />
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Destek Talepleri</h1>
                <p className="text-gray-600">Uzman destek taleplerini görüntüle ve yönet</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Toplam {tickets.length} talep</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>{tickets.filter(t => t.status === 'open').length} açık talep</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{tickets.filter(t => t.status === 'resolved').length} çözülmüş talep</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{ticket.title}</CardTitle>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{ticket.specialist_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          <span>{getCategoryLabel(ticket.category)}</span>
                        </div>
                      </div>
                      
                      <CardDescription className="text-gray-700">
                        {ticket.description}
                      </CardDescription>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setAdminResponse(ticket.admin_response || "");
                              setNewStatus(ticket.status);
                            }}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Cevapla
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Destek Talebine Cevap Ver</DialogTitle>
                          <DialogDescription>
                            {selectedTicket?.specialist_name} - {selectedTicket?.title}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Talep Detayı:
                            </label>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                              {selectedTicket?.description}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Durumu Güncelle:
                            </label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Durum seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Açık</SelectItem>
                                <SelectItem value="in_progress">İşlemde</SelectItem>
                                <SelectItem value="resolved">Çözüldü</SelectItem>
                                <SelectItem value="closed">Kapalı</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Cevabınız:
                            </label>
                            <Textarea
                              value={adminResponse}
                              onChange={(e) => setAdminResponse(e.target.value)}
                              placeholder="Uzmanın talebine cevabınızı yazın..."
                              rows={5}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedTicket(null);
                                setAdminResponse("");
                                setNewStatus("");
                              }}
                            >
                              İptal
                            </Button>
                            <Button
                              onClick={handleResponseSubmit}
                              disabled={submitting || !adminResponse.trim()}
                            >
                              {submitting ? "Gönderiliyor..." : "Cevabı Gönder"}
                            </Button>
                          </div>
                        </div>
                        </DialogContent>
                      </Dialog>
                      
                      {ticket.status === 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {ticket.admin_response && (
                  <CardContent>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Doktorum Ol:</h4>
                      <p className="text-blue-800 text-sm">{ticket.admin_response}</p>
                      {ticket.resolved_at && (
                        <p className="text-xs text-blue-600 mt-2">
                          Çözüldü: {format(new Date(ticket.resolved_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            
            {tickets.length === 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz destek talebi yok</h3>
                  <p className="text-gray-600">Uzmanlardan gelen destek talepleri burada görünecek.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportTickets;