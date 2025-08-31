<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Diagnostics: return server public IP for whitelisting
if (isset($_GET['check']) && $_GET['check'] === 'ip') {
    $ipResponse = @file_get_contents('https://api.ipify.org?format=json');
    if ($ipResponse === false) {
        $fallbackIp = $_SERVER['SERVER_ADDR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        echo json_encode(['ip' => $fallbackIp]);
    } else {
        echo $ipResponse;
    }
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Read input once and log
    $raw = file_get_contents('php://input');
    error_log('SMS Relay Request: ' . $raw);
    
    // Get POST data
    $input = json_decode($raw, true);
    
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit();
    }
    
    // Forward to Verimor API
    $ch = curl_init('https://sms.verimor.com.tr/v2/send.json');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'User-Agent: DoktorumOl-SMS-Relay/1.0'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log('SMS Relay cURL Error: ' . $error);
        http_response_code(500);
        echo json_encode(['error' => 'SMS relay connection failed: ' . $error]);
        exit();
    }
    
    // Log the response
    error_log('SMS Relay Response: ' . $response);
    
    // Return the response with the same HTTP code
    http_response_code($httpCode);
    echo $response;
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>