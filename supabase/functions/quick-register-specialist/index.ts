import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SPECIALTIES = [
  "Acil Tıp","Aile Danışmanı","Aile Hekimliği","Aile ve İlişki Danışmanı","Aile ve Sosyal Yaşam Danışmanlığı",
  "Akupunktur","Alerji Hastalıkları","Alerji ve Göğüs Hastalıkları","Algoloji (Fiziksel Tıp ve Rehabilitasyon)",
  "Algoloji (Noroloji)","Androloji","Anestezi ve Reanimasyon","Asistan Diş Hekimi","Baş ve Boyun Cerrahisi",
  "Beyin ve Sinir Cerrahisi","Bilişsel Davranışçı Terapi","Çift Terapisi","Cildiye","Cinsel Terapi",
  "Çocuk Sağlığı ve Hastalıkları","Çocuk ve Ergen Psikiyatristi","Dil ve Konuşma Terapisti","Diyetisyen",
  "Eğitim Danışmanlığı","Göz Hastalıkları","İlişki Danışmanı","Kadın Doğum","Klinik Psikolog","Psikolog","Psikolojik Danışmanlık"
];

const CITIES = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir",
  "Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır",
  "Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay",
  "Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli",
  "Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu",
  "Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa",
  "Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın",
  "Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"
];

