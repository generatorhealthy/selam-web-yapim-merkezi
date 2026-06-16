<?php
/**
 * FreePBX sanal (virtual) dahili oluşturma yardımcısı.
 *
 * Bu dosyayı FreePBX sunucusunun web kök dizinine koyun (BirFatura proxy gibi),
 * örn: /var/www/html/freepbx-ext.php  ->  https://SUNUCU/freepbx-ext.php
 *
 * Edge function (freepbx-create-extension) bu adrese POST atar; biz de
 * `fwconsole bulkimport` ile GERÇEK virtual dahiliyi + follow-me'yi otomatik kurarız.
 *
 * KURULUM:
 * 1) Bu dosyayı web kök dizinine kopyalayın.
 * 2) Aşağıdaki $SECRET değerini uzun rastgele bir değerle değiştirin
 *    (aynı değeri Lovable'da FREEPBX_BULK_SECRET secret'ına girin).
 * 3) Web sunucusu kullanıcısının fwconsole'u şifresiz çalıştırabilmesi için
 *    sudoers izni ekleyin (web kullanıcısı genelde "asterisk"):
 *
 *      visudo -f /etc/sudoers.d/freepbx-ext
 *      # içerik:
 *      asterisk ALL=(ALL) NOPASSWD: /usr/sbin/fwconsole
 *
 *    (Apache kullanıcısı farklıysa -ör. apache/www-data- onu yazın.
 *     Kontrol: `ps aux | grep -E 'httpd|apache|php-fpm' | head`)
 */

// Hata olsa bile curl/Lovable tarafına boş cevap dönmemesi için.
@set_time_limit(0);
@ini_set('max_execution_time', '0');
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
@ignore_user_abort(true);
header('Content-Type: application/json; charset=utf-8');

$__responded = false;

