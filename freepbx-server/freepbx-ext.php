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

header('Content-Type: application/json');

// fwconsole bulkimport + reload uzun sürebilir; PHP varsayılan 30sn limitini kaldır.
@set_time_limit(0);
@ini_set('max_execution_time', '0');
@ignore_user_abort(true);

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
  http_response_code(401);
  echo json_encode(['error' => 'unauthorized']);
  exit;
}

$action   = $in['action'] ?? 'create';
$ext      = preg_replace('/\D/', '', (string)($in['extension'] ?? ''));
$name     = trim((string)($in['name'] ?? ''));
$followme = preg_replace('/[^0-9#]/', '', (string)($in['followme'] ?? ''));

if ($ext === '') {
  http_response_code(400);
  echo json_encode(['error' => 'extension gerekli']);
  exit;
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
file_put_contents($file, $header . $row);

$importCmd = 'sudo ' . escapeshellarg($FWCONSOLE) . ' bulkimport --type=extensions ' . escapeshellarg($file) . ' --replace 2>&1';

// bulkimport'u çalıştır (dahiliyi oluşturur)
$importOut = shell_exec($importCmd);

@unlink($file);

// reload çok yavaş; arka planda çalıştır ki yanıt hemen dönsün (edge timeout olmasın)
$reloadCmd = 'sudo ' . escapeshellarg($FWCONSOLE) . ' reload > /dev/null 2>&1 &';
shell_exec($reloadCmd);

$importLower = strtolower((string)$importOut);
$ok = (strpos($importLower, 'error') === false) && (strpos($importLower, 'exception') === false);

echo json_encode([
  'success'   => $ok,
  'extension' => $ext,
  'followme'  => $followme,
  'import'    => trim((string)$importOut),
  'reload'    => 'arka planda baslatildi',
]);
