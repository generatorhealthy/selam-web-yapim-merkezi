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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Log the request for debugging
    error_log('SMS Relay Request: ' . file_get_contents('php://input'));
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
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