# Randevu ve ödeme son düzeltmeleri — 13 Kasım 2026
- Canlı migration: kapalı saat (available_time_slots) + geçmiş + onaylı çakışma ayrımı; anonim iletişim çifti 10 dk/6, 1 saat/20. IP kullanılmaz. Tetikleyiciler canlıda, anon execute=false. 339 randevu, 2743 sipariş, 0 makbuz değişmedi.
- Yerel sentetik PG: 16/16 (20 eşzamanlı onay 1 kabul/19 ret; aynı IP 20 farklı danışan 20 kabul; panel takvim değişikliği sunucuda geçerli).
- Deno: 22/22 (gerçek ödeme handler'ları, abonelik V3 imzası, WhatsApp tek yönlendirme). Bun: 4/4.
- iyzico: Abonelik Checkout Form + Subscription webhook. V3 kodu resmî abonelik formatıyla uyumlu; IYZICO_MERCHANT_ID yok, zorunlu değil, Retrieve korunur.
- Web: gerçek sitede app-C1-z3bvQ.js "saat dolu" uyarısını içeriyor; yeni "kapalı saat/bekleyin" mesajları sonraki Hostinger dağıtımında.
