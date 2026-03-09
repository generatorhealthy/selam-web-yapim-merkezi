<?php
// BirFatura API Proxy - Routes requests to Supabase Edge Functions
// Since mod_proxy is not available, this PHP script handles the proxying

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: *');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Determine which endpoint to call based on the request URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove trailing slash
$path = rtrim($path, '/');

$supabaseBase = 'https://irnfwewabogveofwemvg.supabase.co/functions/v1';

$endpointMap = [
    '/api/orders'            => '/birfatura-orders',
    '/api/orderStatus'       => '/birfatura-order-status',
    '/api/paymentMethods'    => '/birfatura-payment-methods',
    '/api/orderCargoUpdate'  => '/birfatura-order-cargo-update',
    '/api/invoiceLinkUpdate' => '/birfatura-invoice-link-update',
    '/api/orderUpdate'       => '/birfatura-order-update',
];

$targetPath = null;
foreach ($endpointMap as $apiPath => $supabasePath) {
    if (strcasecmp($path, $apiPath) === 0) {
        $targetPath = $supabasePath;
        break;
    }
}

if (!$targetPath) {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
    exit;
}

$targetUrl = $supabaseBase . $targetPath;

// Forward the request
$ch = curl_init($targetUrl);

// Set method
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Forward request body
$inputBody = file_get_contents('php://input');
if ($inputBody) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $inputBody);
}

// Forward relevant headers
$forwardHeaders = [];
$forwardHeaders[] = 'Content-Type: application/json';

// Forward auth-related headers from BirFatura
$headerNames = ['token', 'x-token', 'x-api-key', 'api-key', 'api_password', 'authorization'];
foreach ($headerNames as $headerName) {
    $phpHeaderKey = 'HTTP_' . strtoupper(str_replace('-', '_', $headerName));
    if (isset($_SERVER[$phpHeaderKey])) {
        $forwardHeaders[] = $headerName . ': ' . $_SERVER[$phpHeaderKey];
    }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

// Capture response headers
$responseHeaders = [];
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$responseHeaders) {
    $len = strlen($header);
    $parts = explode(':', $header, 2);
    if (count($parts) === 2) {
        $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
    }
    return $len;
});

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['error' => 'Proxy error: ' . $curlError]);
    exit;
}

http_response_code($httpCode);
echo $response;
