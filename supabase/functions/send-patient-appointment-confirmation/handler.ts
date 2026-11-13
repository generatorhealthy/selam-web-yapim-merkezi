import { escapeHtml } from '../_shared/escapeHtml.ts';

export interface ConfirmationAppointment {
  id: string; specialist_id: string; patient_name: string; patient_email: string;
  appointment_date: string; appointment_time: string; status: string;
}
export interface ConfirmationPorts {
  identity(req: Request): Promise<{ id: string } | null>;
  appointment(id: string): Promise<ConfirmationAppointment | null>;
  ownsSpecialist(userId: string, specialistId: string): Promise<boolean>;
  claim(id: string): Promise<boolean>;
  deliver(email: string, name: string, html: string): Promise<boolean>;
  mark(id: string, status: 'sent' | 'unknown'): Promise<void>;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function handleConfirmation(req: Request, ports: ConfirmationPorts, headers: Record<string, string>): Promise<Response> {
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), {status, headers: {...headers, 'Content-Type': 'application/json'}});
  if (req.method === 'OPTIONS') return new Response(null, {headers});
  if (req.method !== 'POST') return reply(405, {error: 'Yöntem desteklenmiyor'});
  try {
    const user = await ports.identity(req);
    if (!user) return reply(401, {error: 'Geçerli oturum gerekli'});
    const body = await req.json();
    if (!body || typeof body.appointmentId !== 'string' || !uuid.test(body.appointmentId) || Object.keys(body).some(k => k !== 'appointmentId')) {
      return reply(400, {error: 'Yalnız kayıtlı randevu kimliği kabul edilir'});
    }
    const appointment = await ports.appointment(body.appointmentId);
    if (!appointment || !(await ports.ownsSpecialist(user.id, appointment.specialist_id))) return reply(403, {error: 'Bu randevu için yetkiniz yok'});
    if (appointment.status === 'cancelled' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appointment.patient_email || '')) return reply(409, {error: 'Randevu bildirime uygun değil'});
    if (!(await ports.claim(appointment.id))) return reply(409, {error: 'Bildirim daha önce işleme alındı'});
    let delivered = false;
    try {
      // Only stored scheduling metadata. No notes, clinical text or specialist contact details.
      const html = `<p>Sayın ${escapeHtml(appointment.patient_name)},</p><p>Randevu kaydınız oluşturulmuştur.</p><p>Tarih: ${escapeHtml(appointment.appointment_date)}<br>Saat: ${escapeHtml(appointment.appointment_time)}</p><p>doktorumol.com.tr</p>`;
      delivered = await ports.deliver(appointment.patient_email, appointment.patient_name, html);
    } catch { /* Unknown delivery must retain the claim. */ }
    try { await ports.mark(appointment.id, delivered ? 'sent' : 'unknown'); } catch { /* Claimed still blocks duplicates. */ }
    return delivered ? reply(200, {success: true}) : reply(502, {error: 'Teslim doğrulanamadı; otomatik tekrar gönderilmeyecek'});
  } catch {
    return reply(500, {error: 'Randevu bildirimi işlenemedi'});
  }
}