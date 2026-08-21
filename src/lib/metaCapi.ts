import { supabase } from "@/integrations/supabase/client";

const getCookie = (name: string): string | undefined => {
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : undefined;
};

/** fbclid varsa Meta'nın beklediği _fbc formatına çevirir. */
const buildFbc = (): string | undefined => {
  const existing = getCookie("_fbc");
  if (existing) return existing;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return undefined;
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  try {
    document.cookie = `_fbc=${fbc}; path=/; max-age=7776000`;
  } catch { /* ignore */ }
  return fbc;
};

export interface MetaCapiEvent {
  event_name?: string;
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null
  city?: string | null;
  external_id?: string | null;
  lead_event_source?: string;
}

/** Meta Conversions API'ye sunucu taraflı olay gönderir (hata durumunda sessiz kalır). */
export const trackMetaLead = async (event: MetaCapiEvent): Promise<void> => {
  try {
    await supabase.functions.invoke("meta-capi-event", {
      body: {
        event_name: event.event_name ?? "Lead",
        email: event.email ?? undefined,
        phone: event.phone ?? undefined,
        first_name: event.first_name ?? undefined,
        last_name: event.last_name ?? undefined,
        city: event.city ?? undefined,
        external_id: event.external_id ?? undefined,
        lead_event_source: event.lead_event_source ?? "Doktorumol Kayıt Ol",
        event_source_url: window.location.href,
        fbc: buildFbc(),
        fbp: getCookie("_fbp"),
        client_user_agent: navigator.userAgent,
      },
    });
  } catch (err) {
    console.warn("Meta CAPI event gönderilemedi", err);
  }
};
