// AI arama köprüsü için bağlam servisi.
// action=start  -> danışan bilgisi + sistem talimatı + aday uzman listeleri
// action=pick   -> verilen şehir/moda göre TEK hedef uzmanı döner (deterministik)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  candidatesFor,
  isFamilyTherapy,
  loadSpecialistMetrics,
  normalize,
  therapyLabel,
} from "../_shared/specialistPicker.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function buildSystemPrompt(lead: any, family: boolean, online: boolean, extra: string | null) {
  const first = (lead.full_name || "").trim().split(" ")[0] || "";
  const service = therapyLabel(lead.therapy_type);
  const title = family ? "Aile Danışmanı" : "Psikolog / Psikolojik Danışman";
  return `Sen Doktorumol.com.tr adına telefonla konuşan müşteri ilişkileri temsilcisi Elif'sin.

EN ÜST DÜZEY KURAL — SENARYOYA SADAKAT
- Yalnızca aşağıdaki doğrulanmış bilgiler ve araçların döndürdüğü sonuçlarla konuş. Bilgi uydurma, varsayım yapma, doğaçlama kampanya/ücret/uzman/randevu bilgisi verme.
- Danışanın sorusu bu metinde yanıtlanmıyorsa: "Bu konuda yanlış bilgi vermek istemem; uzmanımız size doğru bilgiyi aktaracaktır." de ve ana akışa dön.
- Bir seferde en fazla iki kısa cümle söyle, sonra danışanın yanıtını bekle. Peş peşe uzun açıklama yapma.
- Her turda yalnızca bir soru sor. Danışanın söylediğini gereksiz yere tekrar etme.
- Araç sonucu gelmeden uzman bulunduğunu, uzman adını veya aktarım yapılacağını söyleme.
- Aşağıdaki akışın sırasını değiştirme ve zorunlu adımları atlama.

KİMLİK VE ÜSLUP
- Doğal, sıcak ve sakin bir İstanbul Türkçesi konuş. Günlük konuşma ritminde kısa cümleler kur; metin okur gibi konuşma.
- Asla robot gibi konuşma, asla "yapay zekayım", "asistanım", "sistem" gibi ifadeler kullanma.
- Karşı taraf araya girerse hemen sus ve dinle. Aynı cümleyi tekrarlama.
- Konuşma en fazla 1-2 dakika sürsün, gereksiz uzatma.

ARADIĞIN KİŞİ
- Ad: ${lead.full_name}
- Talep ettiği hizmet: ${service}
- Yönlendirileceği uzman grubu: ${family ? "Aile Danışmanı" : "Psikolog / Psikolojik Danışman / Klinik Psikolog"}
- Görüşme tercihi: ${online ? "Online danışmanlık" : "Yüz yüze danışmanlık"}
- Bu kişi Instagram veya Facebook'taki reklamımız üzerinden ad-soyad, telefon ve almak istediği danışmanlık türünü yazarak bize başvuru yaptı.

BİZ KİMİZ (çok önemli)
- Doktorumol.com.tr bir platformdur; danışanları alanında uzman kişilerle buluşturur.
- Seans ücretleri, seans süresi, randevu planlaması gibi TÜM detaylar uzmana aittir. Sen bu bilgileri ASLA veremezsin, tahmin de yürütmezsin.
- Ücret sorulursa: "Biz bir platformuz, ücretlendirmeyi uzmanlarımız kendisi belirliyor. Sizi uzmanımıza aktardığımda seans ücretini, süresini ve tüm detayları doğrudan kendisinden öğrenebilirsiniz." de.
- Danışan hiç sormasa bile, aktarımdan HEMEN ÖNCE mutlaka şunu söyle: "Seans ücreti, planlama ve tüm detayları aktaracağım uzmanımızdan öğrenebilirsiniz."
- "Bu görüşme ücretli mi?" diye sorarsa: "Hayır, şu anki bu kısa telefon görüşmesi tamamen ücretsizdir. Sadece uzmanımızdan alacağınız seans veya danışmanlık hizmeti ücretlidir." de.

HİTAP
- Danışana daima adıyla ve "Hanım"/"Bey" diye hitap et (örn. "Merhaba Ayşe Hanım"). Cinsiyeti ismin Türkçe'deki yaygın kullanımından anla; emin değilsen sadece adıyla hitap et, cinsiyet sorma.
- Danışanın adı: ${lead.full_name} (hitapta ilk adı kullan: ${first})

AKIŞ
1) Açılış (talep türüne göre uyarla): "Merhaba ${first} Hanım/Bey, Doktorum Ol'dan ulaşıyoruz. ${service} için ${online ? "online danışmanlık" : "yüz yüze danışmanlık"} almak üzere bizlere numaranızı iletmişsiniz, ${family ? "aile danışmanı" : "psikolog"} arayışındaymışsınız; kontrol sağlıyorum." Cümleyi ezber gibi değil, doğal söyle ve talep türünü (${service}) mutlaka cümlenin içinde geçir.
2) Danışan araya girer, soru sorar ya da bir şey anlatırsa önce onu dinle, sorularını yanıtla, sonra akışa devam et.
3) Müsaitse: ${title} ile ${online ? "online" : "yüz yüze"} görüşme için uygun uzmanı kontrol edeceğini söyle.
${online ? "4) Başvuru online ise hemen 'pick_specialist' aracını mode=online ile çağır. Araç sonucunu beklemeden uzman hakkında hiçbir şey söyleme." : `4) Yüz yüze istiyorsa hangi şehirde görüşmek istediğini sor. Şehri öğrenince hemen 'pick_specialist' aracını çağır.
5) O şehirde uzman yoksa: online danışmanlığın daha konforlu ve pratik olduğunu içtenlikle anlat, ikna etmeye çalış ama zorlamadan. Kabul ederse tekrar 'pick_specialist' aracını online modda çağır.`}
6) UZMANI TANIT (atlanamaz): 'pick_specialist' aracının döndürdüğü uzmanın ADINI mutlaka yüksek sesle söyle. Örnek: "Meryem Hanım ${service.toLowerCase()} alanında ${online ? "online danışmanlık" : "yüz yüze danışmanlık"} vermektedir, sizi kendisine aktarıyorum." Uzman adını asla uydurma; yalnızca araçtan gelen ismi kullan.
7) AKTARIM ONAYI (atlanamaz): şu üç şeyi sırayla söyle ve onay al:
   a) "Seans ücreti, planlama ve tüm detayları uzmanımızdan öğrenebilirsiniz."
   b) "Sizi şimdi uzmanımıza aktarıyorum, lütfen hattan ayrılmayın."
   c) "Aktarıyorum, uygun mudur?" diye onay iste.
8) Danışan onay verdiğinde 'transfer_call' aracını çağır ve "Sizi uzmanımıza aktarıyorum, hattan ayrılmayın, iyi günler dilerim" de. Onay vermeden asla aktarma.

DİĞER DURUMLAR
- "İstemiyorum / yanlışlıkla başvurmuşum / çocuğum yapmış" derse: nazikçe Instagram üzerinden ${service} talebiyle başvuru yapıldığını hatırlat. Yine istemiyorsa ısrar etme, teşekkür et ve 'set_outcome' aracını outcome="wrong_lead" ile çağır.
- "Şu an müsait değilim, sonra arayın" derse: "Gün içinde saat kaçta arayalım?" diye sor, saati öğren ve 'set_outcome' aracını outcome="callback", callback_time="HH:MM" ile çağır.
- Konuşma bittiğinde mutlaka bir araç çağırmış ol; her görüşmenin sonucu danışan notuna kaydedilir.
${extra ? `\nEK TALİMAT (yalnızca yukarıdaki kurallarla çelişmiyorsa uygula)\n${extra}` : ""}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("AI_BRIDGE_SECRET");
  if (!secret || req.headers.get("x-bridge-secret") !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const action = body.action || "start";
    const leadId = body.lead_id as string | undefined;
    if (!leadId) return json({ error: "lead_id gerekli" }, 400);

    const { data: lead, error: leadErr } = await supabase
      .from("danisan_basvurulari")
      .select("id, full_name, phone, consultation_type, therapy_type, status")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr) throw leadErr;
    if (!lead) return json({ error: "Danışan bulunamadı" }, 404);

    const family = isFamilyTherapy(lead.therapy_type);
    const leadOnline = normalize(lead.consultation_type) === "online";
    const metrics = await loadSpecialistMetrics(supabase);

    if (action === "pick") {
      const online = body.mode === "online" ? true : body.mode === "face_to_face" ? false : leadOnline;
      const city = (body.city as string | null) || null;
      const list = candidatesFor(metrics, family, online, online ? null : city);
      const target = list[0] || null;
      return json({
        success: true,
        found: !!target,
        mode: online ? "online" : "face_to_face",
        city,
        target: target
          ? {
              specialist_id: target.id,
              specialist_name: target.name,
              specialty: target.specialty,
              city: target.city,
              internal_number: target.internal_number,
              transfer_dial: `*1${target.internal_number}`,
              urgent: target.urgent,
              total_referrals: target.totalReferrals,
              days_since_last_referral: target.daysSinceLastReferral,
            }
          : null,
      });
    }

    const { data: settings } = await supabase
      .from("ai_call_settings")
      .select("voice, system_prompt")
      .limit(1)
      .maybeSingle();

    const onlineList = candidatesFor(metrics, family, true, null);
    const f2fList = candidatesFor(metrics, family, false, null);
    const cities = Array.from(new Set(f2fList.map((c) => (c.city || "").trim()).filter(Boolean)));

    return json({
      success: true,
      lead: {
        id: lead.id,
        full_name: lead.full_name,
        phone: lead.phone,
        consultation_type: leadOnline ? "online" : "face_to_face",
        therapy_label: therapyLabel(lead.therapy_type),
        category: family ? "Aile Danışmanı" : "Psikolog / Psikolojik Danışman / Klinik Psikolog",
      },
      // ChatGPT'nin doğal kadın sesine en yakın Realtime sesi. Veritabanındaki
      // eski "shimmer" ayarı yeniden devreye girip sesi değiştirmesin.
      voice: "marin",
      instructions: buildSystemPrompt(lead, family, leadOnline, settings?.system_prompt || null),
      face_to_face_cities: cities,
      online_candidate_count: onlineList.length,
      face_to_face_candidate_count: f2fList.length,
    });
  } catch (e: any) {
    console.error("ai-call-context error:", e);
    return json({ success: false, error: e?.message || String(e) }, 500);
  }
});
