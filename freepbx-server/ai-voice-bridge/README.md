# Yapay Zekâ Sesli Arama Köprüsü — FreePBX Kurulumu

Bu servis FreePBX sunucusunun **üzerinde** çalışır ve Asterisk ile OpenAI Realtime API
arasında sesi taşır. Supabase edge fonksiyonları bu servise HTTP ile arama emri verir.

> Sistem **kapalı** teslim edilir. `ai_call_settings.enabled = false` olduğu sürece
> hiçbir otomatik arama yapılmaz; yalnızca panelden "Test Araması" tetiklenebilir.

## 1. Dosyaları sunucuya kopyalayın

```bash
ssh root@FREEPBX_SUNUCU
mkdir -p /opt/ai-voice-bridge
# server.js ve package.json dosyalarını /opt/ai-voice-bridge içine kopyalayın
cd /opt/ai-voice-bridge
npm install
node -v   # 18 veya üzeri olmalı
```

Node.js kurulu değilse:
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs
```

## 2. AudioSocket modülünü etkinleştirin

```bash
asterisk -rx "module show like audiosocket"
# Görünmüyorsa:
asterisk -rx "module load res_audiosocket.so"
asterisk -rx "module load app_audiosocket.so"
```
Kalıcı olması için `/etc/asterisk/modules.conf` içine:
```
load => res_audiosocket.so
load => app_audiosocket.so
```

## 3. AMI kullanıcısı ekleyin

`/etc/asterisk/manager_custom.conf`:
```
[aivoice]
secret = BURAYA_GUCLU_BIR_SIFRE
deny = 0.0.0.0/0.0.0.0
permit = 127.0.0.1/255.255.255.255
read = system,call,agent,user,verbose,dialplan
write = system,call,agent,user,originate
```
```bash
fwconsole reload
```

## 4. Dialplan context'lerini ekleyin

`/etc/asterisk/extensions_custom.conf` sonuna:
```
[ai-outbound]
; Danışan telefonu açtığında çağrı buraya düşer ve ses köprüye bağlanır.
exten => s,1,NoOp(AI outbound call ${AI_UUID})
 same => n,Answer()
 same => n,Set(CHANNEL(language)=tr)
 same => n,Wait(1)
 same => n,AudioSocket(${AI_UUID},${AI_HOST})
 same => n,Hangup()

[ai-transfer]
; Yapay zekâ aktarım kararı verdiğinde kanal buraya yönlendirilir.
exten => _X.,1,NoOp(AI transfer to extension ${EXTEN})
 same => n,Set(CALLERID(name)=Doktorumol Danisan)
 same => n,Dial(Local/${EXTEN}@from-internal,60)
 same => n,Hangup()
```
```bash
fwconsole reload
```

Aktarım, bir telefonun çağrı içi özellik kodunu taklit etmez; dahiliyi doğrudan
`from-internal` içinde arar ve dahilinin Follow-Me ayarını çalıştırır.

## 5. Giden hat (80 / 81 prefix)

Köprü, aranacak numaranın başına hat prefixini ekleyerek `from-internal`
üzerinden çevirir (`8005316852275` gibi). Bria'da kullandığınız prefix'ler
FreePBX Outbound Route'larında tanımlı olduğu sürece ek ayar gerekmez.

Hat rotasyonu köprüde değil, veritabanında yönetilir:
- Varsayılan hat `80`.
- Aktarım başarılı olursa o hat `line_cooldown_seconds` (varsayılan 150 sn) boyunca
  meşgul sayılır ve sıradaki arama diğer hattan yapılır.
- Danışan açmazsa / istemezse hat değişmez, aynı hattan devam edilir.

## 6. systemd servisi

`/etc/systemd/system/ai-voice-bridge.service`:
```
[Unit]
Description=Doktorumol AI Voice Bridge
After=network.target asterisk.service

[Service]
Type=simple
WorkingDirectory=/opt/ai-voice-bridge
ExecStart=/usr/bin/node /opt/ai-voice-bridge/server.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/ai-voice-bridge/.env

