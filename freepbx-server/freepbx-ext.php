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

  // Aynı gerçek çağrının başka bir bacağında (leg) kayıt dosyası olabilir.
  // Örn. danışan DID'e düşer, sonra dahiliye transfer olur; kayıt ilk bacakta olur.
  // Bu yüzden recordingfile boşsa linkedid üzerinden kardeş bacaklara bakıyoruz.
  $recFallback = "COALESCE(NULLIF(cdr.recordingfile, ''),
      (SELECT c2.recordingfile FROM cdr c2
        WHERE c2.linkedid = cdr.linkedid AND c2.recordingfile <> ''
        ORDER BY c2.sequence ASC LIMIT 1)) recordingfile";

  // Son çağrılar
  $recent = $q("SELECT calldate, src, dst, duration, billsec, disposition, $recFallback,
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
      uniqueid,
      linkedid,
      $recFallback,

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

/* ============================================================
 * ÇAĞRI KAYDI DOSYASI  (action = recording_file)
 *
 * CDR'daki recordingfile alanındaki dosya adını alır, kayıt
 * klasöründe bulur ve base64 olarak döner. Divan Paneli'ndeki
 * "Dinle" butonu bu action'ı kullanır.
 *
 * Parametreler:
 *   file (zorunlu): CDR recordingfile değeri (sadece dosya adı kullanılır)
 *   date (opsiyonel): çağrı tarihi (Y-m-d) -> doğru klasöre hızlı erişim
 * ============================================================ */
if ($action === 'recording_file') {
  $MONITOR = '/var/spool/asterisk/monitor';
  $raw = (string)($in['file'] ?? '');
  $file = basename(str_replace('\\', '/', $raw));

  // Güvenlik: sadece bilinen ses dosyası adları
  if ($file === '' || !preg_match('/^[A-Za-z0-9._\-]+\.(wav|WAV|gsm|ulaw|alaw|sln|mp3|ogg|g722)$/', $file)) {
    json_response(['success' => false, 'error' => 'Geçersiz kayıt dosyası adı'], 400);
  }

  $candidates = [];

  // 1) Verilen tarihe göre doğrudan klasör
  $date = (string)($in['date'] ?? '');
  if ($date !== '' && ($ts = strtotime($date)) !== false) {
    $candidates[] = $MONITOR . '/' . date('Y/m/d', $ts) . '/' . $file;
    $candidates[] = $MONITOR . '/' . date('Y/m/d', $ts - 86400) . '/' . $file;
    $candidates[] = $MONITOR . '/' . date('Y/m/d', $ts + 86400) . '/' . $file;
  }

  // 2) Dosya adının içindeki tarih damgası (ör. ...-20260903-150102-...)
  if (preg_match('/(20\d{2})(\d{2})(\d{2})/', $file, $m)) {
    $candidates[] = $MONITOR . '/' . $m[1] . '/' . $m[2] . '/' . $m[3] . '/' . $file;
  }

  // 3) Kök klasör (bazı kurulumlar tarih klasörü kullanmaz)
  $candidates[] = $MONITOR . '/' . $file;

  $path = null;
  foreach ($candidates as $c) {
    if (is_file($c) && is_readable($c)) { $path = $c; break; }
  }

  // 4) Son çare: son 90 günün klasörlerinde ara (sınırlı tarama)
  if ($path === null) {
    for ($i = 0; $i < 90; $i++) {
      $c = $MONITOR . '/' . date('Y/m/d', time() - $i * 86400) . '/' . $file;
      if (is_file($c) && is_readable($c)) { $path = $c; break; }
    }
  }

  if ($path === null) {
    json_response([
      'success' => false,
      'error' => 'Kayıt dosyası sunucuda bulunamadı',
      'detail' => 'Çağrı kaydı bu çağrı için oluşturulmamış veya dosya silinmiş olabilir.',
      'file' => $file,
    ], 404);
  }

  // Kayıt klasörü dışına çıkılmadığını doğrula
  $realPath = realpath($path);
  $realRoot = realpath($MONITOR);
  if ($realPath === false || $realRoot === false || strpos($realPath, $realRoot) !== 0) {
    json_response(['success' => false, 'error' => 'Erişim reddedildi'], 403);
  }

  $size = filesize($realPath);
  if ($size === false || $size <= 0) {
    json_response(['success' => false, 'error' => 'Kayıt dosyası boş'], 404);
  }
  if ($size > 25 * 1024 * 1024) {
    json_response(['success' => false, 'error' => 'Kayıt dosyası çok büyük (25MB üzeri)'], 413);
  }

  $ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
  $mimeMap = [
    'wav' => 'audio/wav', 'mp3' => 'audio/mpeg', 'ogg' => 'audio/ogg',
    'gsm' => 'audio/gsm', 'ulaw' => 'audio/basic', 'alaw' => 'audio/basic',
    'sln' => 'application/octet-stream', 'g722' => 'audio/G722',
  ];

  $bytes = @file_get_contents($realPath);
  if ($bytes === false) {
    json_response(['success' => false, 'error' => 'Kayıt dosyası okunamadı (izin)'], 500);
  }

  json_response([
    'success' => true,
    'file' => $file,
    'size' => $size,
    'mime' => $mimeMap[$ext] ?? 'application/octet-stream',
    'base64' => base64_encode($bytes),
  ]);
}



/* ============================================================
 * ÇAĞRI KAYDI AÇMA  (action = bulk_recording / enable_recording)
 *
 * AstDB'de her dahili için recording policy'yi yazar:
 *   AMPUSER/<dahili>/recording/{in,out}/{external,internal}
 * Dialplan (sub-record-check) bu anahtarları çağrı anında okur;
 * fwconsole reload GEREKMEZ, değişiklik sonraki çağrıda etkin olur.
 *
 * Kayıtlar /var/spool/asterisk/monitor/YYYY/MM/DD/ altına yazılır
 * ve CDR'daki recordingfile alanı dolar.
 *
 * Parametreler:
 *   extension (opsiyonel): tek dahili; verilmezse TÜM dahililer
 *   mode (opsiyonel): force|yes|dontcare|no|never (varsayılan force)
 *   check (opsiyonel): true ise mevcut kayıt durumunu okur (yazmaz)
 * ============================================================ */
/* ============================================================
 * KALICI ÇAĞRI KAYDI  (action = recording_setup)
 *
 * AstDB'ye yazılan kayıt politikaları `fwconsole reload` sırasında
 * FreePBX veritabanından yeniden üretilir; bu yüzden AstDB'ye yazmak
 * kalıcı değildir. Bu action politikayı doğrudan FreePBX MySQL
 * veritabanına (users + gelen yönlendirmeler) yazar ve reload eder.
 * Böylece hem uzmana transfer edilen bacak hem de bizim danışanla
 * yaptığımız görüşme kaydedilir ve reload sonrası da kalıcı olur.
 * ============================================================ */
if ($action === 'recording_setup') {
  $mode = strtolower(preg_replace('/[^a-z]/i', '', (string)($in['mode'] ?? 'force')));
  if (!in_array($mode, ['force', 'yes', 'dontcare', 'no', 'never'], true)) $mode = 'force';

  $readVal = function($content, $key) {
    $qk = preg_quote($key, '/');
    if (preg_match('/\[\s*[\'\"]' . $qk . '[\'\"]\s*\]\s*=\s*[\'\"]([^\'\"]*)[\'\"]/m', $content, $m)) return $m[1];
    if (preg_match('/^\s*' . $qk . '\s*=\s*[\'\"]?([^\'\"\r\n;#]+)[\'\"]?/m', $content, $m)) return trim($m[1]);
    return null;
  };

  $dbhost = 'localhost'; $dbuser = ''; $dbpass = ''; $dbname = 'asterisk';
  foreach (['/etc/freepbx.conf', '/etc/amportal.conf'] as $confFile) {
    $conf = @file_get_contents($confFile);
    if ($conf === false) continue;
    $v = $readVal($conf, 'AMPDBHOST'); if ($v) $dbhost = $v;
    $v = $readVal($conf, 'AMPDBUSER'); if ($v) $dbuser = $v;
    $v = $readVal($conf, 'AMPDBPASS'); if ($v !== null) $dbpass = $v;
    $v = $readVal($conf, 'AMPDBNAME'); if ($v) $dbname = $v;
  }
  if ($dbuser === '') {
    json_response(['success' => false, 'error' => 'FreePBX veritabanı bilgisi okunamadı'], 500);
  }
  if (function_exists('mysqli_report')) { mysqli_report(MYSQLI_REPORT_OFF); }
  $db = @new mysqli($dbhost, $dbuser, $dbpass, $dbname);
  if ($db->connect_errno) {
    json_response(['success' => false, 'error' => 'FreePBX veritabanına bağlanılamadı: ' . $db->connect_error], 500);
  }
  $db->set_charset('utf8mb4');

  $cols = function($table) use ($db) {
    $out = [];
    $r = $db->query("SHOW COLUMNS FROM `$table`");
    if ($r) { while ($row = $r->fetch_assoc()) $out[] = $row['Field']; $r->free(); }
    return $out;
  };

  $applied = [];
  $errors = [];

  // 1) Dahililer: Bu FreePBX sürümünde ayrıntılı kayıt politikaları SQL'de
  // recording_* kolonlarında değil, kalıcı Asterisk AstDB AMPUSER ağacında
  // tutulur. users.recording eski/genel bir alandır; dört yön politikasının
  // yerine geçmez. Tüm dahilileri alıp gerçek kaynak olan AstDB'ye yaz.
  $userCols = $cols('users');
  $extensions = [];
  $extResult = $db->query("SELECT extension FROM users WHERE extension REGEXP '^[0-9]{3,4}$'");
  if ($extResult) {
    while ($row = $extResult->fetch_assoc()) $extensions[] = $row['extension'];
    $extResult->free();
  } else {
    $errors[] = 'Dahili listesi okunamadı: ' . $db->error;
  }

  if (!empty($extensions) && is_executable($FWCONSOLE)) {
    $safeMode = $mode;
    $extList = implode(' ', array_map('intval', $extensions));
    $script = '/tmp/setup_recording_' . date('Ymd_His') . '.sh';
    $scriptContent = "#!/bin/bash\n"
      . "LOG=/tmp/setup_recording.log\n"
      . ": > \$LOG\n"
      . "for e in {$extList}; do\n"
      . "  for p in in/external out/external in/internal out/internal; do\n"
      . "    sudo " . escapeshellarg($FWCONSOLE) . " asterisk -rx \"database put AMPUSER \${e}/recording/\${p} {$safeMode}\" >> \$LOG 2>&1\n"
      . "  done\n"
      . "  sudo " . escapeshellarg($FWCONSOLE) . " asterisk -rx \"database put AMPUSER \${e}/recording/priority 15\" >> \$LOG 2>&1\n"
      . "done\n"
      . "echo 'RECORDING_SETUP_DONE' >> \$LOG\n";
    if (@file_put_contents($script, $scriptContent) === false) {
      $errors[] = 'Kayıt ayarı komut dosyası oluşturulamadı';
    } else {
      @chmod($script, 0755);
      shell_exec('nohup bash ' . escapeshellarg($script) . ' > /dev/null 2>&1 &');
      $applied['extensions_updated'] = count($extensions);
      $applied['storage'] = 'Asterisk AstDB AMPUSER';
      $applied['log'] = '/tmp/setup_recording.log';
    }
  } elseif (empty($extensions) && empty($errors)) {
    $errors[] = 'Kayıt açılacak dahili bulunamadı';
  } elseif (!is_executable($FWCONSOLE)) {
    $errors[] = 'fwconsole bulunamadı veya çalıştırılamıyor';
  }

  // 2) Gelen yönlendirmeler (incoming tablosu): danışan bize aradığında
  //    yapılan görüşmenin de kaydedilmesi için.
  $incCols = $cols('incoming');
  $incRec = array_values(array_filter($incCols, function ($c) {
    return stripos($c, 'record') !== false;
  }));
  if (!empty($incRec)) {
    $sets = [];
    foreach ($incRec as $c) $sets[] = "`$c` = '" . $db->real_escape_string($mode) . "'";
    if ($db->query("UPDATE `incoming` SET " . implode(', ', $sets))) {
      $applied['inbound_routes_updated'] = $db->affected_rows;
      $applied['inbound_columns'] = $incRec;
    } else {
      $errors[] = 'incoming güncellenemedi: ' . $db->error;
    }
  }

  $db->close();

  // 3) Değişikliğin canlı dialplan'a geçmesi için reload (arka planda).
  if (is_executable($FWCONSOLE)) {
    @shell_exec('sudo ' . escapeshellarg($FWCONSOLE) . ' reload > /tmp/freepbx-recording-reload.log 2>&1 &');
    $applied['reload'] = 'başlatıldı';
  }

  // 4) Kayıt klasörü durumu (bugün kaç dosya oluştu?)
  $monitor = '/var/spool/asterisk/monitor';
  $todayDir = $monitor . '/' . date('Y') . '/' . date('m') . '/' . date('d');
  $applied['monitor_dir'] = is_dir($monitor) ? $monitor : 'bulunamadı';
  $applied['today_dir'] = is_dir($todayDir) ? $todayDir : 'henüz oluşmadı';
  $applied['today_file_count'] = is_dir($todayDir) ? max(0, count(@scandir($todayDir) ?: []) - 2) : 0;
  $applied['monitor_writable'] = is_dir($monitor) ? is_writable($monitor) : false;

  json_response([
    'success' => empty($errors),
    'mode' => $mode,
    'applied' => $applied,
    'errors' => $errors,
    'note' => 'Kayıt yalnızca bu işlemden sonra yapılan çağrılar için oluşur.',
  ]);
}

if ($action === 'bulk_recording' || $action === 'enable_recording') {

  if (!is_executable($FWCONSOLE)) {
    json_response(['success' => false, 'error' => 'fwconsole bulunamadı veya çalıştırılamıyor'], 500);
  }

  $runAsterisk = function($command) use ($FWCONSOLE) {
    $cmd = 'sudo ' . escapeshellarg($FWCONSOLE) . ' asterisk -rx ' . escapeshellarg($command) . ' 2>&1';
    return trim((string)shell_exec($cmd));
  };

  // ---- Kontrol modu: mevcut kayıt politikalarını oku
  if (!empty($in['check'])) {
    $show = $runAsterisk('database show AMPUSER');
    $lines = explode("\n", $show);
    $policies = [];
    foreach ($lines as $line) {
      if (stripos($line, '/recording/in/external') === false && stripos($line, '/recording/out/external') === false) continue;
      if (preg_match('/AMPUSER\/(\d+)\/recording\/(in|out)\/external\s*:\s*(\S+)/i', $line, $m)) {
        $ext = $m[1]; $dir = $m[2]; $val = strtolower($m[3]);
        $policies[$ext] = $policies[$ext] ?? ['in' => '', 'out' => ''];
        $policies[$ext][$dir] = $val;
      }
    }
    json_response([
      'success' => true,
      'check' => true,
      'policies' => $policies,
      'recording_enabled_count' => count(array_filter($policies, function($p) { return $p['in'] === 'force' && $p['out'] === 'force'; })),
    ]);
  }

  $mode = preg_replace('/[^a-z]/', '', strtolower((string)($in['mode'] ?? 'force')));
  if (!in_array($mode, ['force', 'yes', 'dontcare', 'no', 'never'], true)) $mode = 'force';

  // Dahili listesi: parametre verilirse tek, yoksa users tablosundaki tüm dahililer
  $extensions = [];
  $oneExt = preg_replace('/[^0-9]/', '', (string)($in['extension'] ?? ''));
  if ($oneExt !== '') {
    $extensions[] = $oneExt;
  } else {
    // users tablosu FreePBX ana DB'sinde (asterisk); kimlik bilgilerini freepbx.conf'tan oku
    $dbhost = 'localhost'; $dbuser = ''; $dbpass = ''; $ampdb = 'asterisk';
    $conf = @file_get_contents('/etc/freepbx.conf');
    if ($conf === false) $conf = @file_get_contents('/etc/amportal.conf');
    if ($conf !== false) {
      $readVal = function($content, $key) {
        $qk = preg_quote($key, '/');
        if (preg_match('/\[\s*[\'"]' . $qk . '[\'"]\s*\]\s*=\s*[\'"]([^\'"]*)[\'"]/m', $content, $m)) return $m[1];
        if (preg_match('/^\s*' . $qk . '\s*=\s*[\'"]?([^\'"\r\n;#]+)[\'"]?/m', $content, $m)) return trim($m[1]);
        return null;
      };
      $v = $readVal($conf, 'AMPDBHOST'); if ($v) $dbhost = $v;
      $v = $readVal($conf, 'AMPDBUSER'); if ($v) $dbuser = $v;
      $v = $readVal($conf, 'AMPDBPASS'); if ($v !== null) $dbpass = $v;
      $v = $readVal($conf, 'AMPDBNAME'); if ($v) $ampdb = $v;
    }
    if (function_exists('mysqli_report')) { mysqli_report(MYSQLI_REPORT_OFF); }
    if (!class_exists('mysqli')) {
      json_response(['success' => false, 'error' => 'PHP mysqli eklentisi sunucuda yüklü değil.'], 500);
    }
    $mysqli = @new mysqli($dbhost, $dbuser, $dbpass, $ampdb);
    if ($mysqli->connect_errno) {
      json_response([
        'success' => false,
        'error' => 'FreePBX veritabanına bağlanılamadı (' . $mysqli->connect_errno . '): ' . $mysqli->connect_error,
      ], 500);
    }
    $res = $mysqli->query("SELECT extension FROM users WHERE extension REGEXP '^[0-9]{3,4}$'");
    if (!$res) {
      json_response(['success' => false, 'error' => 'Dahili listesi alınamadı: ' . $mysqli->error], 500);
    }
    while ($r = $res->fetch_assoc()) { $extensions[] = $r['extension']; }
    $mysqli->close();
  }

  if (empty($extensions)) {
    json_response(['success' => false, 'error' => 'Kayıt açılacak dahili bulunamadı.'], 500);
  }

  // Tüm dahililer için yazma işlemi uzayabilir (dahili sayısı x komut);
  // arka planda bash script olarak çalıştır, yanıt hemen dönsün.
  $safeMode = $mode;
  $extList = implode(' ', array_map('intval', $extensions));
  $script = '/tmp/enable_recording_' . date('Ymd_His') . '.sh';
  $scriptContent = "#!/bin/bash\n"
    . "LOG=/tmp/enable_recording.log\n"
    . ": > \$LOG\n"
    . "for e in {$extList}; do\n"
    . "  for p in in/external out/external in/internal out/internal; do\n"
    . "    echo -n \"AMPUSER \${e}/recording/\${p} = {$safeMode} -> \" >> \$LOG\n"
    . "    sudo " . escapeshellarg($FWCONSOLE) . " asterisk -rx \"database put AMPUSER \${e}/recording/\${p} {$safeMode}\" >> \$LOG 2>&1\n"
    . "  done\n"
    . "  echo -n \"AMPUSER \${e}/recording/priority = 15 -> \" >> \$LOG\n"
    . "  sudo " . escapeshellarg($FWCONSOLE) . " asterisk -rx \"database put AMPUSER \${e}/recording/priority 15\" >> \$LOG 2>&1\n"
    . "done\n"
    . "echo 'BULK_RECORDING_DONE' >> \$LOG\n";
  @file_put_contents($script, $scriptContent);
  @chmod($script, 0755);
  shell_exec('nohup bash ' . escapeshellarg($script) . ' > /dev/null 2>&1 &');

  json_response([
    'success' => true,
    'mode' => $mode,
    'extension_count' => count($extensions),
    'extensions' => count($extensions) <= 150 ? $extensions : array_slice($extensions, 0, 150),
    'log' => '/tmp/enable_recording.log',
    'note' => 'KAYIT AKTIF: islem arka planda basladi; sonraki cagrılardan itibaren kayit olur. Reload gerekmez.',
  ]);
}



/* ============================================================
 * ASTERISK / TRUNK TEŞHİSİ  (action = trunk_diagnostics)
 * Hassas yapılandırma döndürmeden trunk kayıtlarını, aktif kanalları ve
 * son çağrıların gerçek hangup nedenlerini okur.
 * ============================================================ */
if ($action === 'trunk_diagnostics') {
  if (!is_executable($FWCONSOLE)) {
    json_response(['success' => false, 'error' => 'fwconsole bulunamadı veya çalıştırılamıyor'], 500);
  }

  $runAsterisk = function($command) use ($FWCONSOLE) {
    $cmd = 'sudo ' . escapeshellarg($FWCONSOLE) . ' asterisk -rx ' . escapeshellarg($command) . ' 2>&1';
    return trim((string)shell_exec($cmd));
  };

  $channels = $runAsterisk('core show channels concise');
  $pjsip = $runAsterisk('pjsip show registrations');
  $sip = $runAsterisk('sip show registry');

  // Yalnızca trunk sağlığı için gerekli satırları döndür; URI ve olası
  // kullanıcı bilgilerini maskele.
  $sanitize = function($text) {
    $text = preg_replace('/sip:[^\s@]+@/i', 'sip:***@', (string)$text);
    $text = preg_replace('/\b(password|secret|username)\s*[=:]\s*\S+/i', '$1=***', $text);
    return substr($text, 0, 12000);
  };

  json_response([
    'success' => true,
    'checked_at' => date('c'),
    'pjsip_registrations' => $sanitize($pjsip),
    'sip_registry' => $sanitize($sip),
    'active_channels' => $sanitize($channels),
  ]);
}

/* ============================================================
 * TRUNK CID + OUTBOUND ROUTE SIRALAMA  (action = trunk_config)
 *
 * 1) FCT trunk'larına kendi yetkili numarasını "Force Trunk CID" olarak yazar
 *    (transfer bacağında 403 Forbidden - IP Not Authorized hatasını bitirir).
 * 2) 80/81 önekli giden rotalarda Verimor trunk'larını sıranın başına alır
 *    (FCT tek kanal olduğu için transfer sırasında meşgul dönüyordu).
 *
 * Beklenen gövde:
 *  {
 *    "action": "trunk_config",
 *    "trunk_cids": { "FCT0505": "905335822275", "FCT0606": "905317893880" },
 *    "prefer_trunks": ["Verimor0216", "Verimor0216_2"],
 *    "route_prefixes": ["80", "81"]
 *  }
 * ============================================================ */
if ($action === 'trunk_config') {
  if (function_exists('mysqli_report')) { mysqli_report(MYSQLI_REPORT_OFF); }
  if (!class_exists('mysqli')) {
    json_response(['success' => false, 'error' => 'PHP mysqli eklentisi sunucuda yüklü değil.'], 500);
  }

  // --- FreePBX ana veritabanı kimlik bilgileri ---
  $dbhost = 'localhost'; $dbuser = ''; $dbpass = ''; $dbname = 'asterisk';
  $readVal = function ($content, $key) {
    $k = preg_quote($key, '/');
    if (preg_match('/\[\s*[\'\"]' . $k . '[\'\"]\s*\]\s*=\s*[\'\"]([^\'\"]*)[\'\"]/m', $content, $m)) return $m[1];
    if (preg_match('/^\s*' . $k . '\s*=\s*[\'\"]?([^\'\"\r\n;#]+)[\'\"]?/m', $content, $m)) return trim($m[1]);
    return null;
  };
  $valid = function ($v) {
    $v = trim((string)$v);
    return $v !== '' && $v[0] !== '#' && $v[0] !== ';' && preg_match('/^[A-Za-z0-9_.\-]+$/', $v);
  };
  foreach (['/etc/freepbx.conf', '/etc/amportal.conf'] as $cf) {
    $c = @file_get_contents($cf);
    if ($c === false) continue;
    $v = $readVal($c, 'AMPDBHOST'); if ($valid($v)) $dbhost = $v;
    $v = $readVal($c, 'AMPDBUSER'); if ($valid($v)) $dbuser = $v;
    $v = $readVal($c, 'AMPDBPASS'); if ($v !== null) $dbpass = $v;
    $v = $readVal($c, 'AMPDBNAME'); if ($valid($v)) $dbname = $v;
  }
  if ($dbuser === '') {
    json_response(['success' => false, 'error' => 'FreePBX veritabanı kimlik bilgisi okunamadı (/etc/freepbx.conf).'], 500);
  }

  $db = @new mysqli($dbhost, $dbuser, $dbpass, $dbname);
  if ($db->connect_errno) {
    json_response(['success' => false, 'error' => 'FreePBX veritabanına bağlanılamadı: ' . $db->connect_error], 500);
  }
  $db->set_charset('utf8mb4');

  $log = [];

  // --- 1) Trunk Outbound CID + Force Trunk CID ---
  $trunkCids = is_array($in['trunk_cids'] ?? null) ? $in['trunk_cids'] : [];
  foreach ($trunkCids as $trunkName => $cid) {
    $trunkName = trim((string)$trunkName);
    $cid = preg_replace('/\D/', '', (string)$cid);
    if ($trunkName === '' || $cid === '') continue;

    $nameQ = $db->real_escape_string($trunkName);
    $cidQ  = $db->real_escape_string($cid);
    // keepcid = 'off'  ->  FreePBX "Force Trunk CID"
    $db->query("UPDATE trunks SET outcid='$cidQ', keepcid='off' WHERE name='$nameQ'");
    $log[] = [
      'trunk' => $trunkName,
      'outcid' => $cid,
      'cid_options' => 'Force Trunk CID',
      'affected' => $db->affected_rows,
      'error' => $db->error ?: null,
    ];
  }

  // --- 2) Giden rotalarda tercih edilen trunk'ları başa al ---
  $prefer = array_values(array_filter(array_map('strval', (array)($in['prefer_trunks'] ?? []))));
  $prefixes = array_values(array_filter(array_map(function ($p) {
    return preg_replace('/\D/', '', (string)$p);
  }, (array)($in['route_prefixes'] ?? []))));

  $routeLog = [];
  if (!empty($prefer) && !empty($prefixes)) {
    // Tercih edilen trunk id'lerini isimlerinden bul (verilen sırayı koru).
    $preferIds = [];
    foreach ($prefer as $pn) {
      $pnQ = $db->real_escape_string($pn);
      $r = $db->query("SELECT trunkid FROM trunks WHERE name='$pnQ' LIMIT 1");
      $row = $r ? $r->fetch_assoc() : null;
      if ($row) $preferIds[] = (string)$row['trunkid'];
      if ($r) $r->free();
    }

    // 80/81 önekli desenlere sahip rotaları bul.
    $conds = [];
    foreach ($prefixes as $p) {
      $pQ = $db->real_escape_string($p);
      $conds[] = "match_pattern_prefix LIKE '$pQ%'";
      $conds[] = "match_pattern_pass LIKE '$pQ%'";
    }
    $routeIds = [];
    if (!empty($conds)) {
      $r = $db->query("SELECT DISTINCT route_id FROM outbound_route_patterns WHERE " . implode(' OR ', $conds));
      while ($r && ($row = $r->fetch_assoc())) $routeIds[] = (string)$row['route_id'];
      if ($r) $r->free();
    }

    foreach ($routeIds as $rid) {
      $ridQ = $db->real_escape_string($rid);
      $existing = [];
      $r = $db->query("SELECT trunk_id FROM outbound_route_trunk WHERE route_id='$ridQ' ORDER BY seq ASC");
      while ($r && ($row = $r->fetch_assoc())) $existing[] = (string)$row['trunk_id'];
      if ($r) $r->free();
      if (empty($existing)) continue;

      // Yeni sıra: tercih edilenler (rotada varsa) önce, kalanlar mevcut sırayla.
      $ordered = [];
      foreach ($preferIds as $pid) {
        if (in_array($pid, $existing, true)) $ordered[] = $pid;
      }
      foreach ($existing as $tid) {
        if (!in_array($tid, $ordered, true)) $ordered[] = $tid;
      }

      if ($ordered !== $existing) {
        $db->query("DELETE FROM outbound_route_trunk WHERE route_id='$ridQ'");
        $seq = 0;
        foreach ($ordered as $tid) {
          $tidQ = $db->real_escape_string($tid);
          $db->query("INSERT INTO outbound_route_trunk (route_id, trunk_id, seq) VALUES ('$ridQ','$tidQ',$seq)");
          $seq++;
        }
      }

      $routeLog[] = ['route_id' => $rid, 'before' => $existing, 'after' => $ordered, 'error' => $db->error ?: null];
    }
  }

  // Mevcut durumu doğrulama için geri döndür.
  $state = [];
  $r = $db->query("SELECT name, tech, outcid, keepcid, disabled FROM trunks ORDER BY name");
  while ($r && ($row = $r->fetch_assoc())) $state[] = $row;
  if ($r) $r->free();

  $db->close();

  // Ayarların devreye girmesi için arka planda reload.
  if (is_executable($FWCONSOLE)) {
    shell_exec('sudo ' . escapeshellarg($FWCONSOLE) . ' reload > /dev/null 2>&1 &');
  }

  json_response([
    'success' => true,
    'applied_at' => date('c'),
    'trunks_updated' => $log,
    'routes_reordered' => $routeLog,
    'trunks' => $state,
    'reload' => 'arka planda baslatildi',
  ]);
}


$ext      = preg_replace('/\D/', '', (string)($in['extension'] ?? ''));
$name     = trim((string)($in['name'] ?? ''));
// Çift hat yönlendirmesi için "-" ayırıcısı korunmalı (or. 805xxxxxxxxx#-815xxxxxxxxx#)
$followme = preg_replace('/[^0-9#\-]/', '', (string)($in['followme'] ?? ''));

if ($ext === '') {
  json_response(['success' => false, 'error' => 'extension gerekli'], 400);
}

function csv_field($v) {
  $v = str_replace('"', '""', (string)$v);
  return (strpbrk($v, ",\"\n") !== false) ? '"' . $v . '"' : $v;
}

// CSV oluştur
$header = "extension,name,description,tech,secret,findmefollow_enabled,findmefollow_strategy,findmefollow_grplist,findmefollow_grptime,findmefollow_changecid,findmefollow_fixedcid,voicemail_enable,voicemail_vmpwd\n";
$fmEnabled = $followme !== '' ? 'CHECKED' : '';
$row = implode(',', [
  $ext,
  csv_field($name !== '' ? $name : $ext),
  csv_field('Otomatik olusturuldu'),
  'virtual',
  '',                 // secret (virtual'da gerekmez)
  $fmEnabled,         // findmefollow_enabled
  // Virtual dahilinin cihaz bacağı yoktur; dış numaraları doğrudan çaldır.
  'ringall',          // devresiz sanal dahiliyi beklemeden yönlendirme listesini çaldır
  $followme,          // findmefollow_grplist (80XXXXXXXXXX#)
  '25',               // findmefollow_grptime
  'default',          // CID'yi trunk'ın kendi yetkili kimliğine bırak (FCT 403 önlenir)
  '',                 // fixedcid kullanılmıyor
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

// Yeni dahilide çağrı kaydını otomatik aç (AstDB; reload gerektirmez)
$recEnabled = false;
if (is_executable($FWCONSOLE)) {
  foreach (['in/external', 'out/external', 'in/internal', 'out/internal'] as $recPath) {
    shell_exec('sudo ' . escapeshellarg($FWCONSOLE) . ' asterisk -rx '
      . escapeshellarg("database put AMPUSER {$ext}/recording/{$recPath} force") . ' > /dev/null 2>&1 &');
  }
  shell_exec('sudo ' . escapeshellarg($FWCONSOLE) . ' asterisk -rx '
    . escapeshellarg("database put AMPUSER {$ext}/recording/priority 15") . ' > /dev/null 2>&1 &');
  $recEnabled = true;
}

json_response([
  'success'   => $ok,
  'extension' => $ext,
  'followme'  => $followme,
  'recording' => $recEnabled ? 'force (otomatik acildi)' : 'acilamadi',
  'import'    => trim((string)$importOut),
  'reload'    => 'arka planda baslatildi',
], $ok ? 200 : 500);
