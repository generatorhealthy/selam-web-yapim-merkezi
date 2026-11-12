-- Aşama 2 / C — KRİTİK YAZIMLAR SUNUCUYA TAŞINIR
-- UYGULAMA SIRASI: bu dosya, aşağıdaki iki şey YAYINDA olmadan çalıştırılmamalıdır:
--   1) `create-checkout-order` uç fonksiyonu (siparişi sunucu kataloğundaki tutarla yazar)
--      ve ödeme sayfasının bu fonksiyonu çağırması,
--   2) `issue-consent-grant` / onay kaydı uç fonksiyonunun (fiş tüketip onay satırlarını
--      service_role ile yazması) kayıt akışının bunu çağırması.
-- Aksi halde: ödeme sayfasından sipariş ve kayıt akışından onay kaydı YAZILAMAZ.
--
-- Gerekçe: istemci `amount`, `status`, `approved_at`, `payment_status` gibi alanları
-- kendi durumundan gönderebiliyordu. Sipariş tutarı artık yalnızca sunucuda hesaplanır,
-- onay satırları yalnızca sunucuda (fiş karşılığı) üretilir.

-- ===========================================================================
-- 1) orders
-- ===========================================================================
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Tarayıcı sipariş yazımı yalnızca yönetici/personel panelleriyle sınırlıdır
-- (yeni sipariş ve sipariş kopyalama akışları). Müşteri siparişi sunucu fonksiyonuyla oluşur.
CREATE POLICY "Admin and staff can create orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_user() OR public.is_admin_or_staff_user()
);

-- Yönetici/personel güncellemesi: satır yetki dışına taşınamaz (WITH CHECK eklendi).
DROP POLICY IF EXISTS "Orders admin update policy" ON public.orders;
CREATE POLICY "Orders admin update policy" ON public.orders
FOR UPDATE TO authenticated
USING (public.is_admin_user() OR public.is_admin_or_staff_user())
WITH CHECK (public.is_admin_user() OR public.is_admin_or_staff_user());

-- ===========================================================================
-- 2) user_consent_logs
-- ===========================================================================
-- Onay satırları artık sunucuda üretilir: fiş tüketilmeden "verildi" yazılamaz.
DROP POLICY IF EXISTS "Anyone can insert consent logs" ON public.user_consent_logs;

-- Okuma politikaları (kullanıcı kendi kaydını, yönetici/personel tümünü görür) olduğu gibi kalır.
-- UPDATE/DELETE politikası zaten yok -> tarayıcı onay kaydını değiştiremez/silemez.
