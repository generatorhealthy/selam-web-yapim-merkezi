# 23 Kasım 2026 — Üç ayrıcalıklı işlev uyarısı

Canlı işlev tanımları ve anon/authenticated EXECUTE yetkileri salt okunur sorgularla incelendi. İşlevler canlıda çalıştırılmadı, hiçbir müşteri kaydı değiştirilmedi.

## Sonuç
- `get_current_user_role()`: dinamik sorgu var; ancak sorgu metni kayıttan alınmıyor, sabit. Tek değişken sunucunun doğruladığı `auth.uid()` UUID'si ve `%L` ile kaçırılıyor. Başka bir kişinin kimliğini parametre olarak kabul etmiyor. Tarif edilen keyfi komut çalıştırma yolu doğrulanmadı. Gereksiz `EXECUTE format(...)` yerine sabit SELECT adayı hazırlandı; mevcut rol kaynağı, fallback ve grant'ler korunuyor. Ayrı rol tablosuna taşıma bu küçük düzeltmenin kapsamı değildir.
- `create_full_database_backup(text,uuid,text)`: anon erişimi kapalı. İlk kapı yalnız onaylı admin veya service_role/doğrudan postgres zamanlayıcısını kabul ediyor. Oluşturulan tablo adları sabit kaynak tablolardan ve sunucunun zamanından oluşuyor, `quote_ident` ile korunuyor; açıklama gibi kullanıcı metinleri sorgu komutu olarak çalıştırılmıyor. Mevcut kapıyı kaldırmak veya authenticated erişimini tümden kapatmak paneli bozabilir; değişiklik yapılmadı.
- `restore_from_backup(bigint,text)`: anon erişimi kapalı, ilk işlem `is_admin_user()` kontrolü. Tablo tanımlayıcısı `quote_ident` ile kaçırılıyor. Normal kullanıcıların keyfi çalıştırabildiği iddiası güncel tanıma uymuyor. Yıkıcı geri yükleme denenmedi; yedek listesiyle ek kapsam sınırlaması ayrı bir değerlendirmedir.

## Yayın adayı
`candidate.sql` yalnız bir işlevin dinamik sorgusunu kaldırır. Tablo, veri, yetki, ödeme, yedekleme veya zamanlayıcı değişikliği yoktur. Yerel sentetik PostgreSQL testi kimlik ayrımını ve boş oturum fallback'ini kontrol eder.

Canlıya uygulanmadan önce ayrı kullanıcı onayı gerekir. Uygulandıktan sonra işlev tanımı yeniden okunmalı ve tarama yenilenmelidir; etiketin kaybolacağı garanti edilmez. Geri alma aynı kimlik sınırlı eski gövdeyi geri getirir; herhangi bir yetki genişletilmez.