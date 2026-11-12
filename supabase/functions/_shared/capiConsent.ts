// Meta CAPI izin kapısı: kişisel verili dönüşüm olayı yalnızca sunucu tarafında
// doğrulanabilir reklam ölçümü izni varken gönderilir. Tarayıcıdan gelen
// consent=true gibi değiştirilebilir alanlar kanıt sayılmaz; tek kaynak
// user_consent_logs içindeki source='record_consent' (sunucu kimlik doğrulamalı)
// 'advertising' kayıtlarıdır. Eski mobil uyumluluğu için açık bırakılan doğrudan
// INSERT kayıtları (ör. mobile_signup) reklam izni kanıtı sayılmaz.
// İzin kanıtı yoksa olay "held" sayılır: kuyrukta bekletilir, Meta'ya gönderilmez,
// ticari işlem (sipariş/ödeme/kayıt) bundan etkilenmez.
export async function hasAdvertisingConsent(admin: any, userId: string | null | undefined): Promise<boolean> {
  if (!userId || !/^[0-9a-f-]{36}$/i.test(String(userId))) return false;
  const { data, error } = await admin
    .from("user_consent_logs")
    .select("accepted")
    .eq("user_id", userId)
    .eq("consent_type", "advertising")
    .eq("source", "record_consent")
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return false; // kanıt okunamazsa gönderim yapılmaz (fail-closed)
  return data?.accepted === true;
}

export const HELD_REASON = "held_no_verified_advertising_consent";