function json_response($data, $status = 200) {
  global $__responded;
  $__responded = true;
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

register_shutdown_function(function () {
  global $__responded;
  if ($__responded) {
    return;
  }

  $err = error_get_last();
  if ($err) {
    http_response_code(500);
    echo json_encode([
      'success' => false,
      'error' => 'PHP fatal hata',
      'detail' => $err['message'] ?? 'bilinmeyen hata',
      'file' => $err['file'] ?? null,
      'line' => $err['line'] ?? null,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return;
  }

  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error' => 'PHP boş cevap verdi; işlem tamamlanmadan çıktı üretilemedi',
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
});

// ====== AYAR ======
$SECRET = '1b849165041c774396da0fc92c8fa4c10af3e84d6d0da6d3';
$FWCONSOLE = '/usr/sbin/fwconsole'; // gerekirse `which fwconsole` ile doğrulayın
// ==================

$raw = file_get_contents('php://input');
$in  = json_decode($raw, true);
if (!is_array($in)) {
  $in = $_POST;
}

if (!hash_equals($SECRET, (string)($in['secret'] ?? ''))) {
  json_response(['success' => false, 'error' => 'unauthorized'], 401);
}

$action   = $in['action'] ?? 'create';

/* ============================================================
 * CDR İSTATİSTİKLERİ  (action = cdr_stats)
 * asteriskcdrdb.cdr tablosundan çağrı raporlarını döner.
 * extension gerektirmez; bu yüzden aşağıdaki ext kontrolünden önce çalışır.
 * ============================================================ */
if ($action === 'cdr_stats') {
  $from = preg_replace('/[^0-9\- :]/', '', (string)($in['from'] ?? ''));
  $to   = preg_replace('/[^0-9\- :]/', '', (string)($in['to'] ?? ''));
  if ($from === '') { $from = date('Y-m-d', strtotime('-13 days')) . ' 00:00:00'; }
  elseif (strlen($from) <= 10) { $from .= ' 00:00:00'; }
  if ($to === '') { $to = date('Y-m-d') . ' 23:59:59'; }
  elseif (strlen($to) <= 10) { $to .= ' 23:59:59'; }

  // FreePBX DB kimlik bilgilerini /etc/freepbx.conf'tan al
  $dbhost = 'localhost'; $dbuser = 'root'; $dbpass = ''; $cdrdb = 'asteriskcdrdb';
  $conf = @file_get_contents('/etc/freepbx.conf');
  if ($conf !== false) {
    if (preg_match("/AMPDBHOST'\s*\]\s*=\s*'([^']*)'/", $conf, $m)) $dbhost = $m[1];
    if (preg_match("/AMPDBUSER'\s*\]\s*=\s*'([^']*)'/", $conf, $m)) $dbuser = $m[1];
    if (preg_match("/AMPDBPASS'\s*\]\s*=\s*'([^']*)'/", $conf, $m)) $dbpass = $m[1];
    if (preg_match("/CDRDBNAME'\s*\]\s*=\s*'([^']*)'/", $conf, $m)) $cdrdb = $m[1];
  }

  $mysqli = @new mysqli($dbhost, $dbuser, $dbpass, $cdrdb);
  if ($mysqli->connect_errno) {
    json_response(['success' => false, 'error' => 'CDR veritabanına bağlanılamadı: ' . $mysqli->connect_error], 500);
  }
  $mysqli->set_charset('utf8mb4');

  $fromQ = $mysqli->real_escape_string($from);
  $toQ   = $mysqli->real_escape_string($to);
  $where = "calldate BETWEEN '$fromQ' AND '$toQ'";

  // İç dahili: 3-4 haneli numara. Dış numara: 7+ hane.
  $isIntSrc = "src REGEXP '^[0-9]{3,4}$'";
  $isIntDst = "dst REGEXP '^[0-9]{3,4}$'";
  $isExtSrc = "src REGEXP '^[0-9]{7,}$'";
  $isExtDst = "dst REGEXP '^[0-9]{7,}$'";

  $stats = [];
  $q = function($sql) use ($mysqli) {
    $r = $mysqli->query($sql);
    if (!$r) return [];
    $rows = [];
    while ($row = $r->fetch_assoc()) $rows[] = $row;
    $r->free();
    return $rows;
  };

  // Genel özet
  $sum = $q("SELECT
      COUNT(*) total,
      SUM(disposition='ANSWERED') answered,
      SUM(disposition='NO ANSWER') no_answer,
      SUM(disposition='BUSY') busy,
      SUM(disposition='FAILED') failed,
      SUM(billsec) total_billsec,
      SUM($isIntSrc AND $isExtDst) outbound,
      SUM($isExtSrc AND $isIntDst) inbound,
      SUM($isIntSrc AND $isIntDst) internal_calls,
      COUNT(DISTINCT CASE WHEN ($isIntSrc AND $isExtDst) THEN dst END) outbound_people,
      COUNT(DISTINCT CASE WHEN ($isExtSrc AND $isIntDst) THEN src END) inbound_people,
      COUNT(DISTINCT CASE WHEN disposition='ANSWERED' AND $isExtDst THEN dst
                          WHEN disposition='ANSWERED' AND $isExtSrc THEN src END) talked_people
    FROM cdr WHERE $where")[0] ?? [];

  // Günlük kırılım
  $daily = $q("SELECT DATE(calldate) gun,
      COUNT(*) toplam,
      SUM(disposition='ANSWERED') cevaplanan,
      ROUND(SUM(billsec)/60) dakika,
      SUM($isIntSrc AND $isExtDst) giden,
      SUM($isExtSrc AND $isIntDst) gelen
    FROM cdr WHERE $where GROUP BY DATE(calldate) ORDER BY gun");

  // Dahili (uzman) bazlı kırılım
  $byExt = $q("SELECT ext, SUM(toplam) toplam, SUM(giden) giden, SUM(gelen) gelen,
      SUM(cevaplanan) cevaplanan, ROUND(SUM(saniye)/60) dakika
    FROM (
      SELECT src ext, 1 toplam, ($isExtDst) giden, 0 gelen,
             (disposition='ANSWERED') cevaplanan, billsec saniye
      FROM cdr WHERE $where AND $isIntSrc
      UNION ALL
      SELECT dst ext, 1 toplam, 0 giden, ($isExtSrc) gelen,
             (disposition='ANSWERED') cevaplanan, billsec saniye
      FROM cdr WHERE $where AND $isIntDst
    ) t GROUP BY ext ORDER BY toplam DESC LIMIT 200");

  // Son çağrılar
  $recent = $q("SELECT calldate, src, dst, duration, billsec, disposition,
      (CASE WHEN $isIntSrc AND $isExtDst THEN 'giden'
            WHEN $isExtSrc AND $isIntDst THEN 'gelen'
            WHEN $isIntSrc AND $isIntDst THEN 'dahili' ELSE 'diger' END) yon
    FROM cdr WHERE $where ORDER BY calldate DESC LIMIT 100");

  $mysqli->close();
  json_response([
    'success' => true,
    'from' => $from,
    'to' => $to,
    'summary' => $sum,
    'daily' => $daily,
    'by_extension' => $byExt,
    'recent' => $recent,
  ]);
}

$ext      = preg_replace('/\D/', '', (string)($in['extension'] ?? ''));
$name     = trim((string)($in['name'] ?? ''));
$followme = preg_replace('/[^0-9#]/', '', (string)($in['followme'] ?? ''));

if ($ext === '') {
  json_response(['success' => false, 'error' => 'extension gerekli'], 400);
}

function csv_field($v) {
  $v = str_replace('"', '""', (string)$v);
  return (strpbrk($v, ",\"\n") !== false) ? '"' . $v . '"' : $v;
}

// CSV oluştur
$header = "extension,name,description,tech,secret,findmefollow_enabled,findmefollow_strategy,findmefollow_grplist,findmefollow_grptime,voicemail_enable,voicemail_vmpwd\n";
$fmEnabled = $followme !== '' ? 'CHECKED' : '';
$row = implode(',', [
  $ext,
  csv_field($name !== '' ? $name : $ext),
  csv_field('Otomatik olusturuldu'),
  'virtual',
  '',                 // secret (virtual'da gerekmez)
  $fmEnabled,         // findmefollow_enabled
  'ringallv2-prim',   // findmefollow_strategy
  $followme,          // findmefollow_grplist (0XXXXXXXXXX#)
  '25',               // findmefollow_grptime
  '',                 // voicemail_enable
  '',                 // voicemail_vmpwd
]) . "\n";

$file = tempnam(sys_get_temp_dir(), 'ext_');
if ($file === false) {
  json_response(['success' => false, 'error' => 'geçici dosya oluşturulamadı'], 500);
}

$csvFile = $file . '.csv';
if (!@rename($file, $csvFile)) {
  $csvFile = $file;
}

$written = file_put_contents($csvFile, $header . $row);
if ($written === false) {
  json_response(['success' => false, 'error' => 'CSV dosyası yazılamadı', 'path' => $csvFile], 500);
}

if (!is_executable($FWCONSOLE)) {
  @unlink($csvFile);
  json_response(['success' => false, 'error' => 'fwconsole bulunamadı veya çalıştırılamıyor', 'path' => $FWCONSOLE], 500);
}

$importCmd = 'sudo ' . escapeshellarg($FWCONSOLE) . ' bulkimport --type=extensions --replace -- ' . escapeshellarg($csvFile) . ' 2>&1';

// bulkimport'u çalıştır (dahiliyi oluşturur)
$importOut = shell_exec($importCmd);

if ($importOut === null) {
  @unlink($csvFile);
  json_response([
    'success' => false,
    'error' => 'bulkimport komutu çıktı döndürmedi; shell_exec kapalı olabilir veya sudo izni eksik olabilir',
    'command' => $importCmd,
  ], 500);
}

@unlink($csvFile);

// reload çok yavaş; arka planda çalıştır ki yanıt hemen dönsün (edge timeout olmasın)
$reloadCmd = 'sudo ' . escapeshellarg($FWCONSOLE) . ' reload > /dev/null 2>&1 &';
shell_exec($reloadCmd);

$importLower = strtolower((string)$importOut);
$ok = (strpos($importLower, 'error') === false) && (strpos($importLower, 'exception') === false);

json_response([
  'success'   => $ok,
  'extension' => $ext,
  'followme'  => $followme,
  'import'    => trim((string)$importOut),
  'reload'    => 'arka planda baslatildi',
], $ok ? 200 : 500);
