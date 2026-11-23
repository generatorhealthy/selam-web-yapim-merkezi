<?php
// Hoppa (Esnekpos) relay: Hoppa only accepts requests from whitelisted static
// IPs, so the payment Edge Function forwards its calls through this hosting.
// Only fixed Hoppa endpoints are reachable; Hoppa itself authenticates every
// request with MERCHANT/MERCHANT_KEY. Bodies are never logged.
header('Content-Type: application/json');
if (isset($_GET['check']) && $_GET['check'] === 'ip') {
  $ip = @file_get_contents('https://api.ipify.org?format=json');
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
  CURLOPT_SSL_VERIFYPEER => true, CURLOPT_FOLLOWLOCATION => false]);
$res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_errno($ch); curl_close($ch);
if ($err || $res === false) { http_response_code(502); echo '{"error":"relay"}'; exit(); }
http_response_code($code ?: 502); echo $res;
