// Send WhatsApp welcome message to newly registered specialist via WAHA
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { buildWelcomeMessage, canReceiveWelcome, normalizePhoneToWa } from "./welcome.ts";

const PayloadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  phone: z.string().min(10).max(40),
  userId: z.string().uuid().optional(),
});

interface WhatsappLine {
  id: string;
  phone_number: string | null;
  is_active: boolean;
  sort_order: number | null;
}

function getSessionNameForLineId(lineId: string) {
  return `line_${lineId.replace(/-/g, "").slice(0, 16)}`;
}

async function getWorkingSessionName(supabase: ReturnType<typeof createClient>) {
  const { data: activeLines, error: lineError } = await supabase
    .from("whatsapp_lines")
    .select("id, phone_number, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (lineError) {
    console.error("Failed to fetch active WhatsApp lines:", lineError);
    return { sessionName: null, error: "Aktif WhatsApp hattı okunamadı" };
  }

  const lines = (activeLines || []) as WhatsappLine[];
  if (lines.length === 0) {
    return { sessionName: null, error: "Aktif WhatsApp hattı bulunamadı" };
  }

  const activePhones = new Set(
    lines
      .map((l) => (l.phone_number || "").replace(/\D/g, ""))
      .filter((p) => p.length > 0)
  );
  const sessionCandidates = lines.map((line) => getSessionNameForLineId(line.id));

  const sessionsRes = await supabase.functions.invoke("waha-proxy", {
    body: { action: "sessions.list" },
  });

  if (sessionsRes.error) {
    console.error("WAHA sessions.list error:", sessionsRes.error);
    return { sessionName: null, error: sessionsRes.error.message || "WAHA oturumları kontrol edilemedi" };
  }

  const sessions = Array.isArray((sessionsRes.data as any)?.data) ? (sessionsRes.data as any).data : [];

  // 1) Try matching by line_<id> session name
  let workingSession = sessionCandidates.find((candidate) =>
    sessions.some((session: any) => session?.name === candidate && String(session?.status || "").toUpperCase() === "WORKING")
  );

  // 2) Fallback: any WORKING session whose me.id phone matches one of our active lines
  if (!workingSession) {
    const matched = sessions.find((session: any) => {
      if (String(session?.status || "").toUpperCase() !== "WORKING") return false;
      const meId: string = String(session?.me?.id || "");
      const mePhone = meId.split("@")[0]?.replace(/\D/g, "") || "";
      return mePhone && activePhones.has(mePhone);
    });
    if (matched) workingSession = matched.name;
  }

  if (!workingSession) {
    console.error("No active WORKING WhatsApp session found", { sessionCandidates, activePhones: [...activePhones], sessions });
    return { sessionName: null, error: "Bağlı/çalışan aktif WhatsApp hattı bulunamadı" };
  }

  return { sessionName: workingSession, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = PayloadSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone, userId: requestedUserId } = parsed.data;

    const waPhone = normalizePhoneToWa(phone);
    if (!waPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "Geçersiz telefon numarası" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Login details must belong to the authenticated specialist, never to a
    // client-supplied phone alone. Trusted server calls must name the owner.
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    let ownerId: string | undefined;
    if (token && token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      ownerId = requestedUserId;
    } else if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) ownerId = user.id;
    }
    if (!ownerId) {
      return new Response(JSON.stringify({ success: false, error: "Geçerli oturum gerekli" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recentSpecialists, error: specialistError } = await supabase
      .from("specialists")
      .select("id, user_id, name, email, phone, created_at")
      .eq("user_id", ownerId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(200);
    if (specialistError) throw specialistError;
    const recentSpecialist = (recentSpecialists || []).find((s) => canReceiveWelcome(s, ownerId, phone));

    if (!recentSpecialist) {
      return new Response(
        JSON.stringify({ success: false, error: "Bu numara için yeni bir kayıt bulunamadı" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: account, error: accountError } = await supabase.auth.admin.getUserById(ownerId);
    if (accountError || !account.user?.email) throw new Error("Giriş e-postası okunamadı");
    const waMessage = buildWelcomeMessage(recentSpecialist.name, account.user.email);

    const { sessionName, error: sessionError } = await getWorkingSessionName(supabase);
    if (!sessionName) {
      return new Response(
        JSON.stringify({ success: false, error: sessionError || "Aktif WhatsApp hattı bulunamadı" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chatId = `${waPhone}@c.us`;

    // 1) Önce PDF (Özel Fırsat) gönder
    let pdfRes: any = null;
    try {
      pdfRes = await supabase.functions.invoke("waha-proxy", {
        body: {
          action: "sendFile",
          sessionName,
          payload: {
            chatId,
            file: {
              url: "https://doktorumol.com.tr/ozel-firsat.pdf",
              filename: "ozel-firsat.pdf",
              mimetype: "application/pdf",
            },
            caption: "📄 Özel Fırsat Bilgilendirme Dökümanı",
          },
        },
      });
    } catch (e) {
      console.error("PDF send error:", e);
    }

    // Kısa bekleme: WhatsApp'ta dosya önce, sonra metin görünmeli
    await new Promise((r) => setTimeout(r, 1500));

    // 2) Hoş geldin metnini gönder
    const waRes = await supabase.functions.invoke("waha-proxy", {
      body: {
        action: "sendText",
        sessionName,
        payload: {
          chatId,
          text: waMessage,
        },
      },
    });

    const ok = !waRes.error && (waRes.data as any)?.success !== false;

    return new Response(
      JSON.stringify({
        success: ok,
        sessionName,
        pdf: pdfRes?.data,
        data: waRes.data,
        error: waRes.error?.message || ((waRes.data as any)?.success === false ? (waRes.data as any)?.error : undefined),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-registration-whatsapp error:", e);
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
