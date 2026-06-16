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
