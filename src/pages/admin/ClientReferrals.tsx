import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { UserCheck, Calendar, Users, Plus, Minus, Search, Hash, Edit3, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMonthName } from "@/utils/monthUtils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  city: string;
  phone?: string;
  email?: string;
  internal_number?: string;
  online_consultation?: boolean;
  face_to_face_consultation?: boolean;
  payment_day?: number;
}

interface MonthlyReferral {
  month: number;
  count: number;
  notes: string;
}

interface SpecialistReferral {
  id: string;
  specialist: Specialist;
  referrals: MonthlyReferral[];
}

interface ClientReferralDetail {
  id: string;
  client_name: string;
  client_surname: string;
  client_contact: string;
  referred_at: string;
  referral_count: number;
  is_referred: boolean;
  sms_sent?: boolean;
}

// --- SMS phone resolution helpers (prefer orders/contracts phone) ---
const CENTRAL_NUMBERS = new Set<string>([
  '02167060611',
  '2167060611',
  '902167060611',
  '0216 706 06 11',
  '0 216 706 06 11',
  '216 706 06 11',
  '0216-706-06-11'
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

const resolveSpecialistSmsPhone = async (spec: { name?: string; phone?: string; email?: string }) => {
  try {
    const nameRaw = spec.name || '';
    const email = spec.email || '';

    const normalizeName = (s: string) =>
      s
        .toLowerCase()
        .replace(/\b(uzm\.?|psk\.?|dan\.?|dr\.?|psikolog|danışman)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    const name = normalizeName(nameRaw);

    // 1) Try direct orders lookup (admin/staff have RLS access)
    if (email || name) {
      let q = supabase
        .from('orders')
        .select('customer_phone, customer_email, customer_name, status, approved_at, created_at')
        .in('status', ['approved', 'completed'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (email) {
        q = q.ilike('customer_email', email);
      } else if (name) {
        q = q.ilike('customer_name', `%${name}%`);
      }

      const { data: ordersData, error: ordersError } = await q;
      if (!ordersError && Array.isArray(ordersData) && ordersData.length) {
        const phoneCandidate = ordersData.find((o) => o.customer_phone)?.customer_phone as string | undefined;
        if (phoneCandidate && !isCentralNumber(phoneCandidate)) {
          return normalizePhoneForSms(phoneCandidate);
        }
      }
    }

    // 2) Fallback to edge function using service role for broader matching
    const { data, error } = await supabase.functions.invoke('get-specialist-contracts', {
      body: { name: nameRaw, email: email || null },
    });

    if (!error && Array.isArray(data) && data.length) {
      const sorted = [...data].sort(
        (a: any, b: any) => new Date(b.approved_at || b.created_at || 0).getTime() - new Date(a.approved_at || a.created_at || 0).getTime()
      );
      const order = sorted.find((o: any) => ['approved', 'completed'].includes(o.status)) || sorted[0];
      const phoneCandidate = order?.customer_phone || order?.phone;
      if (phoneCandidate && !isCentralNumber(phoneCandidate)) {
        return normalizePhoneForSms(phoneCandidate);
      }
    }
  } catch (e) {
    console.warn('⚠️ [SMS-DEBUG] Contract/Orders phone lookup failed', e);
  }

  // 3) Fallback to specialist table phone
  if (spec.phone && !isCentralNumber(spec.phone)) {
    return normalizePhoneForSms(spec.phone);
  }
  return '';
};

const ClientReferrals = () => {
  const [specialists, setSpecialists] = useState<SpecialistReferral[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<SpecialistReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientReferralDetails, setClientReferralDetails] = useState<Record<string, ClientReferralDetail[]>>({});
  const { userProfile, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const canAccess = !roleLoading && !!userProfile && userProfile.is_approved && ['admin','staff'].includes(userProfile.role);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    specialistId: string;
    specialistName: string;
    specialistPhone: string;
    month: number;
    newCount: number;
  } | null>(null);
  
  // Client info for confirmation dialog
  const [clientInfo, setClientInfo] = useState({
    client_name: '',
    client_surname: '',
    client_contact: ''
  });

  const requestConfirm = (
    specialistId: string,
    specialistName: string,
    specialistPhone: string,
    month: number,
    newCount: number
  ) => {
    console.log('🔔 [DIALOG] requestConfirm çağrıldı:', { specialistName, specialistPhone, month, newCount });
    setPendingAction({ specialistId, specialistName, specialistPhone, month, newCount });
    setClientInfo({ client_name: '', client_surname: '', client_contact: '' });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    console.log('🔔 [DIALOG] handleConfirm çağrıldı');
    console.log('🔔 [DIALOG] pendingAction:', pendingAction);
    console.log('🔔 [DIALOG] clientInfo:', clientInfo);
    
    if (!pendingAction) {
      console.warn('⚠️ [DIALOG] pendingAction boş!');
      return;
    }
    
    // Validate client info
    if (!clientInfo.client_name.trim() || !clientInfo.client_surname.trim() || !clientInfo.client_contact.trim()) {
      console.warn('⚠️ [DIALOG] Danışan bilgileri eksik!', clientInfo);
      toast({
        title: "Hata",
        description: "Lütfen danışanın ad, soyad ve telefon bilgilerini eksiksiz doldurun.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ [DIALOG] Validation geçti, updateReferralCount çağrılacak...');
    console.log('✅ [DIALOG] clientInfo details:', {
      name: clientInfo.client_name,
      surname: clientInfo.client_surname,
      contact: clientInfo.client_contact
    });
    
    try {
      setIsSaving(true);
      await updateReferralCount(
        pendingAction.specialistId, 
        pendingAction.month, 
        pendingAction.newCount,
        clientInfo,
        pendingAction.specialistName,
        pendingAction.specialistPhone
      );
      
      // Başarılı ekleme sonrası client detaylarını yeniden çek
      console.log('✅ [DIALOG] Danışan eklendi, detaylar yeniden çekiliyor...');
      await fetchClientReferralDetails(pendingAction.specialistId, pendingAction.month);
      
      toast({
        title: "Başarılı",
        description: `${clientInfo.client_name} ${clientInfo.client_surname} başarıyla eklendi.`,
      });
      
      setConfirmOpen(false);
      setPendingAction(null);
      setClientInfo({ client_name: '', client_surname: '', client_contact: '' });
    } catch (error) {
      console.error('❌ [DIALOG] Danışan ekleme hatası:', error);
      toast({
        title: "Hata",
        description: "Danışan eklenirken bir hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto notes dialog state
  const [autoNotesOpen, setAutoNotesOpen] = useState(false);
  const [autoNoteText, setAutoNoteText] = useState("");
  const [isApplyingAuto, setIsApplyingAuto] = useState(false);

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const fetchSpecialistsAndReferrals = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching specialists and referrals for year:", currentYear);
      
      // Tüm aktif uzmanları getir
      const { data: specialistsData, error: specialistsError } = await supabase
        .from('specialists')
        .select('id, name, specialty, city, phone, email, internal_number, online_consultation, face_to_face_consultation, payment_day')
        .eq('is_active', true)
        .order('name');

      // Yönlendirmeleri sayfalama ile getir (Supabase max 1000 satır döndürür)
      let allReferrals: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('client_referrals')
          .select('*')
          .eq('year', currentYear)
          .range(from, to);
        
        if (pageError) {
          console.error(`❌ Referrals page ${page} fetch error:`, pageError);
          break;
        }
        
        if (pageData && pageData.length > 0) {
          allReferrals = [...allReferrals, ...pageData];
          hasMore = pageData.length === pageSize;
          page++;
          console.log(`📊 [FETCH] Page ${page}: ${pageData.length} records, total: ${allReferrals.length}`);
        } else {
          hasMore = false;
        }
      }
      
      const referralsError = null;
      
      // DEBUG: Spesifik uzman için kayıtları kontrol et
      const testSpecId = 'e67a51fa-7db6-4932-9b55-6c695949d635';
      const testSpecRecords = allReferrals?.filter((r: any) => r.specialist_id === testSpecId) || [];
      const testSpecDecRecords = testSpecRecords.filter((r: any) => Number(r.month) === 12);
      console.log('📊 [FETCH] All referrals result:', {
        totalCount: allReferrals?.length || 0,
        testSpecAllRecords: testSpecRecords.length,
        testSpecDecemberRecords: testSpecDecRecords.length,
        testSpecDecemberReferred: testSpecDecRecords.filter((r: any) => r.is_referred === true).length,
        sampleDecember: testSpecDecRecords.slice(0, 3)
      });

      if (specialistsError) {
        console.error('❌ Specialists fetch error:', specialistsError);
        throw specialistsError;
      }

      if (referralsError) {
        console.error('❌ Referrals fetch error:', referralsError);
        // Referral hatası olsa bile devam et
      }

      console.log("✅ Specialists fetched:", specialistsData?.length || 0);
      console.log("✅ Referrals fetched:", allReferrals?.length || 0);
      
      // Debug: internal_number değerlerini logla
      specialistsData?.forEach(specialist => {
        console.log(`🔍 Specialist ${specialist.name}: internal_number = "${specialist.internal_number}"`);
      });

      if (!specialistsData || specialistsData.length === 0) {
        console.log("⚠️ No specialists found");
        setSpecialists([]);
        setFilteredSpecialists([]);
        return;
      }

      // Referral verilerini specialist_id'ye göre grupla (daha hızlı)
      const referralsBySpecialist = new Map();
      console.log('📊 [DEBUG] Raw referrals count:', allReferrals?.length || 0);
      
      allReferrals?.forEach(referral => {
        if (!referralsBySpecialist.has(referral.specialist_id)) {
          referralsBySpecialist.set(referral.specialist_id, []);
        }
        referralsBySpecialist.get(referral.specialist_id).push(referral);
      });
      
      console.log('📊 [DEBUG] Unique specialists with referrals:', referralsBySpecialist.size);
      
      // Debug: Nermin İbiş için kontrol et
      const testSpecialistId = 'e67a51fa-7db6-4932-9b55-6c695949d635';
      const testData = referralsBySpecialist.get(testSpecialistId);
      console.log('📊 [DEBUG] Test specialist referrals:', {
        id: testSpecialistId,
        found: !!testData,
        count: testData?.length || 0,
        data: testData?.slice(0, 3) // İlk 3 kaydı göster
      });

      // Her uzman için 12 aylık veriyi oluştur (batch processing)
      const specialistReferrals: SpecialistReferral[] = specialistsData.map(specialist => {
        const specialistReferrals = referralsBySpecialist.get(specialist.id) || [];
        
          const monthlyReferrals: MonthlyReferral[] = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const matches = (specialistReferrals as any[]).filter((r: any) => Number(r.month) === month);

            // is_referred = true olan kayıtların SAYISINI hesapla (her danışan için bir kayıt)
            // Boolean kontrolünü gevşet - string/boolean farklılıkları için
            const totalCount = matches.filter((record: any) => 
              record.is_referred === true || record.is_referred === 'true'
            ).length;
            
            // En son dolu notu al (önce notu olan kayıtları tercih et, sonra en yeni)
            const recordsWithNotes = matches.filter((r: any) => r.notes && r.notes.trim() !== '');
            const sortedRecords = (recordsWithNotes.length > 0 ? recordsWithNotes : matches)
              .sort((a: any, b: any) => 
                new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
              );
            const latestNote = sortedRecords[0]?.notes || '';

            return {
              month,
              count: totalCount,
              notes: latestNote,
            };
          });

        return {
          id: specialist.id,
          specialist,
          referrals: monthlyReferrals
        };
      });

      console.log("✅ Specialist referrals processed:", specialistReferrals.length);
      setSpecialists(specialistReferrals);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      console.log("Auth ready. Fetching for year:", currentYear, "role:", userProfile?.role);
      fetchSpecialistsAndReferrals();
      
      // Ekim 2025 notlarını Kasım ve Aralık 2025'e otomatik kopyala
      if (currentYear === 2025) {
        copyOctoberNotesToNovDec2025();
      }
    } else {
      console.log("Waiting for auth to fetch referrals...");
    }
  }, [currentYear, canAccess]);

  // Sayfa odağa geldiğinde verileri yenile (yalnızca yetki varsa)
  useEffect(() => {
    const handleFocus = () => {
      if (canAccess) {
        fetchSpecialistsAndReferrals();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentYear, canAccess]);

  // Filter specialists based on search term and sort by referral count
  // Fetch client referral details for a specific specialist and month
  const fetchClientReferralDetails = async (specialistId: string, month: number) => {
    try {
      console.log('🔍 [CLIENT-DETAILS] Fetching for specialist:', specialistId, 'month:', month, 'year:', currentYear);
      
      const { data, error } = await supabase
        .from('client_referrals')
        .select('id, client_name, client_surname, client_contact, referred_at, referral_count, is_referred')
        .eq('specialist_id', specialistId)
        .eq('year', currentYear)
        .eq('month', month)
        .eq('is_referred', true)
        .not('client_name', 'is', null)
        .order('referred_at', { ascending: false });

      console.log('✅ [CLIENT-DETAILS] Query result:', { 
        specialist: specialistId, 
        month, 
        dataCount: data?.length || 0, 
        error: error?.message 
      });

      if (error) {
        console.error('❌ [CLIENT-DETAILS] Error:', error);
        throw error;
      }

      const key = `${specialistId}-${month}`;
      console.log('📝 [CLIENT-DETAILS] Setting data for key:', key, 'count:', data?.length || 0);
      
      setClientReferralDetails(prev => ({
        ...prev,
        [key]: data || []
      }));
    } catch (error) {
      console.error('❌ [CLIENT-DETAILS] Exception:', error);
    }
  };

  useEffect(() => {
    const filtered =
      searchTerm.trim() !== ""
        ? specialists.filter((specialistReferral) =>
            specialistReferral.specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialistReferral.specialist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
            specialistReferral.specialist.city.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : specialists;

    // Sort by referral count for selected month (0 count first) - do NOT mutate original array
    const sorted = [...filtered].sort((a, b) => {
      const aReferral = a.referrals.find((ref) => ref.month === selectedMonth);
      const bReferral = b.referrals.find((ref) => ref.month === selectedMonth);
      const aCount = aReferral?.count || 0;
      const bCount = bReferral?.count || 0;

      // 0 count items first, then ascending order
      if (aCount === 0 && bCount !== 0) return -1;
      if (aCount !== 0 && bCount === 0) return 1;
      return aCount - bCount;
    });

    setFilteredSpecialists(sorted);
    
    // Fetch client details for all filtered specialists for all months with count > 0
    sorted.forEach(spec => {
      spec.referrals.forEach(ref => {
        if (ref.count > 0) {
          fetchClientReferralDetails(spec.id, ref.month);
        }
      });
    });
  }, [specialists, searchTerm, selectedMonth, currentYear]);

  const updateReferralCount = async (
    specialistId: string, 
    month: number, 
    newCount: number,
    clientData?: { client_name: string; client_surname: string; client_contact: string },
    specialistName?: string,
    specialistPhone?: string
  ) => {
    if (newCount < 0) return;

    try {
      const specialist = specialists.find((s) => s.id === specialistId);
      const specName = specialistName || specialist?.specialist.name || 'Unknown';
      
      // Resolve phone preferring orders (contracts), fallback to specialists.phone
      console.log('🔍 [RESOLVE] Starting phone resolution for:', specName);
      const resolvedPhone = await resolveSpecialistSmsPhone((specialist?.specialist as any) || {});
      console.log('🔍 [RESOLVE] resolveSpecialistSmsPhone returned:', resolvedPhone);
      const paramPhone = specialistPhone && !isCentralNumber(specialistPhone)
        ? normalizePhoneForSms(specialistPhone)
        : '';
      console.log('🔍 [RESOLVE] paramPhone:', paramPhone);
      const phoneToUse = paramPhone || resolvedPhone;
      console.log('🔍 [RESOLVE] FINAL phoneToUse:', phoneToUse);
      console.log('🔍 [SMS-DEBUG] Specialist Info:', {
        specialistId,
        specialistName: specName,
        phoneFromTable: specialist?.specialist.phone,
        phoneFromParams: specialistPhone,
        paramPhone,
        resolvedPhone,
        phoneToUse,
        hasClientData: !!clientData
      });
      console.log(`🔄 [UPDATE] ${specName} (${specialistId}) year=${currentYear} month=${month} -> ${newCount}`);

      // Danışan bilgisi varsa yeni kayıt ekle
      if (clientData) {
        // Mevcut notları al
        const { data: existingNotes } = await supabase
          .from('client_referrals')
          .select('notes')
          .eq('specialist_id', specialistId)
          .eq('year', currentYear)
          .eq('month', month)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        console.log('📝 [INSERT] Danışan bilgisi ile yeni kayıt ekleniyor...', {
          specialist_id: specialistId,
          year: currentYear,
          month,
          client_name: clientData.client_name,
          client_surname: clientData.client_surname,
          client_contact: clientData.client_contact
        });
        
        // Yeni danışan kaydı ekle (notları koru)
        const { data: insertResult, error: insertError } = await supabase
          .from('client_referrals')
          .insert({
            specialist_id: specialistId,
            year: currentYear,
            month,
            referral_count: 1,
            client_name: clientData.client_name,
            client_surname: clientData.client_surname,
            client_contact: clientData.client_contact,
            is_referred: true,
            referred_at: new Date().toISOString(),
            referred_by: (await supabase.auth.getUser()).data.user?.id || null,
            notes: existingNotes?.notes || '', // Mevcut notları koru
          })
          .select('id, referral_count, updated_at');

        if (insertError) {
          console.error('❌ [INSERT] Danışan bilgisi ekleme hatası:', insertError);
          throw insertError;
        }
        console.log('✅ [INSERT] Danışan bilgisi başarıyla eklendi:', insertResult);
      } else {
        // Sayı azaltma - en son kaydı sil
        const { data: existingRecords, error: fetchError } = await supabase
          .from('client_referrals')
          .select('id')
          .eq('specialist_id', specialistId)
          .eq('year', currentYear)
          .eq('month', month)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingRecords && existingRecords.length > 0) {
          const { error: deleteError } = await supabase
            .from('client_referrals')
            .delete()
            .eq('id', existingRecords[0].id);

          if (deleteError) throw deleteError;
          console.log('✅ [UPDATE] Client referral deleted');
        }
      }
      
      // Send SMS to specialist with client info if phone and client data provided
      console.log('📱 [SMS] Checking SMS requirements:', {
        hasPhone: !!phoneToUse,
        hasClientData: !!clientData,
        newCount,
        specialistName: specName,
        phoneNumber: phoneToUse
      });

      if (phoneToUse && clientData && newCount > 0) {
        console.log('✅ [SMS] Koşullar sağlandı - SMS gönderiliyor...');
        try {
          console.log('📱 [SMS] Preparing to send SMS with details:', {
            specialist: specName,
            phone: phoneToUse,
            clientName: `${clientData.client_name} ${clientData.client_surname}`,
            clientContact: clientData.client_contact
          });
          
          const message = `${specName} merhaba,\n\nTarafınıza bir danışan yönlendirmesi yapılmıştır.\n\nDanışan Bilgileri:\nAd Soyad: ${clientData.client_name} ${clientData.client_surname}\nİletişim: ${clientData.client_contact}\n\nDanışanla iletişime geçerek gerekli bilgilendirmeyi sağlayabilirsiniz.\n\nDoktorumol.com.tr`;
          
          console.log('📱 [SMS] Message content:', message);
          console.log('📱 [SMS] Calling edge function send-sms-via-static-proxy...');
          
          // Primary attempt via static proxy (preferred)
          let usedFunction = 'send-sms-via-static-proxy';
          let lastError: any | undefined = undefined;
          let resultData: any | undefined = undefined;
          
          const tryInvoke = async (fnName: string) => {
            const { data, error } = await supabase.functions.invoke(fnName, {
              body: { phone: phoneToUse, message }
            });
            console.log(`📱 [SMS] ${fnName} response:`, { data, error });
            return { data, error };
          };

          const primary = await tryInvoke('send-sms-via-static-proxy');
          resultData = primary.data; lastError = primary.error;
          
          // Fallback to alternative function(s) if primary failed or returned unsuccessful
          if (lastError || (resultData && resultData.success === false)) {
            console.warn('⚠️ [SMS] Primary failed. Trying fallbacks...');
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
          
          // Log SMS result to database
          const currentUser = await supabase.auth.getUser();
          const smsLogStatus = lastError ? 'error' : 'success';
          await supabase.from('sms_logs').insert({
            phone: phoneToUse,
            message,
            status: smsLogStatus,
            used_function: usedFunction,
            error: lastError?.message || null,
            response: resultData || null,
            triggered_by: currentUser.data.user?.id || null,
            source: 'client_referrals',
            specialist_id: specialistId,
            specialist_name: specName,
            client_name: `${clientData.client_name} ${clientData.client_surname}`,
            client_contact: clientData.client_contact
          });
          
          if (lastError) {
            console.error('❌ [SMS] Gönderim hatası:', lastError);
            toast({
              title: "Uyarı",
              description: `Yönlendirme kaydedildi ancak SMS gönderilemedi. Hata: ${lastError.message || 'Bilinmeyen hata'}`,
              variant: "default",
            });
          } else {
            console.log(`✅ [SMS] Başarıyla gönderildi (${usedFunction}). Telefon:`, phoneToUse, 'Yanıt:', resultData);
            toast({
              title: "Başarılı",
              description: `Yönlendirme kaydedildi ve ${phoneToUse} numarasına SMS gönderildi. (${usedFunction})`,
            });
          }
        } catch (smsEx) {
          console.error('❌ [SMS] Exception:', smsEx);
          toast({
            title: "Uyarı",
            description: `SMS gönderilirken hata oluştu: ${(smsEx as Error).message}`,
            variant: "default",
          });
        }
      } else {
        console.warn('⚠️ [SMS] SMS gönderimi ATLANACAK. Nedenler:', {
          phoneToUse_exists: !!phoneToUse,
          phoneToUse_value: phoneToUse,
          clientData_exists: !!clientData,
          newCount_positive: newCount > 0,
          newCount_value: newCount
        });
        if (!phoneToUse) {
          toast({
            title: "Uyarı",
            description: "Yönlendirme kaydedildi ancak uzman için geçerli bir telefon numarası bulunamadı. Orders tablosunda onaylı siparişi var mı kontrol edin.",
            variant: "default",
          });
        }
      }
      // Optimistic local update for immediate UI feedback
      setSpecialists((prev) =>
        prev.map((spec) =>
          spec.id === specialistId
            ? {
                ...spec,
                referrals: spec.referrals.map((ref) =>
                  ref.month === month ? { ...ref, count: newCount } : ref
                ),
              }
            : spec
        )
      );

      // Danışan detaylarını yenile
      await fetchClientReferralDetails(specialistId, month);
      await fetchSpecialistsAndReferrals();

      toast({
        title: 'Başarılı',
        description: `${specialistName} - ${monthNames[month - 1]} ayı yönlendirme sayısı güncellendi`,
      });
    } catch (error) {
      console.error('❌ [UPDATE] Error:', error);
      toast({
        title: 'Hata',
        description: 'Yönlendirme sayısı güncellenirken hata oluştu: ' + (error as Error).message,
        variant: 'destructive',
      });
    }
  };
  
  const updateNotes = async (specialistId: string, month: number, notes: string) => {
    console.log(`🔄 [NOTES] Start update for specialist ${specialistId}, month ${month}`);

    try {
      // Tüm ilgili kayıtları getir
      const { data: existingRecords, error: fetchError } = await supabase
        .from('client_referrals')
        .select('*')
        .eq('specialist_id', specialistId)
        .eq('year', currentYear)
        .eq('month', month)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ [NOTES] Fetch error:', fetchError);
        throw fetchError;
      }

      console.log(`📊 [NOTES] Found ${existingRecords?.length || 0} records`);

      if (!existingRecords || existingRecords.length === 0) {
        // Hiç kayıt yoksa yeni kayıt oluştur (NOT kaydı - is_referred: false)
        const { error: insertError } = await supabase
          .from('client_referrals')
          .insert({
            specialist_id: specialistId,
            year: currentYear,
            month,
            notes,
            referral_count: 0,
            is_referred: false, // Not kaydı, danışan değil
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ [NOTES] Insert error:', insertError);
          throw insertError;
        }
        console.log('✅ [NOTES] New record created with notes');
      } else {
        // Tüm kayıtların notlarını güncelle
        const updates = existingRecords.map(record => 
          supabase
            .from('client_referrals')
            .update({ 
              notes,
              updated_at: new Date().toISOString() 
            })
            .eq('id', record.id)
        );

        const results = await Promise.all(updates);
        const errors = results.filter(r => r.error);
        
        if (errors.length > 0) {
          console.error('❌ [NOTES] Update errors:', errors);
          throw errors[0].error;
        }
        
        console.log(`✅ [NOTES] Updated ${existingRecords.length} records`);
      }

      // Local state'i güncelle
      setSpecialists((prev) =>
        prev.map((spec) =>
          spec.id === specialistId
            ? {
                ...spec,
                referrals: spec.referrals.map((ref) => (ref.month === month ? { ...ref, notes } : ref)),
              }
            : spec
        )
      );

      await fetchSpecialistsAndReferrals();

      toast({ title: 'Başarılı', description: 'Not güncellendi' });
    } catch (error) {
      console.error('❌ Error updating notes:', error);
      toast({
        title: 'Hata',
        description: 'Not güncellenirken hata oluştu: ' + (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // Ekim 2025 notlarını Kasım ve Aralık 2025'e otomatik kopyala
  const copyOctoberNotesToNovDec2025 = async () => {
    try {
      // Ekim 2025 notlarını al
      const { data: octoberNotes, error: fetchError } = await supabase
        .from('client_referrals')
        .select('specialist_id, notes')
        .eq('year', 2025)
        .eq('month', 10)
        .not('notes', 'is', null)
        .neq('notes', '');
      
      if (fetchError) {
        console.error('❌ Error fetching October notes:', fetchError);
        return;
      }
      
      if (!octoberNotes || octoberNotes.length === 0) {
        return; // Sessizce çık, Ekim notları henüz yok
      }
      
      // Kasım ve Aralık 2025 için kopyala
      for (const record of octoberNotes) {
        for (const month of [11, 12]) { // Kasım ve Aralık
          // Mevcut kaydı kontrol et
          const { data: existing } = await supabase
            .from('client_referrals')
            .select('id, notes')
            .eq('specialist_id', record.specialist_id)
            .eq('year', 2025)
            .eq('month', month)
            .maybeSingle();
          
          if (existing && existing.id) {
            // Mevcut kayıt varsa ve notu boşsa güncelle
            if (!existing.notes || existing.notes.trim() === '') {
              await supabase
                .from('client_referrals')
                .update({
                  notes: record.notes,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            }
          } else {
            // Yeni kayıt oluştur (NOT kaydı - is_referred: false)
            await supabase
              .from('client_referrals')
              .insert({
                specialist_id: record.specialist_id,
                year: 2025,
                month,
                notes: record.notes,
                referral_count: 0,
                is_referred: false, // Not kopyası, danışan değil
                updated_at: new Date().toISOString(),
              });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error copying notes:', error);
    }
  };

  const updateCity = async (specialistId: string, newCity: string) => {
    try {
      console.log(`Updating city for specialist ${specialistId}, new city: ${newCity}`);
      
      const { error } = await supabase
        .from('specialists')
        .update({ city: newCity })
        .eq('id', specialistId);

      if (error) throw error;

      // Local state'i güncelle
      setSpecialists(prev => 
        prev.map(spec => 
          spec.id === specialistId 
            ? {
                ...spec,
                specialist: { ...spec.specialist, city: newCity }
              }
            : spec
        )
      );

      toast({
        title: "Başarılı",
        description: "Şehir bilgisi güncellendi",
      });
      
    } catch (error) {
      console.error('Error updating city:', error);
      toast({
        title: "Hata",
        description: "Şehir güncellenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const updateInternalNumber = async (specialistId: string, newInternalNumber: string) => {
    try {
      console.log(`🔄 Starting internal number update for specialist ${specialistId}, new number: "${newInternalNumber}"`);
      
      // Test permission first
      const { data: readTest, error: readError } = await supabase
        .from('specialists')
        .select('id, internal_number, updated_at')
        .eq('id', specialistId)
        .single();
        
      if (readError) {
        console.error('❌ Cannot read specialist:', readError);
        throw new Error('Uzmanı okuma yetkisi yok: ' + readError.message);
      }
      
      console.log('✅ Current data before update:', readTest);
      
      const { data, error } = await supabase
        .from('specialists')
        .update({ 
          internal_number: newInternalNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialistId)
        .select();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      console.log(`✅ Database update successful:`, data);

      // Verify the update by fetching the specific record
      const { data: verification, error: verifyError } = await supabase
        .from('specialists')
        .select('internal_number, updated_at')
        .eq('id', specialistId)
        .single();

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
      } else {
        console.log(`✅ Verification: Database shows internal_number as "${verification.internal_number}"`);
        console.log(`📊 Updated_at comparison - Before: ${readTest.updated_at}, After: ${verification.updated_at}`);
      }

      // Force complete data refresh without page reload
      console.log('🔄 Refreshing all data from database...');
      await fetchSpecialistsAndReferrals();
      
      toast({
        title: "Başarılı",
        description: "Dahili numara başarıyla kaydedildi.",
      });
      
    } catch (error) {
      console.error('❌ Error updating internal number:', error);
      toast({
        title: "Hata",
        description: "Dahili numara güncellenirken hata oluştu: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const getTotalReferrals = () => {
    return filteredSpecialists.reduce((total, spec) => 
      total + spec.referrals.reduce((specTotal, ref) => specTotal + ref.count, 0), 0
    );
  };

  const getMonthlyTotal = (month: number) => {
    return filteredSpecialists.reduce((total, spec) => {
      const monthReferral = spec.referrals.find(ref => ref.month === month);
      return total + (monthReferral?.count || 0);
    }, 0);
  };

  const getSelectedMonthReferrals = (specialistReferral: SpecialistReferral) => {
    return specialistReferral.referrals.find(ref => ref.month === selectedMonth) || {
      month: selectedMonth,
      count: 0,
      notes: ''
    };
  };

  // Copy August notes to other months (bulk upsert for reliability and speed)
  // Ağustos notlarını kopyalama özelliği kaldırıldı (istek doğrultusunda). Mevcut notlar korunur.

  // Color generator for internal numbers
  const getInternalNumberColor = (internalNumber?: string) => {
    if (!internalNumber) return "bg-gray-100 text-gray-600";
    
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-purple-100 text-purple-700", 
      "bg-green-100 text-green-700",
      "bg-orange-100 text-orange-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
      "bg-teal-100 text-teal-700",
      "bg-yellow-100 text-yellow-700"
    ];
    
    const hash = internalNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Generate consultation type badges
  const getConsultationBadges = (specialist: Specialist) => {
    const badges = [];
    
    if (specialist.face_to_face_consultation) {
      badges.push(
        <Badge key="face-to-face" className="bg-emerald-100 text-emerald-700 border-0 font-medium px-3 py-1 text-xs">
          Yüz Yüze
        </Badge>
      );
    }
    
    if (specialist.online_consultation) {
      badges.push(
        <Badge key="online" className="bg-blue-100 text-blue-700 border-0 font-medium px-3 py-1 text-xs">
          Online
        </Badge>
      );
    }
    
    return badges;
  };

  // Access control - only admin and staff can access
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center font-medium">Yetki kontrolü yapılıyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || !userProfile.is_approved || !['admin', 'staff'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 max-w-md text-center">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Erişim Reddedildi</h2>
          <p className="text-slate-600 mb-4">
            Bu sayfaya sadece admin ve staff üyeleri erişebilir.
          </p>
          <Button 
            onClick={() => window.history.back()} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center font-medium">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <HorizontalNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <AdminBackButton />
        
        {/* Header Section with Enhanced Design */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                    Danışan Yönlendirme
                  </h1>
                  <p className="text-slate-600 text-lg">Uzmanların aylık danışan yönlendirme durumlarını takip edin</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <select 
                    value={currentYear} 
                    onChange={(e) => {
                      const newYear = Number(e.target.value);
                      console.log(`🔄 Year changed from ${currentYear} to ${newYear}`);
                      setCurrentYear(newYear);
                    }}
                    className="px-6 py-3 bg-white z-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Toplam Uzman</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{specialists.length}</div>
              <p className="text-xs text-blue-600 mt-1">Aktif uzman sayısı</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Toplam Yönlendirme</CardTitle>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{getTotalReferrals()}</div>
              <p className="text-xs text-emerald-600 mt-1">Yıllık toplam</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Seçili Ay ({monthNames[selectedMonth - 1]})</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {getMonthlyTotal(selectedMonth)}
              </div>
              <p className="text-xs text-purple-600 mt-1">Bu ay toplam</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Ortalama/Ay</CardTitle>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {specialists.length > 0 ? Math.round(getTotalReferrals() / 12) : 0}
              </div>
              <p className="text-xs text-orange-600 mt-1">Aylık ortalama</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Monthly Tracking Section */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              {currentYear} Yılı - Aylık Danışan Yönlendirme Takibi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(Number(value))}>
              <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 mb-8 bg-slate-100/50 p-1 rounded-xl">
                {monthNames.map((month, index) => (
                  <TabsTrigger 
                    key={index + 1} 
                    value={(index + 1).toString()} 
                    className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-200"
                  >
                    {month.substring(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {monthNames.map((_, monthIndex) => {
                const currentMonth = monthIndex + 1;
                
                // Takvim için günleri hesapla (1-31)
                const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                
                // Her gün için ödeme günü olan ve 0 yönlendirme sayısı olan uzmanları bul
                const getSpecialistsForDay = (day: number) => {
                  return specialists.filter(spec => {
                    const monthReferral = spec.referrals.find(ref => ref.month === currentMonth);
                    const referralCount = monthReferral?.count || 0;
                    return spec.specialist.payment_day === day && referralCount === 0;
                  });
                };
                
                return (
                  <TabsContent key={monthIndex + 1} value={(monthIndex + 1).toString()}>
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (monthIndex === 0) {
                                setCurrentYear(currentYear - 1);
                                setSelectedMonth(12);
                              } else {
                                setSelectedMonth(monthIndex);
                              }
                            }}
                          >
                            ← Önceki Ay
                          </Button>
                          <h3 className="text-2xl font-bold text-gray-800">
                            {monthNames[monthIndex]} {currentYear}
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (monthIndex === 11) {
                                setCurrentYear(currentYear + 1);
                                setSelectedMonth(1);
                              } else {
                                setSelectedMonth(monthIndex + 2);
                              }
                            }}
                          >
                            Sonraki Ay →
                          </Button>
                        </div>
                        <p className="text-gray-600">
                          Bu ay toplam {getMonthlyTotal(monthIndex + 1)} yönlendirme yapıldı
                        </p>
                      </div>

                      {/* Günlük Yönlendirme Dökümü */}
                      {(() => {
                        // Tüm uzmanların bu aydaki danışan detaylarını birleştir
                        const dailyCounts: Record<number, number> = {};
                        Object.entries(clientReferralDetails).forEach(([key, details]) => {
                          if (!key.endsWith(`-${currentMonth}`)) return;
                          (details || []).forEach((d: any) => {
                            if (!d.referred_at) return;
                            const dt = new Date(d.referred_at);
                            if (dt.getFullYear() !== currentYear || dt.getMonth() + 1 !== currentMonth) return;
                            const day = dt.getDate();
                            dailyCounts[day] = (dailyCounts[day] || 0) + 1;
                          });
                        });
                        const totalDaily = Object.values(dailyCounts).reduce((a, b) => a + b, 0);

                        return (
                          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50/60 to-indigo-50/40">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  Günlük Yönlendirme Dökümü
                                </CardTitle>
                                <Badge variant="secondary" className="bg-white/80">
                                  {totalDaily} kayıtlı gün verisi
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-16 gap-2">
                                {calendarDays.map((day) => {
                                  const count = dailyCounts[day] || 0;
                                  const isToday =
                                    new Date().getFullYear() === currentYear &&
                                    new Date().getMonth() + 1 === currentMonth &&
                                    new Date().getDate() === day;
                                  return (
                                    <div
                                      key={day}
                                      className={`relative flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all ${
                                        count > 0
                                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                          : 'bg-white/70 text-slate-500 border-slate-200'
                                      } ${isToday ? 'ring-2 ring-orange-400' : ''}`}
                                      title={`${day} ${monthNames[monthIndex]}: ${count} yönlendirme`}
                                    >
                                      <span className="text-[10px] opacity-80 leading-none">{day}</span>
                                      <span className={`text-base font-bold leading-tight ${count > 0 ? 'text-white' : 'text-slate-400'}`}>
                                        {count}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              {totalDaily === 0 && (
                                <p className="text-xs text-slate-500 mt-3 text-center">
                                  Bu ay için tarihli danışan kaydı bulunmuyor.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })()}
                      
                    {/* Enhanced Search Section */}
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-100/50 to-blue-100/30 rounded-2xl"></div>
                      <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                              placeholder="Uzman adı, uzmanlık alanı veya şehir ile ara..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-12 py-3 bg-white/80 border-white/50 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                            />
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-white/50">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">
                              {filteredSpecialists.length} / {specialists.length} uzman
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {filteredSpecialists.map((specialistReferral) => {
                      const monthlyReferral = getSelectedMonthReferrals(specialistReferral);
                      
                      return (
                        <div key={specialistReferral.id} className="relative group">
                          {/* Background gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          
                          <div className="relative bg-white/90 backdrop-blur-sm border border-white/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-blue-200/50">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                              {/* Specialist Info Section */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <h4 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-200">
                                        {specialistReferral.specialist.name}
                                      </h4>
                                      {specialistReferral.specialist.internal_number && (
                                        <Badge 
                                          className={`${getInternalNumberColor(specialistReferral.specialist.internal_number)} border-0 font-medium px-3 py-1 text-xs`}
                                        >
                                          <Hash className="w-3 h-3 mr-1" />
                                          {specialistReferral.specialist.internal_number}
                                        </Badge>
                                      )}
                                     </div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="font-medium text-slate-600">{specialistReferral.specialist.specialty}</span>
                                        <div className="flex gap-2">
                                          {getConsultationBadges(specialistReferral.specialist)}
                                        </div>
                                      </div>
                                      {specialistReferral.specialist.payment_day && (
                                        <div className="text-sm text-slate-500 mb-2">
                                          <span className="font-medium">Ödeme Günü:</span> Her ayın {specialistReferral.specialist.payment_day}'ı
                                        </div>
                                      )}
                                      
                                         {/* Editable Fields */}
                                       <div className="flex gap-3">
                                         <div className="flex-1">
                                           <Label className="text-xs text-slate-500 mb-1 block">Şehir</Label>
                                           <Input
                                             placeholder="Şehir girin..."
                                             value={specialistReferral.specialist.city}
                                             onChange={(e) => {
                                               setSpecialists(prev => 
                                                 prev.map(spec => 
                                                   spec.id === specialistReferral.id 
                                                     ? {
                                                         ...spec,
                                                         specialist: { ...spec.specialist, city: e.target.value }
                                                       }
                                                     : spec
                                                 )
                                               );
                                             }}
                                             onBlur={(e) => updateCity(
                                               specialistReferral.id, 
                                               e.target.value
                                             )}
                                             className="h-8 text-sm bg-white/80 border-slate-200/50 rounded-lg"
                                           />
                                         </div>
                                          <div className="flex-1">
                                            <Label className="text-xs text-slate-500 mb-1 block">Dahili Numara</Label>
                                            <Input
                                              placeholder="Dahili numara..."
                                              value={specialistReferral.specialist.internal_number || ''}
                                              onChange={(e) => {
                                                const newValue = e.target.value;
                                                console.log(`Internal number changed for ${specialistReferral.specialist.name}: ${newValue}`);
                                                setSpecialists(prev => 
                                                  prev.map(spec => 
                                                    spec.id === specialistReferral.id 
                                                      ? {
                                                          ...spec,
                                                          specialist: { ...spec.specialist, internal_number: newValue }
                                                        }
                                                      : spec
                                                  )
                                                );
                                                setFilteredSpecialists(prev => 
                                                  prev.map(spec => 
                                                    spec.id === specialistReferral.id 
                                                      ? {
                                                          ...spec,
                                                          specialist: { ...spec.specialist, internal_number: newValue }
                                                        }
                                                      : spec
                                                  )
                                                );
                                              }}
                                              onBlur={(e) => {
                                                console.log(`Internal number blur event for ${specialistReferral.specialist.name}: ${e.target.value}`);
                                                updateInternalNumber(specialistReferral.id, e.target.value);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  console.log(`Internal number Enter pressed for ${specialistReferral.specialist.name}: ${e.currentTarget.value}`);
                                                  updateInternalNumber(specialistReferral.id, e.currentTarget.value);
                                                  e.currentTarget.blur();
                                                }
                                              }}
                                              className="h-8 text-sm bg-white/80 border-slate-200/50 rounded-lg"
                                            />
                                          </div>
                                       </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Controls Section */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                                {/* Referral Counter */}
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-2xl"></div>
                                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200/30 shadow-md p-4">
                                    <div className="flex items-center space-x-4">
                                       <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={async (e) => { 
                                          e.preventDefault(); 
                                          e.stopPropagation();
                                          
                                          const newCount = Math.max(0, monthlyReferral.count - 1);
                                          
                                          try {
                                            // Tüm kayıtları getir
                                            const { data: existingRecords, error: fetchError } = await supabase
                                              .from('client_referrals')
                                              .select('id, notes')
                                              .eq('specialist_id', specialistReferral.id)
                                              .eq('year', currentYear)
                                              .eq('month', monthIndex + 1)
                                              .order('created_at', { ascending: false });

                                            if (fetchError) throw fetchError;

                                            if (existingRecords && existingRecords.length > 0) {
                                              // Notları sakla
                                              const savedNotes = existingRecords[0].notes || '';
                                              
                                              // Son kaydı sil (en yeni)
                                              const { error: deleteError } = await supabase
                                                .from('client_referrals')
                                                .delete()
                                                .eq('id', existingRecords[0].id);

                                              if (deleteError) throw deleteError;
                                              
                                              // Eğer not varsa ve hala kayıt varsa, kalan kayıtlardan en yenisine notu kopyala
                                              if (savedNotes && existingRecords.length > 1) {
                                                // Silme işleminden sonra kalan kayıtları tekrar al
                                                const { data: remainingRecords } = await supabase
                                                  .from('client_referrals')
                                                  .select('id')
                                                  .eq('specialist_id', specialistReferral.id)
                                                  .eq('year', currentYear)
                                                  .eq('month', monthIndex + 1)
                                                  .order('created_at', { ascending: false })
                                                  .limit(1);

                                                if (remainingRecords && remainingRecords.length > 0) {
                                                  await supabase
                                                    .from('client_referrals')
                                                    .update({ 
                                                      notes: savedNotes,
                                                      updated_at: new Date().toISOString()
                                                    })
                                                    .eq('id', remainingRecords[0].id);
                                                }
                                              }
                                              
                                              console.log('✅ [DECREASE] Kayıt silindi, notlar korundu');
                                            }

                                            // UI'ı güncelle
                                            setSpecialists((prev) =>
                                              prev.map((spec) =>
                                                spec.id === specialistReferral.id
                                                  ? {
                                                      ...spec,
                                                      referrals: spec.referrals.map((ref) =>
                                                        ref.month === (monthIndex + 1) ? { ...ref, count: newCount } : ref
                                                      ),
                                                    }
                                                  : spec
                                              )
                                            );

                                            // Danışan detaylarını yenile
                                            await fetchClientReferralDetails(specialistReferral.id, monthIndex + 1);
                                            await fetchSpecialistsAndReferrals();

                                            toast({
                                              title: 'Başarılı',
                                              description: 'Yönlendirme sayısı azaltıldı, notlar korundu',
                                            });
                                          } catch (error) {
                                            console.error('❌ [DECREASE] Error:', error);
                                            toast({
                                              title: 'Hata',
                                              description: 'İşlem sırasında hata oluştu: ' + (error as Error).message,
                                              variant: 'destructive',
                                            });
                                          }
                                        }}
                                        disabled={monthlyReferral.count <= 0}
                                        className="h-10 w-10 p-0 rounded-xl border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </Button>
                                      
                                      <div className="text-center min-w-[80px]">
                                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                          {monthlyReferral.count}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium">yönlendirme</div>
                                      </div>
                                      
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); requestConfirm(
                                          specialistReferral.id,
                                          specialistReferral.specialist.name,
                                          specialistReferral.specialist.phone || '',
                                          monthIndex + 1,
                                          (monthlyReferral.count + 1)
                                        ); }}
                                        className="h-10 w-10 p-0 rounded-xl border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all duration-200"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Notes Section */}
                                <div className="flex-1 min-w-[250px]">
                                  <div className="relative">
                                    <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                     <Input
                                        placeholder="Notlar girin..."
                                       value={monthlyReferral.notes}
                                      onChange={(e) => {
                                        setSpecialists(prev => 
                                          prev.map(spec => 
                                            spec.id === specialistReferral.id 
                                              ? {
                                                  ...spec,
                                                  referrals: spec.referrals.map(ref => 
                                                    ref.month === selectedMonth 
                                                      ? { ...ref, notes: e.target.value }
                                                      : ref
                                                  )
                                                }
                                              : spec
                                          )
                                        );
                                      }}
                                      onBlur={(e) => updateNotes(
                                        specialistReferral.id, 
                                        selectedMonth, 
                                        e.target.value
                                      )}
                                      className="pl-10 py-3 bg-white/80 border-slate-200/50 rounded-xl shadow-sm focus:shadow-md focus:border-blue-300 transition-all duration-200"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                            </div>
                            
                            {/* Client Referrals Details Section - Her Uzmanın Altında */}
                            {(() => {
                              const key = `${specialistReferral.id}-${monthlyReferral.month}`;
                              const clientDetails = clientReferralDetails[key] || [];
                              
                              if (monthlyReferral.count > 0) {
                                return (
                                  <div className="mt-6 pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-2 mb-4">
                                      <UserCheck className="w-5 h-5 text-blue-600" />
                                      <h5 className="text-base font-semibold text-slate-800">
                                        Yönlendirilen Danışanlar 
                                        <span className="ml-2 text-sm font-normal text-slate-600">
                                          ({monthlyReferral.count} danışan)
                                        </span>
                                      </h5>
                                    </div>
                                    
                                    {clientDetails.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {clientDetails.map((client) => (
                                          <div 
                                            key={client.id} 
                                            className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                                          >
                                            <div className="space-y-2">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-semibold text-slate-900 text-sm mb-1">
                                                    {client.client_name} {client.client_surname}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-2 py-1">
                                                      📞 {client.client_contact}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-blue-100">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>
                                                  {new Date(client.referred_at).toLocaleDateString('tr-TR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-amber-800">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          <span className="text-sm font-medium">
                                            Danışan bilgileri eksik
                                          </span>
                                        </div>
                                        <p className="text-xs text-amber-700 mt-2">
                                          Bu danışanlar için detaylı bilgi girilmemiş. Lütfen yeni danışan eklerken ad, soyad ve telefon bilgilerini eksiksiz doldurun.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredSpecialists.length === 0 && searchTerm && (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">"{searchTerm}" araması için sonuç bulunamadı.</p>
                        <p className="text-sm mt-2">Farklı bir terim ile tekrar deneyin.</p>
                      </div>
                    )}
                    
                    {specialists.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Henüz uzman bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Yönlendirme sayısını onayla</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction ? `Uzm. ${pendingAction.specialistName} - ${monthNames[pendingAction.month - 1]} için yönlendirme sayısı ${pendingAction.newCount} olarak kaydedilecek.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client_name" className="text-sm font-medium">Danışan Adı *</Label>
              <Input
                id="client_name"
                value={clientInfo.client_name}
                onChange={(e) => setClientInfo(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="Danışanın adı"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_surname" className="text-sm font-medium">Danışan Soyadı *</Label>
              <Input
                id="client_surname"
                value={clientInfo.client_surname}
                onChange={(e) => setClientInfo(prev => ({ ...prev, client_surname: e.target.value }))}
                placeholder="Danışanın soyadı"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_contact" className="text-sm font-medium">Danışan İletişim Bilgisi *</Label>
              <Input
                id="client_contact"
                value={clientInfo.client_contact}
                onChange={(e) => setClientInfo(prev => ({ ...prev, client_contact: e.target.value }))}
                placeholder="05XX XXX XX XX"
                required
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isSaving}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={handleConfirm} disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'Onayla'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
};

export default ClientReferrals;
