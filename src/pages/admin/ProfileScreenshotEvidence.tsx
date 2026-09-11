import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, ExternalLink, Loader2, Archive } from "lucide-react";

type Props = {
  caseId: string;
  defendantName: string;
  defendantEmail?: string | null;
  defendantPhone?: string | null;
  profiles: any[];
  blogs: any[];
  savedScreenshots: { url: string; title: string; sourceRef?: string | null }[];
  onSaved: () => void;
};

const trSlug = (v: string) =>
  (v || "")
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString("tr-TR") : "-");

export default function ProfileScreenshotEvidence({
  caseId, defendantName, defendantEmail, defendantPhone, profiles, blogs, savedScreenshots, onSaved,
}: Props) {
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<{ timestamp: string; url: string }[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const shotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const profile = useMemo(() => {
    const merged: any = {};
    for (const p of profiles) {
      const src = { ...(p.profile_data || {}), ...p };
      for (const [k, v] of Object.entries(src)) {
        if (merged[k] === undefined || merged[k] === null || merged[k] === "") merged[k] = v;
      }
    }
    return merged;
  }, [profiles]);

  const archivedScreenshots = useMemo(() => {
    const profileUrls = profiles.flatMap((item) => {
      const urls = item?.screenshot_urls;
      return Array.isArray(urls) ? urls.filter((url): url is string => typeof url === "string" && url.length > 0) : [];
    });
    const saved = savedScreenshots.map((item) => item.url).filter(Boolean);
    return Array.from(new Set([...profileUrls, ...saved]));
  }, [profiles, savedScreenshots]);

  const slug = trSlug(defendantName);

  const urlCandidates = useMemo(() => {
    const base = "https://doktorumol.com.tr";
    const specialtyPath = trSlug(profile.specialty || "psikolog") || "psikolog";
    const list = [
      profile.captured_profile_url,
      profile.slug ? `${base}/${specialtyPath}/${profile.slug}` : null,
      `${base}/${specialtyPath}/${slug}`,
      `${base}/${specialtyPath}/psk-${slug}`,
      `${base}/uzmanlar/${slug}`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [profile, slug]);

  const primaryUrl = urlCandidates[0] || `https://doktorumol.com.tr/psikolog/${slug}`;

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoadingSnaps(true);
      try {
        const res = await fetch(
          `https://web.archive.org/cdx/search/cdx?url=doktorumol.com.tr*&output=json&limit=40&collapse=urlkey&fl=timestamp,original&filter=urlkey:.*${encodeURIComponent(slug)}.*`
        );
        const rows = (await res.json()) as string[][];
        const items = rows.slice(1).map((r) => ({ timestamp: r[0], url: r[1] }));
        setSnapshots(items);
      } catch {
        setSnapshots([]);
      } finally {
        setLoadingSnaps(false);
      }
    };
    load();
  }, [slug]);

  const sections: { key: string; label: string; body: React.ReactNode }[] = [
    {
      key: "profil-karti",
      label: "Profil Kartı (Yayındaki Görünüm)",
      body: (
        <div className="flex items-start gap-4">
          {profile.profile_picture ? (
            <img src={profile.profile_picture} crossOrigin="anonymous" alt={defendantName}
              className="w-24 h-24 rounded-full object-cover border" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted" />
          )}
          <div>
            <div className="text-xl font-bold">{defendantName}</div>
            <div className="text-primary font-medium">{profile.specialty || "-"}</div>
            <div className="text-sm text-muted-foreground">{profile.city || "-"}</div>
            <div className="text-sm text-muted-foreground">
              {profile.experience ? `${profile.experience} yıl deneyim` : ""}
              {profile.consultation_fee ? ` · Görüşme ücreti: ${profile.consultation_fee} TL` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "iletisim",
      label: "İletişim ve Kayıt Bilgileri",
      body: (
        <div className="text-sm space-y-1">
          <div>E-posta: {profile.specialist_email || defendantEmail || "-"}</div>
          <div>Telefon: {profile.specialist_phone || defendantPhone || "-"}</div>
          <div>Dahili numara: {profile.internal_number || "-"}</div>
          <div>Kayıt tarihi: {fmt(profile.created_at)}</div>
          <div>Silinme / arşiv tarihi: {fmt(profile.deleted_at)}</div>
        </div>
      ),
    },
    {
      key: "hakkinda",
      label: "Hakkında (Profil Metni)",
      body: <p className="text-sm whitespace-pre-wrap leading-relaxed">{profile.bio || "-"}</p>,
    },
    {
      key: "sertifikalar",
      label: "Eğitim ve Sertifikalar",
      body: (
        <div className="text-sm space-y-1 whitespace-pre-wrap">
          <div>Üniversite: {profile.university || profile.education || "-"}</div>
          <div>{profile.certifications || "-"}</div>
        </div>
      ),
    },
    {
      key: "yayin",
      label: "Yayın Kanıtı (Blog ve Arşiv Kayıtları)",
      body: (
        <div className="text-sm space-y-1">
          <div>Yayınlanan blog sayısı: {blogs.length}</div>
          {blogs.slice(0, 5).map((b: any, i: number) => (
            <div key={i} className="text-muted-foreground">
              {fmt(b.published_at || b.created_at)} — {b.title}
            </div>
          ))}
          {snapshots.slice(0, 5).map((s, i) => (
            <div key={`s${i}`} className="text-muted-foreground">
              Web arşivi: {s.timestamp.slice(0, 8)} — {s.url}
            </div>
          ))}
        </div>
      ),
    },
  ];

  const captureAndSave = async (key: string, label: string) => {
    const el = shotRefs.current[key];
    if (!el) return;
    setBusy(key);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false });
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Görüntü oluşturulamadı"))), "image/png")
      );
      const path = `litigation/${caseId}/${Date.now()}_${key}.png`;
      const { error: upErr } = await supabase.storage.from("legal-evidence").upload(path, blob, {
        contentType: "image/png", upsert: false,
      });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("legal-evidence").getPublicUrl(path);

      const { error } = await supabase.from("litigation_evidence_items").insert([{
        case_id: caseId,
        category: "PROFIL_GORUNTUSU",
        title: `${label} — ${defendantName}`,
        description: `Profil URL: ${primaryUrl}\nEkran görüntüsü tarihi: ${new Date().toLocaleString("tr-TR")}\nKaynak: Arşiv verisinden yeniden oluşturulmuş yayın görünümü`,
        file_url: publicUrl,
        source_ref: primaryUrl,
        importance: "YUKSEK",
      }]);
      if (error) throw error;
      toast({ title: "Kaydedildi", description: `${label} kanıt olarak eklendi.` });
      onSaved();
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "Ekran görüntüsü kaydedilemedi.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const captureAll = async () => {
    for (const s of sections) {
      await captureAndSave(s.key, s.label);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-sm flex items-center gap-2">
            Profil Ekran Görüntüleri (Yayın Kanıtı)
            <Badge variant="secondary">{sections.length}</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Kaydedilmiş görüntüler ve silinmeden önce arşivlenen profil bilgileri birlikte gösterilir.
          </p>
        </div>
        <Button size="sm" variant="outline" className="print:hidden" onClick={captureAll} disabled={!!busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Camera className="w-4 h-4 mr-1" />}
          Tümünü kanıt olarak kaydet
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {archivedScreenshots.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium">Kaydedilmiş profil ekran görüntüleri</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {archivedScreenshots.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border bg-muted/20"
                >
                  <img
                    src={url}
                    alt={`${defendantName} profil ekran görüntüsü ${index + 1}`}
                    className="aspect-[4/3] w-full object-contain"
                    loading="lazy"
                  />
                  <div className="flex items-center gap-1 border-t px-3 py-2 text-xs text-primary">
                    Görüntüyü aç <ExternalLink className="h-3 w-3" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {profiles.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Arşiv profil bilgileri yükleniyor. Üstteki yenile düğmesiyle tekrar deneyebilirsiniz.
          </div>
        )}

        <div className="text-xs space-y-1">
          <div className="font-medium">Yayınlanan profil adresleri:</div>
          {urlCandidates.map((u) => (
            <a key={u} href={u} target="_blank" rel="noopener noreferrer"
              className="text-primary flex items-center gap-1 break-all">
              {u} <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>

        <div className="text-xs space-y-1">
          <div className="font-medium flex items-center gap-1">
            <Archive className="w-3 h-3" /> Web arşivi (archive.org) kayıtları
            {loadingSnaps && <Loader2 className="w-3 h-3 animate-spin" />}
          </div>
          {snapshots.length === 0 && !loadingSnaps && (
            <p className="text-muted-foreground">Arşiv kaydı bulunamadı.</p>
          )}
          {snapshots.map((s) => (
            <a key={s.timestamp + s.url} href={`https://web.archive.org/web/${s.timestamp}/${s.url}`}
              target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 break-all">
              {s.timestamp.slice(0, 4)}.{s.timestamp.slice(4, 6)}.{s.timestamp.slice(6, 8)} — {s.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>

        {profiles.length > 0 && <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.key} className="space-y-2">
              <div
                ref={(el) => { shotRefs.current[s.key] = el; }}
                className="border rounded-lg p-4 bg-background"
              >
                <div className="text-[11px] text-muted-foreground border-b pb-2 mb-3 break-all">
                  {primaryUrl} · {s.label} · Görüntü tarihi: {new Date().toLocaleString("tr-TR")}
                </div>
                {s.body}
              </div>
              <div className="flex justify-end print:hidden">
                <Button size="sm" variant="outline" disabled={busy === s.key}
                  onClick={() => captureAndSave(s.key, s.label)}>
                  {busy === s.key ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Camera className="w-4 h-4 mr-1" />}
                  Kanıt olarak kaydet
                </Button>
              </div>
            </div>
          ))}
        </div>}
      </CardContent>
    </Card>
  );
}
