# AI Reklam ve Lead Intelligence Sistemi — Aşamalı Plan

Mevcut kayıt, giriş, ödeme (İyzico), üyelik ve panel aynen korunur. Yeni sistem yanına eklenir; hiçbir mevcut veri silinmez veya değiştirilmez.

## Aşama 1 — Kaynak takibi ve olay kaydı (temel)
- Siteye ilk gelişte reklam bilgileri (utm_*, fbclid, fbc, fbp, kampanya/reklam seti/reklam kimliği, giriş sayfası, referrer) tarayıcıda saklanır; ilk temas asla ezilmez, son temas ayrıca tutulur.
- Kayıt anında bu bilgiler uzmanın kaydına bağlanır; ödeme yapıldığında ödeme kaydı aynı kaynağa bağlanır.
- Tek ortak olay tablosu: sayfa görüntüleme, fiyat/paket görüntüleme, kayıt başladı/adım/tamamlandı, profil tamamlandı, ödeme başladı/denendi/başarısız/tamamlandı, abonelik iptal.
- Mevcut kayıt sihirbazı, ödeme sayfası ve İyzico dönüşü bu olayları yazar (mevcut akışa sadece "kaydet" çağrısı eklenir).

## Aşama 2 — Puan, sınıf ve satış aşaması
- Ticari Uygunluk Puanı (0-100): Profesyonel Hazırlık + İş Kapasitesi + Satın Alma Niyeti. Mesleki kalite, gelir veya kişisel servet tahmini yapılmaz.
- Puan ağırlıkları panelden değiştirilebilir kurallar tablosunda (örn. ödeme başladı +20).
- Sınıflar: DÜŞÜK / ORTA / YÜKSEK / SICAK, ödeme yapan = DÖNÜŞTÜ (renkli rozet).
- Satış aşamaları (Yeni → ... → Ücretli Üye / Kayıp / İptal) olaylardan otomatik güncellenir, yönetici elle değiştirebilir; her değişiklik geçmişe yazılır.
- Eksik profil alanları (aylık yeni danışan kapasitesi, deneyim yılı, Instagram/web vb.) yalnızca mevcutta karşılığı yoksa eklenir.

## Aşama 3 — Meta'ya gerçek satış bildirimi
- Mevcut Meta Conversions API işlevi genişletilir: Lead, QualifiedLead, CompleteRegistration, InitiateCheckout, Purchase (TRY, gerçek tutar).
- Her olaya tekil olay kimliği; Pixel ile aynı kimlik kullanılır, Meta çift saymaz.
- E-posta/telefon sunucuda şifrelenerek (hash) gönderilir; kayıtlarda kişisel veri maskelenir.

## Aşama 4 — Reklam performans verisi (yalnızca okuma)
- Mevcut Meta reklam yöneticisi bağlantısıyla günlük kampanya/reklam seti/reklam harcama ve tıklama verisi çekilir; reklamlarda hiçbir değişiklik yapılmaz.
- Bizdeki gerçek kayıt ve ödemelerle birleştirilerek CPL, CPQL, CAC, ROAS, dönüşüm oranları hesaplanır; 7/14/30 günlük dönüşüm penceresi.

## Aşama 5 — AI Reklam Merkezi (yönetici paneli, yeni kart)
- Üstte önceki döneme göre % değişimli göstergeler: Harcama, Lead, Nitelikli, Kayıt, Ödeme Başlatan, Ücretli Üye, Gelir, CPL, CPQL, CAC, ROAS.
- Huni görünümü (sayı, dönüşüm, kayıp oranı).
- Kampanya / Reklam Seti / Reklam geçişli, sıralanabilir, filtreli tablo.
- En iyi/en kötü reklam kartları, "Çok harcadı, hiç satış yok" kırmızı uyarısı (eşikler panelden ayarlı).
- Meslek ve şehir kırılımı (az veri olan satırda kesin sonuç yok).
- Lead detay sayfası: bilgiler, puan, aşama, kaynak, görsel olay zaman çizelgesi, kısa AI yorumu.
- AI önerileri: BÜYÜT / KORU / İZLE / AZALT / DURDUR / YETERSİZ VERİ + güven düzeyi; az veriyle kesin karar vermez; öneriler geçmişe kaydedilir. Öncelik ücretli üye, CAC, gelir, ROAS — ucuz lead tek başına başarı sayılmaz.

## Önemli notlar
- Geçmiş ziyaretlerin kaynak bilgisi yoktur; ölçüm yayın sonrasından başlar. Mevcut kayıt takip verisindeki utm bilgileri mümkün olduğunca eşleştirilir.
- Reklam kimliklerinin gelmesi için Meta reklam bağlantılarına URL parametresi eklenmeli (örn. utm_campaign={{campaign.name}}&meta_ad_id={{ad.id}}) — bu adımı Meta panelinde sizin yapmanız gerekir; tam metni vereceğim.
- Yalnızca yönetici görür.

## Teknik ayrıntılar
- Yeni tablolar: lead_attribution, analytics_events (generic, JSONB properties), scoring_rules, lead_scores, lead_stage_history, alert_rules, meta_campaigns/adsets/ads, meta_daily_metrics, ai_ad_recommendations. Hepsi GRANT + RLS (admin has_role), anon yalnız olay INSERT'i SECURITY DEFINER RPC üzerinden.
- Puan ve aşama hesaplama: SQL fonksiyonu + olay sonrası tetikleyici.
- Edge functions: send-meta-conversion (meta-capi-event genişletilir), sync-meta-insights (cron, read-only), ai-ad-analysis (Lovable AI Gateway).
- Her aşama ayrı yayınlanır ve test edilir; önce Aşama 1+2 ile başlanır.
