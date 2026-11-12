# FreePBX — salt okunur kontrol komutları

Durum: **Henüz başlanmadı** (bu ortamda santral SSH erişimi yok). Hiçbir ses dosyası dinlenmez, indirilmez veya değiştirilmez. Komutlar yalnız yetkili santral yöneticisi tarafından sunucuda uygulanır. Paylaşılacak çıktıdan telefonlar, kullanıcı adları, dosya yollarındaki kimlikler, IP ve sırlar ayıklanır.

## Kayıt özelliği ve dosya varlığı
```bash
asterisk -rx 'module show like mixmonitor'
asterisk -rx 'core show application MixMonitor'
test ! -d /var/spool/asterisk/monitor || stat -c '%a %U %G' /var/spool/asterisk/monitor
python3 - <<'PY'
import os, time
root='/var/spool/asterisk/monitor'
n=recent=0; first=last=None
for path, dirs, files in os.walk(root):
    for name in files:
        if not name.lower().endswith(('.wav','.mp3','.gsm','.ogg','.sln')): continue
        try: s=os.stat(os.path.join(path,name))
        except OSError: continue
        n+=1; recent+=int(s.st_mtime >= time.time()-86400)
        first=s.st_mtime if first is None else min(first,s.st_mtime)
        last=s.st_mtime if last is None else max(last,s.st_mtime)
print({'audio_file_count':n,'modified_last_24h':recent,'oldest_epoch':first,'latest_epoch':last})
PY
```
Modül varlığı kayıt açık demek değildir; dosya mtime yeni çağrıda kayıt oluşturulduğunu tek başına kanıtlamaz. Aynı toplam sayımı iki kez, **zaten gerçekleşen meşru çağrının** öncesi/sonrası karşılaştırın. Test çağrısı yapılmaz.

## Yetkili yönetici yerel inceleme (çıktıyı topluca paylaşmayın)
```bash
asterisk -rx 'dialplan show sub-record-check'
getfacl /var/spool/asterisk/monitor
systemctl list-timers --all --no-pager
crontab -l
```
FreePBX yönetim ekranından gelen/giden çağrı kayıt seçenekleri, dahili/rota kuralları ve kayıt dinleme/indirme yetkileri **yalnız görüntülenir**. Dialplan içinde MixMonitor, kayıt modu ve sonlandırma komutları incelenir. Cron/timer/backup konfigürasyonu yerelde incelenerek gerçek silme süresi, rclone/rsync/S3/SFTP aktarımı, hedef ülke ve erişim sahipleri kaydedilir; sırları göstermeyin. CDR veritabanında recordingfile alanı varsa yalnız toplam/dolu sayı okunur; bağlantı parolası veya CDR kişisel satırlar paylaşılmaz.

Saklama için cron/timer yokluğu sonsuz saklamayı kanıtlamaz; uygulama görevleri, FreePBX yedek modülleri, nesne depolama yaşam döngüsü ve sağlayıcı yedekleri ayrıca kontrol edilir. SSH erişimi olmadan 'kayıt tutulmaz', '30 gün tutulur' veya 'Türkiye'de kalır' denilemez.