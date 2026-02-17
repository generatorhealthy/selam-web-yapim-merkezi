import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { HorizontalNavigation } from "@/components/HorizontalNavigation";
import Footer from "@/components/Footer";
import AdminBackButton from "@/components/AdminBackButton";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  user_id: string;
  staff_name: string;
  check_in: string;
  check_out: string | null;
  work_date: string;
}

const StaffAttendance = () => {
  const { userProfile, loading } = useUserRole();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingAction, setLoadingAction] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const isStaff = userProfile?.role === 'staff';

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch records
  useEffect(() => {
    if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) return;
    fetchRecords();
  }, [userProfile]);

  const fetchRecords = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Get today's record for current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myToday } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('work_date', today)
      .maybeSingle();
    
    setTodayRecord(myToday);

    // Admin sees all, staff sees own
    let query = supabase
      .from('staff_attendance')
      .select('*')
      .order('work_date', { ascending: false })
      .order('check_in', { ascending: false })
      .limit(50);

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query;
    setRecords(data || []);
  };

  const handleCheckIn = async () => {
    setLoadingAction(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      const now = new Date();
      const staffName = userProfile?.name || userProfile?.email || 'Bilinmiyor';

      const { error } = await supabase
        .from('staff_attendance')
        .insert({
          user_id: user.id,
          staff_name: staffName,
          check_in: now.toISOString(),
          work_date: format(now, 'yyyy-MM-dd'),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Bugün zaten giriş yapmışsınız');
        } else {
          throw error;
        }
      } else {
        toast.success(`Giriş saati: ${format(now, 'HH:mm:ss')}`);
        fetchRecords();
      }
    } catch (err: any) {
      toast.error(err.message || 'Giriş yapılamadı');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setLoadingAction(true);
    try {
      const now = new Date();
      const { error } = await supabase
        .from('staff_attendance')
        .update({ check_out: now.toISOString() })
        .eq('id', todayRecord.id);

      if (error) throw error;
      toast.success(`Çıkış saati: ${format(now, 'HH:mm:ss')}`);
      fetchRecords();
    } catch (err: any) {
      toast.error(err.message || 'Çıkış yapılamadı');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm:ss');
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMMM yyyy, EEEE', { locale: tr });
  };

  const calcDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return '—';
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}s ${mins}dk`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) {
    return <div className="min-h-screen flex items-center justify-center">Erişim reddedildi</div>;
  }

  // Group records by date
  const grouped = records.reduce<Record<string, AttendanceRecord[]>>((acc, r) => {
    (acc[r.work_date] = acc[r.work_date] || []).push(r);
    return acc;
  }, {});

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Çalışma Saatleri - Divan Paneli</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <AdminBackButton />

          {/* Live Clock */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl px-8 py-4 border border-white/30">
              <Clock className="w-8 h-8 text-indigo-600" />
              <span className="text-4xl font-mono font-bold text-slate-800">
                {format(currentTime, 'HH:mm:ss')}
              </span>
            </div>
            <p className="text-slate-600 mt-2">{format(currentTime, 'dd MMMM yyyy, EEEE', { locale: tr })}</p>
            <p className="text-sm text-slate-500 mt-1">Ofis Saatleri: 10:00 - 18:00</p>
          </div>

          {/* Check In / Check Out */}
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Bugünkü Durumunuz
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!todayRecord ? (
                <div className="text-center space-y-4">
                  <p className="text-slate-600">Henüz bugün giriş yapmadınız.</p>
                  <Button
                    onClick={handleCheckIn}
                    disabled={loadingAction}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Giriş Onayla ({format(currentTime, 'HH:mm')})
                  </Button>
                </div>
              ) : !todayRecord.check_out ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <Badge className="bg-emerald-100 text-emerald-700 text-sm px-4 py-1">
                      Giriş: {formatTime(todayRecord.check_in)}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-4 py-1">
                      Çalışıyor...
                    </Badge>
                  </div>
                  <Button
                    onClick={handleCheckOut}
                    disabled={loadingAction}
                    className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Çıkış Onayla ({format(currentTime, 'HH:mm')})
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Badge className="bg-emerald-100 text-emerald-700 text-sm px-4 py-1">
                      Giriş: {formatTime(todayRecord.check_in)}
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 text-sm px-4 py-1">
                      Çıkış: {formatTime(todayRecord.check_out)}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 text-sm px-4 py-1">
                      Süre: {calcDuration(todayRecord.check_in, todayRecord.check_out)}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-sm">Bugünkü mesainiz tamamlandı ✅</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Records History */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                {isAdmin ? 'Tüm Personel Kayıtları' : 'Geçmiş Kayıtlarınız'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(grouped).length === 0 ? (
                <p className="text-center text-slate-500 py-8">Henüz kayıt bulunmuyor.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([date, dateRecords]) => (
                    <div key={date}>
                      <h3 className="font-semibold text-slate-700 mb-3 text-sm">
                        📅 {formatDate(date)}
                      </h3>
                      <div className="space-y-2">
                        {dateRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-700">{record.staff_name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap justify-end">
                              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                                Giriş: {formatTime(record.check_in)}
                              </Badge>
                              {record.check_out ? (
                                <>
                                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                    Çıkış: {formatTime(record.check_out)}
                                  </Badge>
                                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                    {calcDuration(record.check_in, record.check_out)}
                                  </Badge>
                                </>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                  Devam ediyor
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
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

export default StaffAttendance;