interface ParsedData {
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: string;
  specialty: string;
  city: string;
  education: string | null;
  university: string | null;
  experience: number | null;
  address: string | null;
  certifications: string | null;
  online_consultation: boolean;
  face_to_face_consultation: boolean;
  bio: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

async function parseWithAI(rawText: string): Promise<ParsedData> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const systemPrompt = `Sen bir uzman kayıt asistanısın. Kullanıcının yapıştırdığı serbest formatlı metinden uzman bilgilerini çıkar ve yapılandırılmış JSON döndür. 

Kurallar:
- "name": Ad Soyad
- "email": E-posta
- "password": Şifre
- "phone": Telefon (yoksa null)
- "role": "specialist" | "staff" | "admin" | "legal" | "muhasebe" (varsayılan "specialist")
- "specialty": Uzmanlık. Şu listeden tam eşleşen birini seç: ${SPECIALTIES.join(", ")}. Eğer metinde yazan tam eşleşmiyorsa en yakın olanı seç.
- "city": Şehir. Şu listeden tam eşleşen: ${CITIES.join(", ")}.
- "education": Eğitim/Tıp Fakültesi vb. (yoksa null)
- "university": Üniversite (yoksa null)
- "experience": Deneyim yılı sayı olarak (yoksa null)
- "address": Adres (yoksa null)
- "certifications": Sertifikalar (yoksa null)
- "online_consultation": Danışmanlık türü içinde "online" geçiyorsa true
- "face_to_face_consultation": Danışmanlık türü içinde "yüz yüze" geçiyorsa true
- Eğer hiçbiri yazmamışsa ikisini de true yap. Eğer sadece biri yazmışsa diğeri false olsun.
- "bio": Kişinin bilgilerine göre 200-300 kelime profesyonel "Hakkımda" biyografisi. Üçüncü şahıs ağzından, samimi ve güven veren tonda. Sadece metin, başlık yok.
- "seo_title": "{Ad Soyad} - Randevu Al | Doktorum Ol" formatında, max 65 karakter.
- "seo_description": Google sonuçlarında görünecek 140-145 karakter arası SEO açıklaması.
- "seo_keywords": "Ad Soyad, Uzmanlık, şehir adı, online randevu, Doktorum Ol" formatında min 5 anahtar kelime virgülle ayrılmış.

SADECE tool çağrısı ile yanıt ver, başka metin ekleme.`;

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_specialist",
              description: "Extract structured specialist data",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  phone: { type: ["string", "null"] },
                  role: { type: "string" },
                  specialty: { type: "string" },
                  city: { type: "string" },
                  education: { type: ["string", "null"] },
                  university: { type: ["string", "null"] },
                  experience: { type: ["number", "null"] },
                  address: { type: ["string", "null"] },
                  certifications: { type: ["string", "null"] },
                  online_consultation: { type: "boolean" },
                  face_to_face_consultation: { type: "boolean" },
                  bio: { type: "string" },
                  seo_title: { type: "string" },
                  seo_description: { type: "string" },
                  seo_keywords: { type: "string" },
                },
                required: [
                  "name","email","password","role","specialty","city",
                  "online_consultation","face_to_face_consultation",
                  "bio","seo_title","seo_description","seo_keywords"
                ],
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "extract_specialist" },
        },
      }),
    },
  );

  if (!response.ok) {
    const txt = await response.text();
    if (response.status === 429) throw new Error("AI rate limit aşıldı, biraz bekleyin");
    if (response.status === 402) throw new Error("AI kredisi yetersiz");
    throw new Error(`AI gateway error ${response.status}: ${txt}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI yanıtında tool call bulunamadı");

  const args = JSON.parse(toolCall.function.arguments);
  return args as ParsedData;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { rawText, profile_picture, mode } = body;

    if (!rawText || typeof rawText !== "string") {
      return new Response(
        JSON.stringify({ error: "rawText gerekli" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. AI parse
    const parsed = await parseWithAI(rawText);

    // mode === "preview" ise sadece parse edip dön
    if (mode === "preview") {
      return new Response(
        JSON.stringify({ parsed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // mode === "create" → kullanıcı + uzman oluştur
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 2. Auth kullanıcısı oluştur
    let userId: string | null = null;
    let userCreated = false;

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: parsed.email,
        password: parsed.password,
        email_confirm: true,
        user_metadata: { name: parsed.name, role: parsed.role },
      });

    if (createErr) {
      // Eğer kullanıcı zaten varsa, mevcut kullanıcıyı email ile bul
      const msg = (createErr.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const existing = list?.users?.find(
          (u: any) => u.email?.toLowerCase() === parsed.email.toLowerCase(),
        );
        if (existing) {
          userId = existing.id;
        } else {
          return new Response(
            JSON.stringify({ error: "E-posta kayıtlı ama kullanıcı bulunamadı: " + createErr.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Kullanıcı oluşturulamadı: " + createErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      userId = created.user?.id ?? null;
      userCreated = true;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id alınamadı" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. user_profiles upsert
    const { error: profileErr } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          role: parsed.role as any,
          is_approved: true,
        },
        { onConflict: "user_id" },
      );

    if (profileErr) {
      console.error("user_profiles upsert error:", profileErr);
    }

    // 4. specialists kaydı oluştur
    // Çalışma saatleri: 10:00 - 19:00, tüm günler
    const ALL_DAYS = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];

    // Default FAQ
    const faq = JSON.stringify([
      {
        question: `${parsed.name} ile nasıl iletişime geçerim?`,
        answer: `${parsed.name} ile iletişime geçmek için 0 216 706 06 11 numarası üzerinden ulaşabilirsiniz.`,
      },
      {
        question: `${parsed.name} için nasıl randevu alabilirim?`,
        answer: `${parsed.name} ile online veya telefonla randevu alabilirsiniz.`,
      },
      {
        question: `${parsed.name} hangi branş üzerinden danışmanlık veriyor?`,
        answer: `${parsed.name}, ${parsed.specialty} olarak danışmanlık vermektedir.`,
      },
    ]);

    const { data: specialist, error: specErr } = await supabaseAdmin
      .from("specialists")
      .insert({
        user_id: userId,
        name: parsed.name,
        specialty: parsed.specialty,
        city: parsed.city,
        phone: parsed.phone,
        email: parsed.email,
        bio: parsed.bio,
        education: parsed.education,
        university: parsed.university,
        experience: parsed.experience,
        address: parsed.address,
        certifications: parsed.certifications,
        working_hours_start: "10:00",
        working_hours_end: "19:00",
        available_days: ALL_DAYS,
        profile_picture: profile_picture || null,
        faq,
        online_consultation: parsed.online_consultation,
        face_to_face_consultation: parsed.face_to_face_consultation,
        is_active: true,
        seo_title: parsed.seo_title?.slice(0, 65) || null,
        seo_description: parsed.seo_description?.slice(0, 145) || null,
        seo_keywords: parsed.seo_keywords || null,
      })
      .select()
      .single();

    if (specErr) {
      console.error("specialists insert error:", specErr);
      return new Response(
        JSON.stringify({
          error: "Uzman profili oluşturulamadı: " + specErr.message,
          userCreated,
          userId,
          parsed,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Otomatik blog üretimi (background)
    if (specialist?.id) {
      try {
        await supabaseAdmin.functions.invoke("generate-specialist-blog", {
          body: { specialistId: specialist.id, background: true },
        });
      } catch (e) {
        console.warn("blog tetiklenemedi:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        specialistId: specialist?.id,
        parsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("quick-register-specialist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
