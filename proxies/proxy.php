<?php
/**
 * Better Stack Status Page Badge
 * Author: Unicorn Panel (https://unicornpanel.net)
 * Repository: https://github.com/UnicornPanel/Better-Stack-Status-Page-Badge
 */

/** ---------- INPUT VALIDATION ---------- **/

$page = $_GET['page'] ?? '';
$page = strtolower(trim($page));

// Basic hostname validation
if (!preg_match('/^[a-z0-9.-]+$/', $page)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid page format']);
    exit;
}

/** ---------- FLAGS ---------- **/
$state_only = isset($_GET['state-only']) ? ($_GET['state-only'] == '1') : true; 
// default: true

/** ---------- BUILD URL ---------- **/
$url = "https://{$page}/index.json";

/** ---------- TIMEOUT + FETCH ---------- **/
$context = stream_context_create([
    'http' => [
        'timeout' => 4,
        'ignore_errors' => true,
        'header' => "User-Agent: BS Badge Proxy/1.0\r\n"
    ],
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true
    ]
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unable to reach BetterStack']);
    exit;
}

/** ---------- INSPECT UPSTREAM STATUS ---------- **/
$status_code = 0;
if (isset($http_response_header) && is_array($http_response_header)) {
    if (preg_match('#HTTP/\d\.\d\s+(\d+)#', $http_response_header[0], $m)) {
        $status_code = intval($m[1]);
    }
}
if ($status_code >= 400) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode(['error' => "Upstream error: {$status_code}"]);
    exit;
}

/** ---------- PROCESS RESPONSE ---------- **/

// CORS + headers applied to both modes
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
header('Cache-Control: max-age=30');

if (!$state_only) {
    // Return full JSON
    echo $response;
    exit;
}

try {
    $json = json_decode($response, true);
    $state = strtolower($json['data']['attributes']['aggregate_state'] ?? '');

    if (!$state) {
        throw new Exception("Missing aggregate_state");
    }

    echo json_encode(['aggregate_state' => $state]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid response from BetterStack']);
}

exit;