[Install]
WantedBy=multi-user.target
```

`/opt/ai-voice-bridge/.env` (chmod 600):
```
AI_BRIDGE_SECRET=lovable_tarafinda_uretilen_ayni_deger
SUPABASE_FUNCTIONS_URL=https://irnfwewabogveofwemvg.supabase.co/functions/v1
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-realtime
AMI_USER=aivoice
AMI_PASSWORD=manager_custom.conf_ile_ayni_sifre
BRIDGE_HTTP_PORT=8090
BRIDGE_AUDIO_PORT=9092
AI_AUDIOSOCKET_HOST=127.0.0.1
```

```bash
systemctl daemon-reload
systemctl enable --now ai-voice-bridge
systemctl status ai-voice-bridge
journalctl -u ai-voice-bridge -f
```

## 7. HTTP erişimi

Supabase edge fonksiyonları `AI_BRIDGE_URL` adresine dışarıdan erişir. Güvenli yol:
sunucudaki mevcut HTTPS (Apache/Nginx) üzerinden `/ai-bridge/` yolunu 8090 portuna
proxy'lemek.

Apache örneği:
```
ProxyPass        /ai-bridge/ http://127.0.0.1:8090/
ProxyPassReverse /ai-bridge/ http://127.0.0.1:8090/
```
Bu durumda Lovable tarafındaki `AI_BRIDGE_URL` = `https://SUNUCU/ai-bridge`

8090 portunu doğrudan internete açmayın; her istekte `x-bridge-secret` başlığı
doğrulanır, yine de proxy + HTTPS önerilir.

## 8. Doğrulama

```bash
curl -s -H "x-bridge-secret: SECRET" http://127.0.0.1:8090/health
# {"ok":true,"ami":true,"active_calls":0,"model":"gpt-realtime"}
```

Ardından yönetim panelinden (Danışan Yönlendirme Sistemi → Yapay Zekâ Arama Sistemi)
"Test Araması" ile tek bir danışanı arayın. Her şey doğruysa ana şalteri açın.

## Ses ve Konuşma Algılama Ayarları (ortam değişkenleri)

`/etc/systemd/system/ai-voice-bridge.service` içindeki `Environment=` satırlarına eklenebilir.
Değişiklikten sonra: `systemctl daemon-reload && systemctl restart ai-voice-bridge`

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `OPENAI_REALTIME_VOICE` | `marin` | Desteklenen kadın sesleri: `marin`, `cedar`, `coral`, `sage`, `shimmer`, `verse` |
| `OPENAI_REALTIME_SPEED` | `1.0` | Konuşma hızı |
| `OPENAI_REALTIME_NOISE_REDUCTION` | `far_field` | `far_field`, `near_field` veya `off` |
| `OPENAI_VAD_TYPE` | `server_vad` | Konuşma algılama tipi |
| `OPENAI_VAD_THRESHOLD` | `0.75` | Gürültülü ortamda 0.85–0.95'e çıkarılabilir |
| `OPENAI_VAD_PREFIX_PADDING_MS` | `400` | Konuşma başı tampon |
| `OPENAI_VAD_SILENCE_MS` | `900` | Cümlenin bittiğine karar verme süresi (kısa duraksamalarda cevap vermez) |
| `OPENAI_VAD_CREATE_RESPONSE` | `true` | `false` yazılırsa otomatik cevap üretmez |
| `OPENAI_VAD_INTERRUPT_RESPONSE` | `true` | `false` yazılırsa asistanın sözü kesilmez |
| `AI_MIN_TRANSCRIPT_CHARS` | `3` | Anlamlı sayılacak en az karakter |
| `AI_MIN_TRANSCRIPT_WORD_CHARS` | `2` | Anlamlı sayılacak en az kelime uzunluğu |

Transkript doğrulama katmanı: nefes, öksürük, "hı/ıh/eee/şş", tek harf, yarım kelime ve
yalnızca noktalama içeren girdiler kayda geçmez, cevap üretilmez ve **hiçbir araç
(özellikle `transfer_call`) çağrılmaz**.
