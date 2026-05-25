## Hedef

Bir uzman `is_active = true` olduğunda, sistem otomatik olarak 3 adet 1000×1000 Instagram görseli üretsin (Kapak / Hakkında / Uzmanlık Alanları) ve admin panelde yeni bir "Instagram Paylaşımları" kartında listelensin.

## 1) Şablonlar (sabit referans)

Yüklediğin 3 görseli proje içine kalıcı referans olarak kopyalayacağım:
- `supabase/functions/_shared/insta-templates/cover.png` (Tuğba Yılmaz kapak)
- `supabase/functions/_shared/insta-templates/about.png` (Hakkında)
- `supabase/functions/_shared/insta-templates/expertise.png` (Uzmanlık Alanları)

Bu 3 görsel Gemini'ye her seferinde aynı tasarımı koruması için referans olarak verilecek.

## 2) Veritabanı

Yeni tablo: `specialist_instagram_posts`
- `specialist_id` (FK)
- `cover_url`, `about_url`, `expertise_url` (storage public URL)
- `status` ('pending' | 'processing' | 'ready' | 'failed')
- `error_message`
- `generated_at`

Yeni storage bucket: `instagram-posts` (public read).

Trigger: `specialists` tablosunda `is_active` false→true geçtiğinde (veya yeni satır `is_active=true` ile eklendiğinde) `pg_net` ile edge function tetiklenir. Aynı specialist için zaten `ready` kayıt varsa yeniden üretmez.

RLS: sadece admin/staff/muhasebe okuyabilir.

## 3) Edge Function: `generate-specialist-instagram-posts`

Girdi: `{ specialistId, force?: boolean }`

Akış:
1. `specialists`'ten ad, branş, profil fotoğrafı, bio çek.
2. `specialist_instagram_posts`'a `processing` satırı upsert et.
3. 3 referans şablonu base64 olarak yükle.
4. Her görsel için `google/gemini-3.1-flash-image-preview` (Nano Banana 2) ile çağrı:
   - **Kapak**: şablon + uzman fotoğrafı → ad/soyad değişir, branş pill değişir, alıntı uzmana özel kısa cümle (bio'dan AI ile çıkarılır).
   - **Hakkında**: şablon + uzman fotoğrafı → bio'dan 2 kısa paragrafa indirgenmiş hakkında metni, branş pill değişir.
   - **Uzmanlık Alanları**: şablonla aynı düzen, 6 kutucuk uzmanın branşına göre AI ile seçilir (icon stili korunur).
5. PIL post-process: 1000×1000, renk +%18, keskinlik +%35.
6. Storage'a yükle, URL'leri DB'ye yaz, `status='ready'`.
7. Hata olursa `failed` + `error_message`.

Eşzamanlılık: 3 görsel paralel `Promise.all`.

## 4) Admin paneli

`src/pages/admin/AdminDashboard.tsx` içine yeni kart: **"Instagram Paylaşımları"** → `/admin/instagram-posts`.

Yeni sayfa: `src/pages/admin/InstagramPosts.tsx`
- En yeni üstte uzman listesi (ad, branş, profil foto, tarih, status badge).
- Her satırda 3 görsel önizleme (lightbox), tek tek indir, hepsini ZIP indir.
- "Yeniden Üret" butonu (force=true).
- "Manuel Tetikle" → uzman ara + üret.
- Status filtresi: pending/ready/failed.

Yalnızca `admin` rolü görür (mevcut admin dashboard access rules ile uyumlu).

## 5) Mevcut 141 uzman

Tek seferlik backfill butonu admin sayfasında: "Tüm aktif uzmanlar için üret" → batch (8'li paralel).

## Teknik Notlar

- Model: `google/gemini-3.1-flash-image-preview` (LOVABLE_API_KEY üzerinden gateway).
- Trigger SQL'i: `pg_net.http_post` ile edge function URL'sine async çağrı; service_role anahtarı vault'tan.
- Görsel üretimi ~10-20sn sürebilir → trigger fire-and-forget, frontend polling ile status izler.

## Onayınla başlayacaklarım

1. Şablonları projeye kopyalama
2. Migration (tablo + bucket + trigger)
3. Edge function
4. Admin sayfası ve dashboard kartı

Onaylıyor musun? Şablonlardaki ikon seti (beyin/insanlar/ayıcık vb.) için ek bir kütüphane mi tutalım, yoksa Gemini'nin şablondan birebir kopyalamasına mı güvenelim? (Önerim: ilk versiyonda Gemini'ye bırakalım, kalitesizse sonra SVG ikon kütüphanesine geçeriz.)
