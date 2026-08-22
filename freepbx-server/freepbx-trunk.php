<?php
/**
 * FreePBX trunk CID + giden rota sıralama yardımcısı (bağımsız dosya).
 *
 * Bu dosyayı web kök dizinine koyun: /var/www/html/freepbx-trunk.php
 * Edge function (freepbx-trunk-config) buraya POST atar.
 *
 * 1) FCT trunk'larına kendi yetkili numarasını "Force Trunk CID" olarak yazar
 *    (transfer bacağındaki 403 Forbidden - IP Not Authorized hatasını bitirir).
 * 2) 80/81 önekli giden rotalarda çok kanallı Verimor trunk'larını sıranın başına alır.
 */

@set_time_limit(0);
@ini_set('max_execution_time', '0');
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
@ignore_user_abort(true);
header('Content-Type: application/json; charset=utf-8');

function json_response($data, $status = 200) {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

// ====== AYAR (freepbx-ext.php ile aynı secret) ======
$SECRET = '1b849165041c774396da0fc92c8fa4c10af3e84d6d0da6d3';
$FWCONSOLE = '/usr/sbin/fwconsole';
// ====================================================

$raw = file_get_contents('php://input');
$in  = json_decode($raw, true);
if (!is_array($in)) { $in = $_POST; }

if (!hash_equals($SECRET, (string)($in['secret'] ?? ''))) {
  json_response(['success' => false, 'error' => 'unauthorized'], 401);
}

if (function_exists('mysqli_report')) { mysqli_report(MYSQLI_REPORT_OFF); }
if (!class_exists('mysqli')) {
  json_response(['success' => false, 'error' => 'PHP mysqli eklentisi sunucuda yüklü değil.'], 500);
}

// --- FreePBX veritabanı kimlik bilgilerini oku ---
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
  // keepcid = 'off' -> FreePBX "Force Trunk CID"
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
  $preferIds = [];
  foreach ($prefer as $pn) {
    $pnQ = $db->real_escape_string($pn);
    $r = $db->query("SELECT trunkid FROM trunks WHERE name='$pnQ' LIMIT 1");
    $row = $r ? $r->fetch_assoc() : null;
    if ($row) $preferIds[] = (string)$row['trunkid'];
    if ($r) $r->free();
  }

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

  // FreePBX bazı kurulumlarda 80/81 önekini derlenmiş dialplan'da tutup
  // outbound_route_patterns alanlarında beklediğimiz biçimde göstermiyor.
  // FCT'ye özel mevcut rotaları trunk bağlantısından da bul; böylece loglarda
  // görülen ROUTEID 3/4 kesin olarak güncellenir.
  $fctNames = array_keys($trunkCids);
  if (!empty($fctNames)) {
    $quotedNames = array_map(function ($name) use ($db) {
      return "'" . $db->real_escape_string((string)$name) . "'";
    }, $fctNames);
    $r = $db->query(
      "SELECT DISTINCT ort.route_id " .
      "FROM outbound_route_trunks ort " .
      "JOIN trunks t ON t.trunkid = ort.trunk_id " .
      "WHERE t.name IN (" . implode(',', $quotedNames) . ")"
    );
    while ($r && ($row = $r->fetch_assoc())) $routeIds[] = (string)$row['route_id'];
    if ($r) $r->free();
  }
  $routeIds = array_values(array_unique($routeIds));

  foreach ($routeIds as $rid) {
    $ridQ = $db->real_escape_string($rid);
    $existing = [];
    $r = $db->query("SELECT trunk_id FROM outbound_route_trunks WHERE route_id='$ridQ' ORDER BY seq ASC");
    while ($r && ($row = $r->fetch_assoc())) $existing[] = (string)$row['trunk_id'];
    if ($r) $r->free();
    if (empty($existing)) continue;

    // Tercih edilen trunk'lar rotada daha önce bulunmasa bile ekle. Eski
    // davranış yalnızca mevcut trunk'ları sıraladığı için FCT'ye özel 80/81
    // rotalarında Verimor hiç eklenmiyor ve transfer bacağı yine FCT'ye
    // düşüyordu.
    $ordered = [];
    foreach ($preferIds as $pid) {
      if (!in_array($pid, $ordered, true)) $ordered[] = $pid;
    }
    foreach ($existing as $tid) {
      if (!in_array($tid, $ordered, true)) $ordered[] = $tid;
    }

    if ($ordered !== $existing) {
      $db->query("DELETE FROM outbound_route_trunks WHERE route_id='$ridQ'");
      $seq = 0;
      foreach ($ordered as $tid) {
        $tidQ = $db->real_escape_string($tid);
        $db->query("INSERT INTO outbound_route_trunks (route_id, trunk_id, seq) VALUES ('$ridQ','$tidQ',$seq)");
        $seq++;
      }
    }

    $routeLog[] = ['route_id' => $rid, 'before' => $existing, 'after' => $ordered, 'error' => $db->error ?: null];
  }
}

$state = [];
$r = $db->query("SELECT name, tech, outcid, keepcid, disabled FROM trunks ORDER BY name");
while ($r && ($row = $r->fetch_assoc())) $state[] = $row;
if ($r) $r->free();

$db->close();

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
