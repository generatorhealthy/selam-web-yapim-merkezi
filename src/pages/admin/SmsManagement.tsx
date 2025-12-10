import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import { AdminTopBar } from "@/components/AdminTopBar";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Clock,
  Zap
} from "lucide-react";

interface Specialist {
  id: string;
  name: string;
  phone: string;
  email?: string;
  specialty: string;
  is_active: boolean;
}

const SmsManagement = () => {
  const { userProfile, loading } = useUserRole();
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [smsStatus, setSmsStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  const [recentSms, setRecentSms] = useState<any[]>([]);

  // SMS template messages
  const templates = [
    {
      title: "Danışana Ulaşım Sağlanmamış",
      message: "Merhaba  Hanım sizlere danışan yönlendirmesi sağlanmış ancak danışana ulaşım sağlanmamış, danışana ulaşıp bilgi verebilirsiniz. \n\nDanışan Bilgileri; 📞  Online danışmanlık"
    },
    {
      title: "Danışan Yönlendirmesi Sağlanmıştır", 
      message: "Merhaba XXX hanım,danışan yönlendirilimesi sağlanmıştır, danışana ulaşarak bilgi verebilirsiniz. 😊 🚩Danışan bilgileri: XXX 📲555 🌟Online Danismanlik"
    },
    {
      title: "Gecikmiş Ödeme",
      message: "XXX Hanım gecikmiş ödemeniz bulunmaktadır. En kısa sürede ödeme yapmanız gerekmektedir."
    },
    {
      title: "Sosyal Medya İçeriği",
      message: "Merhaba Değerli Uzmanımız,\nSosyal medya içeriğiniz paylaşılmıştır. Aşağıdaki bağlantı üzerinden inceleme sağlayabilirsiniz:\nLink"
    }
  ];

  // Helpers to resolve specialist phone primarily from latest approved/completed order
  const CENTRAL_NUMBERS = new Set<string>([
    '02167060611', '2167060611', '902167060611',
    '0216 706 06 11', '0 216 706 06 11', '216 706 06 11', '0216-706-06-11'
  ]);
  const digitsOnly = (s: string) => s.replace(/\D/g, '');
  const isCentralNumber = (phone?: string | null) => {
    if (!phone) return false;
    const d = digitsOnly(phone);
    return CENTRAL_NUMBERS.has(d) || d.endsWith('2167060611');
  };
  const normalizePhoneForSms = (phone?: string | null) => {
    if (!phone) return '';
    let d = digitsOnly(phone);
    if (!d) return '';
    if (d.startsWith('90')) return d;
    if (d.startsWith('0')) d = d.slice(1);
    if (!d.startsWith('90')) d = '90' + d;
    return d;
  };
  const normalizeName = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/\b(uzm\.?|psk\.?|dan\.?|dr\.?|psikolog|danışman)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

  const resolvePhoneFromOrders = async (spec: Specialist): Promise<string> => {
    try {
      const name = normalizeName(spec.name);
      let q = supabase
        .from('orders')
        .select('customer_phone, customer_email, customer_name, status, created_at')
        .in('status', ['approved', 'completed'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (spec.email) {
        q = q.ilike('customer_email', spec.email);
      } else if (name) {
        q = q.ilike('customer_name', `%${name}%`);
      }

      const { data, error } = await q;
      if (!error && Array.isArray(data) && data.length) {
        const phoneCandidate = (data.find((o: any) => o.customer_phone) as any)?.customer_phone as string | undefined;
        if (phoneCandidate && !isCentralNumber(phoneCandidate)) {
          return normalizePhoneForSms(phoneCandidate);
        }
      }
    } catch (e) {
      console.warn('[SmsManagement] resolvePhoneFromOrders failed', e);
    }
    // fallback to specialist table phone if present
    if (spec.phone && !isCentralNumber(spec.phone)) return normalizePhoneForSms(spec.phone);
    return '';
  };

  useEffect(() => {
    fetchSpecialists();
    fetchRecentSms();
    
    // Auto-refresh specialist list every 30 seconds
    const interval = setInterval(() => {
      fetchSpecialists();
      fetchRecentSms();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSpecialists = async () => {
    try {
      setIsFetching(true);
      console.info('[SmsManagement] fetchSpecialists: start');
      const { data, error } = await supabase
        .from('specialists')
        .select('id, name, phone, email, specialty, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      console.info('[SmsManagement] fetchSpecialists: loaded', data?.length || 0);
      setSpecialists(data || []);
    } catch (error: any) {
      console.error('Error fetching specialists:', error);
      toast({
        title: "Hata",
        description: "Uzmanlar yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const fetchRecentSms = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setRecentSms(data || []);
    } catch (error: any) {
      console.error('Error fetching recent SMS logs:', error);
    }
  };

  const handleSpecialistChange = (specialistId: string) => {
    setSelectedSpecialist(specialistId);
    if (!specialistId || specialistId === 'manual') {
      setPhoneNumber('');
      return;
    }
    const specialist = specialists.find(s => s.id === specialistId);
    if (specialist) {
      // Resolve from orders first, fallback to specialist phone
      (async () => {
        const resolved = await resolvePhoneFromOrders(specialist as Specialist);
        setPhoneNumber(resolved || '');
      })();
    } else {
      setPhoneNumber('');
    }
  };

  const handleTemplateSelect = (templateMessage: string) => {
    setMessage(templateMessage);
  };

  const sendSms = async () => {
    if (!phoneNumber || !message) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen telefon numarası ve mesaj giriniz.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setSmsStatus({type: null, message: ''});

      const tryInvoke = async (fnName: string) => {
        const { data, error } = await supabase.functions.invoke(fnName, {
          body: { phone: phoneNumber, message }
        });
        console.log(`[SmsManagement] ${fnName} response:`, { data, error });
        return { data, error };
      };

      let usedFunction = 'send-sms-via-static-proxy';
      let lastError: any | undefined = undefined;
      let resultData: any | undefined = undefined;

      const primary = await tryInvoke('send-sms-via-static-proxy');
      resultData = primary.data; lastError = primary.error;

      if (lastError || (resultData && resultData.success === false)) {
        console.warn('[SmsManagement] Primary failed. Trying fallbacks...');
        const fallbacks = ['send-sms-via-proxy', 'send-verimor-sms'];
        for (const fn of fallbacks) {
          const res = await tryInvoke(fn);
          if (!res.error && (!res.data || res.data.success !== false)) {
            usedFunction = fn;
            resultData = res.data;
            lastError = undefined;
            break;
          }
          lastError = res.error || new Error(res.data?.error || 'Unknown fallback error');
        }
      }

      // Log to sms_logs table
      const currentUser = await supabase.auth.getUser();
      const smsLogStatus = lastError ? 'error' : 'success';
      const specialistObj = specialists.find(s => s.id === selectedSpecialist);
      const { error: logErr } = await supabase.from('sms_logs').insert({
        phone: phoneNumber,
        message,
        status: smsLogStatus,
        used_function: usedFunction,
        error: lastError?.message || null,
        response: resultData || null,
        triggered_by: currentUser.data.user?.id || null,
        source: 'sms_management',
        specialist_id: specialistObj?.id || null,
        specialist_name: specialistObj?.name || null,
      });
      if (logErr) console.warn('[SmsManagement] sms_logs insert error:', logErr);

      if (lastError) {
        throw lastError;
      }

      setSmsStatus({
        type: 'success',
        message: `SMS başarıyla gönderildi! (${usedFunction})`
      });
      toast({
        title: "Başarılı",
        description: `SMS başarıyla gönderildi. (${usedFunction})`,
      });
      // Reset form and refresh
      setMessage('');
      setPhoneNumber('');
      setSelectedSpecialist('');
      
      fetchSpecialists();
      fetchRecentSms();
    } catch (error: any) {
      console.error('SMS sending error:', error);
      setSmsStatus({
        type: 'error',
        message: error.message || 'SMS gönderilirken bir hata oluştu.'
      });
      toast({
        title: "Hata",
        description: error.message || "SMS gönderilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-blue-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <MessageCircle className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yükleniyor...</h2>
          <p className="text-gray-600">SMS yönetim paneli hazırlanıyor</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center border border-red-100/50">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Verimor SMS Hizmeti - Doktorum Ol</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/50 to-purple-50/30">
        <HorizontalNavigation />
        <AdminTopBar userRole={userProfile?.role} />
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          <AdminBackButton />
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-violet-800 to-purple-800 bg-clip-text text-transparent">
                  Verimor SMS Hizmeti
                </h1>
                <p className="text-slate-600 mt-1">
                  Uzmanlar için SMS gönderim yönetim sistemi
                </p>
              </div>
            </div>
            
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Sistem Durumu</p>
                      <p className="text-green-800 font-bold">Aktif</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Aktif Uzmanlar</p>
                        <p className="text-blue-800 font-bold">{specialists.length}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={fetchSpecialists}
                      className="text-blue-600 hover:text-blue-800"
                      title="Uzman listesini yenile"
                    >
                      🔄
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Gönderim Numarası</p>
                      <p className="text-purple-800 font-bold">0 216 706 06 11</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SMS Gönderim Formu */}
            <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-xl">
              <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Manuel SMS Gönderimi
                </CardTitle>
                <CardDescription className="text-violet-100">
                  Uzmanlar için manuel SMS gönderebilirsiniz
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Uzman Seçimi */}
                <div className="space-y-2">
                  <Label htmlFor="specialist" className="text-sm font-medium text-slate-700">
                    Uzman Seçiniz
                  </Label>
                   <Select value={selectedSpecialist} onValueChange={handleSpecialistChange}>
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Uzman seçiniz..." />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="manual">Manuel numara girişi</SelectItem>
                        {specialists.map((specialist) => (
                          <SelectItem key={specialist.id} value={specialist.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{specialist.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {specialist.specialty}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                </div>

                {/* Manuel Telefon Girişi */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Telefon Numarası
                  </Label>
                   <Input
                     id="phone"
                     type="tel"
                     placeholder={selectedSpecialist && selectedSpecialist !== '' && selectedSpecialist !== 'manual' ? "Uzman telefonu otomatik seçildi" : "0 532 123 45 67"}
                     value={phoneNumber}
                     onChange={(e) => setPhoneNumber(e.target.value)}
                     disabled={selectedSpecialist && selectedSpecialist !== '' && selectedSpecialist !== 'manual'}
                     className="w-full"
                   />
                   <p className="text-xs text-slate-500">
                     {selectedSpecialist && selectedSpecialist !== '' && selectedSpecialist !== 'manual'
                       ? "Uzman seçildiğinde telefon numarası otomatik doldurulur. Manuel giriş için 'Manuel numara girişi' seçiniz."
                       : "Manuel olarak telefon numarası girebilir veya uzman seçerek otomatik doldurabilirsiniz"
                     }
                   </p>
                </div>

                {/* Mesaj İçeriği */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-slate-700">
                    Mesaj İçeriği
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="SMS mesajınızı buraya yazınız..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Maksimum 500 karakter</span>
                    <span>{message.length}/500</span>
                  </div>
                </div>

                {/* SMS Durumu */}
                {smsStatus.type && (
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    smsStatus.type === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {smsStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      smsStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {smsStatus.message}
                    </span>
                  </div>
                )}

                {/* Gönder Butonu */}
                <Button
                  onClick={sendSms}
                  disabled={isLoading || !phoneNumber || !message}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold py-3 h-auto"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gönderiliyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      SMS Gönder
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Hazır Şablonlar */}
            <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Hazır SMS Şablonları
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Hızlı kullanım için hazır mesaj şablonları
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {templates.map((template, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                         onClick={() => handleTemplateSelect(template.message)}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700">
                          {template.title}
                        </h4>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Kullan
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {template.message}
                      </p>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Önemli Bilgi</h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        SMS'ler otomatik olarak randevu alındığında da gönderilmektedir. 
                        Bu panel manuel gönderimler için kullanılır.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Son Gönderilen SMS'ler */}
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-xl mt-8">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Son Gönderilen SMS'ler
              </CardTitle>
              <CardDescription className="text-emerald-100">
                En son gönderilen 10 SMS kaydı
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {recentSms.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz SMS gönderimi kaydı bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSms.map((sms) => (
                    <div key={sms.id} className={`p-4 border rounded-lg ${
                      sms.status === 'success' 
                        ? 'border-green-200 bg-green-50/50' 
                        : 'border-red-200 bg-red-50/50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {sms.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-semibold text-slate-800">
                            {sms.phone}
                          </span>
                          {sms.specialist_name && (
                            <Badge variant="secondary" className="text-xs">
                              {sms.specialist_name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(sms.created_at).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 line-clamp-2">{sms.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {sms.used_function && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {sms.used_function}
                          </span>
                        )}
                        {sms.source && (
                          <span>Kaynak: {sms.source}</span>
                        )}
                        {sms.client_name && (
                          <span>Danışan: {sms.client_name}</span>
                        )}
                        {sms.error && (
                          <span className="text-red-600">Hata: {sms.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default SmsManagement;