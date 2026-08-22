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

// --- 2) Rota bazlı trunk ataması ---
// route_trunks: { "80": ["FCT0505"], "81": ["FCT0606"] }
// Her önek için ilgili rota SADECE verilen trunk'ları (verilen sırayla) kullanır.
$routeTrunks = is_array($in['route_trunks'] ?? null) ? $in['route_trunks'] : [];
$routeLog = [];

$trunkIdByName = [];
$r = $db->query("SELECT trunkid, name FROM trunks");
while ($r && ($row = $r->fetch_assoc())) $trunkIdByName[(string)$row['name']] = (string)$row['trunkid'];
if ($r) $r->free();

// Her önek için hedef trunk kimlikleri
$targets = [];
foreach ($routeTrunks as $prefix => $names) {
  $ids = [];
  foreach ((array)$names as $n) {
    $n = trim((string)$n);
    if (isset($trunkIdByName[$n])) $ids[] = $trunkIdByName[$n];
  }
  if (!empty($ids)) $targets[(string)$prefix] = $ids;
}

foreach ($targets as $prefix => $ids) {
  $primary = $ids[0];
  // Diğer öneklerin birincil trunk'ları (rota ayrımı için)
  $others = [];
  foreach ($targets as $p2 => $ids2) {
    if ($p2 !== $prefix) $others[] = $ids2[0];
  }

  // Bu öneke ait rotaları bul: önce patern, sonra mevcut trunk bağlantısı.
  $routeIds = [];
  $pQ = $db->real_escape_string(preg_replace('/\D/', '', (string)$prefix));
  if ($pQ !== '') {
    $r = $db->query(
      "SELECT DISTINCT route_id FROM outbound_route_patterns " .
      "WHERE match_pattern_prefix LIKE '$pQ%' OR match_pattern_pass LIKE '$pQ%'"
    );
    while ($r && ($row = $r->fetch_assoc())) $routeIds[] = (string)$row['route_id'];
    if ($r) $r->free();
  }
  if (empty($routeIds)) {
    $primQ = $db->real_escape_string($primary);
    $r = $db->query("SELECT DISTINCT route_id FROM outbound_route_trunks WHERE trunk_id='$primQ'");
    $cand = [];
    while ($r && ($row = $r->fetch_assoc())) $cand[] = (string)$row['route_id'];
    if ($r) $r->free();
    // Diğer öneke ait trunk'ı da içeren rotaları ayıkla
    foreach ($cand as $rid) {
      $ridQ = $db->real_escape_string($rid);
      $has = [];
      $r = $db->query("SELECT trunk_id FROM outbound_route_trunks WHERE route_id='$ridQ'");
      while ($r && ($row = $r->fetch_assoc())) $has[] = (string)$row['trunk_id'];
      if ($r) $r->free();
      $conflict = false;
      foreach ($others as $o) { if (in_array($o, $has, true)) { $conflict = true; break; } }
      if (!$conflict) $routeIds[] = $rid;
    }
  }
  $routeIds = array_values(array_unique($routeIds));

  foreach ($routeIds as $rid) {
    $ridQ = $db->real_escape_string($rid);
    $existing = [];
    $r = $db->query("SELECT trunk_id FROM outbound_route_trunks WHERE route_id='$ridQ' ORDER BY seq ASC");
    while ($r && ($row = $r->fetch_assoc())) $existing[] = (string)$row['trunk_id'];
    if ($r) $r->free();

    if ($existing !== $ids) {
      $db->query("DELETE FROM outbound_route_trunks WHERE route_id='$ridQ'");
      $seq = 0;
      foreach ($ids as $tid) {
        $tidQ = $db->real_escape_string($tid);
        $db->query("INSERT INTO outbound_route_trunks (route_id, trunk_id, seq) VALUES ('$ridQ','$tidQ',$seq)");
        $seq++;
      }
    }

    $routeLog[] = ['prefix' => $prefix, 'route_id' => $rid, 'before' => $existing, 'after' => $ids, 'error' => $db->error ?: null];
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
