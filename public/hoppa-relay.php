<?php
// Hoppa (Esnekpos) relay: Hoppa only accepts requests from whitelisted static
// IPs, so the payment Edge Function forwards its calls through this hosting.
// Only fixed Hoppa endpoints are reachable; Hoppa itself authenticates every
// request with MERCHANT/MERCHANT_KEY. Bodies are never logged.
header('Content-Type: application/json');
if (isset($_GET['check']) && $_GET['check'] === 'ip') {
  // Same transport as the relay (IPv4 only) so the reported IP is the one Hoppa sees.
  $c = curl_init('https://api64.ipify.org?format=json');
  curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]);
  $ip = curl_exec($c); curl_close($c);
  echo $ip !== false ? $ip : json_encode(['ip' => 'unknown']);
  exit();
}
if (isset($_GET['check']) && $_GET['check'] === 'ip-default') {
  // Diagnostic: address used without forcing IPv4 (shows whether hosting leaves over IPv6).
  $ip = @file_get_contents('https://api64.ipify.org?format=json');
  echo $ip !== false ? $ip : json_encode(['ip' => 'unknown']);
  exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"error":"method"}'; exit(); }
$hosts = ['test' => 'https://posservicetest.esnekpos.com', 'prod' => 'https://posservice.esnekpos.com'];
$paths = ['/api/pay/CommonPaymentDealer', '/api/services/ProcessQuery', '/api/card/ListCustomerCards', '/api/pay/EYV3DPay'];
$env = $_GET['env'] ?? ''; $path = $_GET['path'] ?? '';
if (!isset($hosts[$env]) || !in_array($path, $paths, true)) { http_response_code(400); echo '{"error":"target"}'; exit(); }
$raw = file_get_contents('php://input', false, null, 0, 65536);
if ($raw === false || json_decode($raw) === null) { http_response_code(400); echo '{"error":"json"}'; exit(); }
$ch = curl_init($hosts[$env] . $path);
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $raw, CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_TIMEOUT => 30,
  CURLOPT_SSL_VERIFYPEER => true, CURLOPT_FOLLOWLOCATION => false,
  // Hoppa whitelists only our static IPv4; Hoppa's host also has IPv6, which would leave from a different address.
  CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]);
$res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_errno($ch); curl_close($ch);
if ($err || $res === false) { http_response_code(502); echo '{"error":"relay"}'; exit(); }
http_response_code($code ?: 502); echo $res;
