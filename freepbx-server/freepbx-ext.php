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

  // FreePBX/CDR DB kimlik bilgilerini mümkün olan tüm standart dosyalardan al.
  // Önceki sürüm sadece tek tırnaklı /etc/freepbx.conf formatını okuyordu;
  // okunamazsa root'a düşüyordu ve "Access denied for user root" hatası veriyordu.
  $dbhost = 'localhost'; $dbuser = ''; $dbpass = ''; $cdrdb = 'asteriskcdrdb';
  $credentialSources = [];

  // Geçerli tanımlayıcı (db adı / kullanıcı / host) kontrolü.
  // Config dosyasındaki yorum/placeholder satırları (ör. "# Remote CDR DB Password")
  // yanlışlıkla db adı olarak okunmasın diye boşluk/# içeren değerleri reddeder.
  $validIdent = function($v) {
    $v = trim((string)$v);
    if ($v === '') return false;
    if ($v[0] === '#' || $v[0] === ';') return false;        // yorum satırı
    return (bool)preg_match('/^[A-Za-z0-9_.\-]+$/', $v);       // boşluk/garip karakter yok
  };

  $readAmpValue = function($content, $key) {
    $quotedKey = preg_quote($key, '/');
    if (preg_match('/\[\s*[\'\"]' . $quotedKey . '[\'\"]\s*\]\s*=\s*[\'\"]([^\'\"]*)[\'\"]/m', $content, $m)) {
      return $m[1];
    }
    if (preg_match('/^\s*' . $quotedKey . '\s*=\s*[\'\"]?([^\'\"\r\n;#]+)[\'\"]?/m', $content, $m)) {
      return trim($m[1]);
    }
    return null;
  };

  foreach (['/etc/freepbx.conf', '/etc/amportal.conf'] as $confFile) {
    $conf = @file_get_contents($confFile);
    if ($conf === false) continue;

    $credentialSources[] = $confFile;
    $v = $readAmpValue($conf, 'AMPDBHOST'); if ($validIdent($v)) $dbhost = $v;
    $v = $readAmpValue($conf, 'AMPDBUSER'); if ($validIdent($v)) $dbuser = $v;
    $v = $readAmpValue($conf, 'AMPDBPASS'); if ($v !== null) $dbpass = $v;
    $v = $readAmpValue($conf, 'CDRDBNAME'); if ($validIdent($v)) $cdrdb = $v;
  }

  // Bazı FreePBX kurulumlarında CDR bilgisi ayrı dosyada olur.
  $cdrConf = @file_get_contents('/etc/asterisk/cdr_mysql.conf');
  if ($cdrConf !== false) {
    $credentialSources[] = '/etc/asterisk/cdr_mysql.conf';
    $ini = @parse_ini_string($cdrConf, true, INI_SCANNER_RAW);
    $section = is_array($ini) ? ($ini['global'] ?? $ini) : [];
    if (is_array($section)) {
      if ($validIdent($section['hostname'] ?? null)) $dbhost = $section['hostname'];
      if ($validIdent($section['host'] ?? null)) $dbhost = $section['host'];
      if ($validIdent($section['user'] ?? null)) $dbuser = $section['user'];
      if ($validIdent($section['username'] ?? null)) $dbuser = $section['username'];
      if (array_key_exists('password', $section)) $dbpass = (string)$section['password'];
      if ($validIdent($section['dbname'] ?? null)) $cdrdb = $section['dbname'];
      if ($validIdent($section['database'] ?? null)) $cdrdb = $section['database'];
    }
  }

  // Son güvenlik: db adı geçerli değilse FreePBX varsayılanına dön.
  if (!$validIdent($cdrdb)) $cdrdb = 'asteriskcdrdb';

  if ($dbuser === '') {
    json_response([
      'success' => false,
      'error' => 'FreePBX CDR veritabanı kullanıcı bilgisi okunamadı.',
      'detail' => 'PHP kullanıcısı /etc/freepbx.conf veya /etc/asterisk/cdr_mysql.conf dosyasını okuyamıyor olabilir.',
      'sources' => $credentialSources,
    ], 500);
  }

  // PHP 8.1+ varsayılan olarak mysqli hatalarını exception fırlatır -> fatal hata olur.
  // Kapatıp connect_errno ile kontrol ediyoruz.
  if (function_exists('mysqli_report')) { mysqli_report(MYSQLI_REPORT_OFF); }

  if (!class_exists('mysqli')) {
    json_response(['success' => false, 'error' => 'PHP mysqli eklentisi sunucuda yüklü değil.'], 500);
  }

  $mysqli = @new mysqli($dbhost, $dbuser, $dbpass, $cdrdb);
  if ($mysqli->connect_errno) {
    json_response([
      'success' => false,
      'error' => 'CDR veritabanına bağlanılamadı (' . $mysqli->connect_errno . '): ' . $mysqli->connect_error
        . ' | host=' . $dbhost . ' user=' . $dbuser . ' db=' . $cdrdb,
      'detail' => 'Okunan kaynaklar: ' . (empty($credentialSources) ? 'hiçbiri' : implode(', ', $credentialSources)),
    ], 500);
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

  // ----------------------------------------------------------------
  // GERÇEK ÇAĞRI BAZLI GÖRÜNÜM
  // CDR tablosunda bir gerçek çağrı (IVR->kuyruk->dahili) birden fazla
  // satır (leg) üretir. Çağrı sayılarını doğru hesaplamak için satırları
  // `linkedid` ile tekilleştiriyoruz. Her çağrı için ilk leg (en küçük
  // sequence) temsilci satır kabul edilir; yön onun src/dst'sinden,
  // cevaplanma ise tüm leg'lerden (herhangi biri ANSWERED ise) belirlenir.
  // ----------------------------------------------------------------
  $callBase = "(
    SELECT rep.src, rep.dst,
           agg.answered, agg.busy, agg.noanswer, agg.failed,
           agg.billsec, agg.firstdate
    FROM (
      SELECT linkedid,
             MIN(sequence) firstseq,
             MAX(disposition='ANSWERED') answered,
             MAX(disposition='BUSY') busy,
             MAX(disposition='NO ANSWER') noanswer,
             MAX(disposition='FAILED') failed,
             SUM(billsec) billsec,
             MIN(calldate) firstdate
      FROM cdr WHERE $where GROUP BY linkedid
    ) agg
    JOIN cdr rep ON rep.linkedid = agg.linkedid AND rep.sequence = agg.firstseq
  ) calls";

  // Yön sınıflandırması (temsilci satıra göre):
  // gelen  = dış numara aradı (src dış) -> DID'e düşse bile sayılır
  // giden  = içeriden dış numara arandı
  // dahili = her iki taraf da iç dahili
  $isOut = "($isIntSrc AND $isExtDst)";
  $isIn  = "($isExtSrc AND NOT ($isIntSrc AND $isExtDst))";
  $isInt = "($isIntSrc AND $isIntDst)";

  // Genel özet (çağrı bazlı, tekilleştirilmiş)
  $sum = $q("SELECT
      COUNT(*) total,
      SUM(answered) answered,
      SUM(answered=0 AND busy=1) busy,
      SUM(answered=0 AND busy=0 AND noanswer=1) no_answer,
      SUM(answered=0 AND busy=0 AND noanswer=0 AND failed=1) failed,
      SUM(billsec) total_billsec,
      SUM($isOut) outbound,
      SUM($isIn) inbound,
      SUM($isInt) internal_calls,
      COUNT(DISTINCT CASE WHEN $isOut THEN dst END) outbound_people,
      COUNT(DISTINCT CASE WHEN $isIn THEN src END) inbound_people,
      COUNT(DISTINCT CASE WHEN answered=1 AND $isExtSrc THEN src
                          WHEN answered=1 AND $isExtDst THEN dst END) talked_people
    FROM $callBase")[0] ?? [];

  // Günlük kırılım (çağrı bazlı, tekilleştirilmiş)
  $daily = $q("SELECT DATE(firstdate) gun,
      COUNT(*) toplam,
      SUM(answered) cevaplanan,
      ROUND(SUM(billsec)/60) dakika,
      SUM($isOut) giden,
      SUM($isIn) gelen
    FROM $callBase GROUP BY DATE(firstdate) ORDER BY gun");

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

  // Danışan yönlendirmeleri (transferler):
  // Bir dış numara (danışan) ile bir iç dahili (uzman) birbirine bağlandığında.
  // musteri = dış numara, uzman_ext = iç dahili, sure = görüşme saniyesi,
  // acti = uzman telefonu açtı mı (ANSWERED ve billsec>0).
  $transfers = $q("SELECT calldate,
      (CASE WHEN $isExtSrc AND $isIntDst THEN src ELSE dst END) musteri,
      (CASE WHEN $isExtSrc AND $isIntDst THEN dst ELSE src END) uzman_ext,
      billsec sure,
      disposition,
      (disposition='ANSWERED' AND billsec > 0) acti,
      (CASE WHEN $isIntSrc AND $isExtDst THEN 'cikis' ELSE 'transfer' END) yon
    FROM cdr
    WHERE $where AND (($isExtSrc AND $isIntDst) OR ($isIntSrc AND $isExtDst))
    ORDER BY calldate DESC LIMIT 300");

  $mysqli->close();
  json_response([
    'success' => true,
    'from' => $from,
    'to' => $to,
    'summary' => $sum,
    'daily' => $daily,
    'by_extension' => $byExt,
    'recent' => $recent,
    'transfers' => $transfers,
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
