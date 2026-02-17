import { useState, useEffect, useMemo } from "react";
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
import { Clock, LogIn, LogOut, Users, Calendar, ChevronLeft, ChevronRight, User } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) return;
    fetchRecords();
  }, [userProfile, selectedMonth]);

  const fetchRecords = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myToday } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('work_date', today)
      .maybeSingle();
    setTodayRecord(myToday);

    const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

    let query = supabase
      .from('staff_attendance')
      .select('*')
      .gte('work_date', monthStart)
      .lte('work_date', monthEnd)
      .order('work_date', { ascending: true })
      .order('check_in', { ascending: true });

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
      const { error } = await supabase.from('staff_attendance').insert({
        user_id: user.id,
        staff_name: staffName,
        check_in: now.toISOString(),
        work_date: format(now, 'yyyy-MM-dd'),
      });
      if (error) {
        if (error.code === '23505') toast.error('Bugün zaten giriş yapmışsınız');
        else throw error;
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

  const formatTime = (dateStr: string) => format(new Date(dateStr), 'HH:mm');

  const calcDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return '—';
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}s ${mins}dk`;
  };

  const calcTotalMinutes = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 0;
    return (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000;
  };

  // Group by staff
  const staffGroups = useMemo(() => {
    const map = new Map<string, { name: string; userId: string; records: AttendanceRecord[] }>();
    records.forEach(r => {
      if (!map.has(r.user_id)) {
        map.set(r.user_id, { name: r.staff_name, userId: r.user_id, records: [] });
      }
      map.get(r.user_id)!.records.push(r);
    });
    return Array.from(map.values());
  }, [records]);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) });
  }, [selectedMonth]);

  const prevMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  if (loading) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  if (!userProfile || !['admin', 'staff'].includes(userProfile.role)) {
    return <div className="min-h-screen flex items-center justify-center">Erişim reddedildi</div>;
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Çalışma Saatleri - Divan Paneli</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <HorizontalNavigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                  <Button onClick={handleCheckIn} disabled={loadingAction} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg">
                    <LogIn className="w-5 h-5 mr-2" />
                    Giriş Onayla ({format(currentTime, 'HH:mm')})
                  </Button>
                </div>
              ) : !todayRecord.check_out ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <Badge className="bg-emerald-100 text-emerald-700 text-sm px-4 py-1">Giriş: {formatTime(todayRecord.check_in)}</Badge>
                    <Badge variant="outline" className="text-sm px-4 py-1">Çalışıyor...</Badge>
                  </div>
                  <Button onClick={handleCheckOut} disabled={loadingAction} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg">
                    <LogOut className="w-5 h-5 mr-2" />
                    Çıkış Onayla ({format(currentTime, 'HH:mm')})
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Badge className="bg-emerald-100 text-emerald-700 text-sm px-4 py-1">Giriş: {formatTime(todayRecord.check_in)}</Badge>
                    <Badge className="bg-red-100 text-red-700 text-sm px-4 py-1">Çıkış: {formatTime(todayRecord.check_out)}</Badge>
                    <Badge className="bg-blue-100 text-blue-700 text-sm px-4 py-1">Süre: {calcDuration(todayRecord.check_in, todayRecord.check_out)}</Badge>
                  </div>
                  <p className="text-slate-500 text-sm">Bugünkü mesainiz tamamlandı ✅</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <h2 className="text-xl font-bold text-slate-800">
              {format(selectedMonth, 'MMMM yyyy', { locale: tr })}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>

          {/* Staff Tabs */}
          {staffGroups.length === 0 ? (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardContent className="py-12">
                <p className="text-center text-slate-500">Bu ay için kayıt bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={staffGroups[0]?.userId} className="w-full">
              <TabsList className="w-full flex-wrap h-auto gap-1 bg-white/60 p-2 rounded-xl mb-4">
                {staffGroups.map(staff => (
                  <TabsTrigger key={staff.userId} value={staff.userId} className="flex items-center gap-1.5 text-sm">
                    <User className="w-3.5 h-3.5" />
                    {staff.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {staffGroups.map(staff => {
                const recordsByDate = new Map<string, AttendanceRecord>();
                staff.records.forEach(r => recordsByDate.set(r.work_date, r));

                const totalMins = staff.records.reduce((sum, r) => sum + calcTotalMinutes(r.check_in, r.check_out), 0);
                const totalHours = Math.floor(totalMins / 60);
                const totalRemMins = Math.floor(totalMins % 60);
                const workDays = staff.records.filter(r => r.check_out).length;

                return (
                  <TabsContent key={staff.userId} value={staff.userId}>
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between flex-wrap gap-3">
                          <span className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            {staff.name} — Aylık Özet
                          </span>
                          <div className="flex gap-3 flex-wrap">
                            <Badge className="bg-indigo-100 text-indigo-700 text-sm px-3 py-1">
                              {workDays} gün çalışıldı
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">
                              Toplam: {totalHours}s {totalRemMins}dk
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[180px]">Tarih</TableHead>
                                <TableHead>Gün</TableHead>
                                <TableHead>Giriş</TableHead>
                                <TableHead>Çıkış</TableHead>
                                <TableHead>Süre</TableHead>
                                <TableHead>Durum</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {daysInMonth.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const record = recordsByDate.get(dateStr);
                                const dayOfWeek = getDay(day);
                                const isWeekend = dayOfWeek === 0; // Only Sunday is weekend
                                const isFuture = day > new Date();
                                const isTodayDate = isToday(day);

                                // Hide dates before Feb 17, 2026 and future dates
                                const cutoffDate = new Date(2026, 1, 17); // Feb 17, 2026
                                if (day < cutoffDate) return null;
                                if (isFuture && !isTodayDate) return null;

                                return (
                                  <TableRow key={dateStr} className={isTodayDate ? 'bg-indigo-50/50' : isWeekend ? 'bg-slate-50/50 text-slate-400' : ''}>
                                    <TableCell className="font-medium text-sm">
                                      {format(day, 'dd MMMM', { locale: tr })}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {format(day, 'EEEE', { locale: tr })}
                                    </TableCell>
                                    <TableCell>
                                      {record ? (
                                        <span className="text-emerald-600 font-mono font-medium">{formatTime(record.check_in)}</span>
                                      ) : isWeekend ? '—' : <span className="text-slate-300">—</span>}
                                    </TableCell>
                                    <TableCell>
                                      {record?.check_out ? (
                                        <span className="text-red-600 font-mono font-medium">{formatTime(record.check_out)}</span>
                                      ) : record ? <span className="text-amber-500 text-xs">Devam</span> : isWeekend ? '—' : <span className="text-slate-300">—</span>}
                                    </TableCell>
                                    <TableCell>
                                      {record?.check_out ? (
                                        <span className="text-blue-600 font-medium text-sm">{calcDuration(record.check_in, record.check_out)}</span>
                                      ) : '—'}
                                    </TableCell>
                                    <TableCell>
                                      {record?.check_out ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Tamamlandı</Badge>
                                      ) : record ? (
                                        <Badge className="bg-amber-100 text-amber-700 text-xs">Devam ediyor</Badge>
                                      ) : isWeekend ? (
                                        <Badge variant="outline" className="text-xs text-slate-400">Hafta sonu</Badge>
                                      ) : isTodayDate ? (
                                        <Badge variant="outline" className="text-xs text-slate-400">Giriş yok</Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs text-red-400 border-red-200">Gelmedi</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default StaffAttendance;
