// Uzmanın cebine yönlendirme listesi: önce 80 (FCT0505), açılmazsa 81 (FCT0606) hattı.
// Kullanıcı talimatı: tüm uzmanlarda "80XXXXXXXXXX#" ve "81XXXXXXXXXX#" iki satırı.
export function followMeDigits(raw: string): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length < 10) return null;
  return d.slice(-10);
}

export function buildFollowMeList(raw: string): string {
  const d = followMeDigits(raw);
  return d ? `80${d}#-81${d}#` : "";
}
