<?php
/**
 * Doktorum Ol – Açmayanlar toplu otomatik arama yardımcısı (bağımsız dosya).
 * Kurulum: /var/www/html/freepbx-ivr.php (freepbx-trunk.php ile aynı klasör).
 * Edge function (lead-ivr-campaign) buraya POST atar.
 *
 * İşlemler:
 *  setup  : ses dosyalarını (8 kHz u-law) yazar, [doktorumol-ivr] bağlamını kurar, dialplan reload
 *  call   : tek bir arama başlatır (Asterisk call file)
 *  status : bekleyen + aktif otomatik arama sayısı
 *  stop   : bekleyen arama dosyalarını siler, aktif aramaları kapatır
 */
@ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
function out($d, $s = 200) { http_response_code($s); echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }

// ====== AYAR (freepbx-ext.php ile aynı secret) ======
$SECRET = '1b849165041c774396da0fc92c8fa4c10af3e84d6d0da6d3';
$SOUND_DIR = '/var/lib/asterisk/sounds/custom/doktorumol';
$SPOOL     = '/var/spool/asterisk/outgoing';
$TMP       = '/var/spool/asterisk/tmp';
$CUSTOM    = '/etc/asterisk/extensions_custom.conf';
$ASTERISK  = '/usr/sbin/asterisk';
// ====================================================

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) out(['success' => false, 'error' => 'bad_request'], 400);
if (!hash_equals($SECRET, (string)($in['secret'] ?? ''))) out(['success' => false, 'error' => 'unauthorized'], 401);
$action = (string)($in['action'] ?? '');

function ast($cmd) { global $ASTERISK; return (string)@shell_exec($ASTERISK . ' -rx ' . escapeshellarg($cmd) . ' 2>&1'); }
function active_count() {
  $n = 0;
  foreach (explode("\n", ast('core show channels concise')) as $l) if (strpos($l, 'doktorumol-ivr') !== false) $n++;
  return $n;
}
function pending_count() { global $SPOOL; return count(glob($SPOOL . '/doktorumol-*.call') ?: []); }

if ($action === 'setup') {
  if (!is_dir($SOUND_DIR) && !@mkdir($SOUND_DIR, 0775, true)) out(['success' => false, 'error' => 'Ses klasörü oluşturulamadı'], 500);
  $files = is_array($in['files'] ?? null) ? $in['files'] : [];
  foreach ($files as $name => $b64) {
    if (!preg_match('/^[a-z0-9_]{1,40}$/', $name)) continue;
    $bin = base64_decode((string)$b64, true);
    if ($bin === false || strlen($bin) < 1000) out(['success' => false, 'error' => "Ses dosyası bozuk: $name"], 400);
    if (@file_put_contents("$SOUND_DIR/$name.ulaw", $bin) === false) out(['success' => false, 'error' => "Ses yazılamadı: $name"], 500);
  }
  $ctx = <<<'CTX'
; ===== doktorumol-ivr BASLANGIC (otomatik, elle duzenlemeyin) =====
[doktorumol-ivr]
exten => s,1,Answer()
 same => n,Wait(1)
 same => n,Set(TRIES=0)
 same => n(ask),Read(DIGIT,custom/doktorumol/area_${IVR_AREA},1,,1,7)
 same => n,GotoIf($["${DIGIT}"="1"]?p1)
 same => n,GotoIf($["${DIGIT}"="2"]?p2)
 same => n,Set(TRIES=$[${TRIES}+1])
 same => n,GotoIf($[${TRIES}<2]?ask)
 same => n,Set(R=${CURL(${IVR_URL}&call=${IVR_CALL}&digit=none)})
 same => n,Hangup()
 same => n(p1),Set(R=${CURL(${IVR_URL}&call=${IVR_CALL}&digit=1)})
 same => n,Playback(custom/doktorumol/reply_1)
 same => n,Hangup()
 same => n(p2),Set(R=${CURL(${IVR_URL}&call=${IVR_CALL}&digit=2)})
 same => n,Playback(custom/doktorumol/reply_2)
 same => n,Hangup()
; ===== doktorumol-ivr BITIS =====
CTX;
  $cur = (string)@file_get_contents($CUSTOM);
  $cur = preg_replace('/; ===== doktorumol-ivr BASLANGIC.*?; ===== doktorumol-ivr BITIS =====\n?/s', '', $cur);
  if (@file_put_contents($CUSTOM, rtrim($cur) . "\n\n" . $ctx . "\n") === false) out(['success' => false, 'error' => 'extensions_custom.conf yazılamadı'], 500);
  ast('dialplan reload');
  $ok = strpos(ast('dialplan show doktorumol-ivr'), 'doktorumol-ivr') !== false;
  out(['success' => $ok, 'error' => $ok ? null : 'Arama akışı santrale yüklenemedi']);
}

if ($action === 'status') out(['success' => true, 'active' => active_count(), 'pending' => pending_count()]);

if ($action === 'call') {
  $num  = preg_replace('/\D/', '', (string)($in['number'] ?? ''));
  $pre  = preg_replace('/\D/', '', (string)($in['prefix'] ?? ''));
  $area = (string)($in['area'] ?? '');
  $cid  = (string)($in['call_id'] ?? '');
  $url  = (string)($in['webhook'] ?? '');
  if (!preg_match('/^05\d{9}$/', $num) || !preg_match('/^\d{0,3}$/', $pre) || !preg_match('/^[a-z]{2,20}$/', $area)
      || !preg_match('/^[0-9a-f-]{36}$/', $cid) || !preg_match('#^https://[a-z0-9.-]+\.supabase\.co/functions/v1/lead-ivr-webhook\?[A-Za-z0-9=&_-]+$#', $url)) {
    out(['success' => false, 'error' => 'Geçersiz arama bilgisi'], 400);
  }
  $wait = max(20, min(60, (int)($in['ring_seconds'] ?? 40)));
  $body = "Channel: Local/{$pre}{$num}@from-internal\nMaxRetries: 0\nWaitTime: {$wait}\n"
        . "Context: doktorumol-ivr\nExtension: s\nPriority: 1\n"
        . "Setvar: IVR_AREA={$area}\nSetvar: IVR_CALL={$cid}\nSetvar: IVR_URL={$url}\n";
  if (!is_dir($TMP)) @mkdir($TMP, 0775, true);
  $tmp = "$TMP/doktorumol-$cid.call";
  if (@file_put_contents($tmp, $body) === false || !@rename($tmp, "$SPOOL/doktorumol-$cid.call")) {
    out(['success' => false, 'error' => 'Arama dosyası santrale yazılamadı'], 500);
  }
  out(['success' => true]);
}

if ($action === 'stop') {
  foreach (glob($SPOOL . '/doktorumol-*.call') ?: [] as $f) @unlink($f);
  foreach (explode("\n", ast('core show channels concise')) as $l) {
    if (strpos($l, 'doktorumol-ivr') === false) continue;
    $ch = explode('!', $l)[0];
    if ($ch !== '') ast('channel request hangup ' . $ch);
  }
  out(['success' => true]);
}

out(['success' => false, 'error' => 'Geçersiz işlem'], 400);
