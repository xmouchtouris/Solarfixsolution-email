<?php
// Deploy with the HTML files on PHP-enabled Afrihost hosting (PHP 8.2+).
// Uses the hosting server's mail service; no Railway or browser-side credentials.
declare(strict_types=1);

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, string $message): never
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($accept, 'application/json') || str_contains($contentType, 'application/json')) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $status === 200, 'message' => $message]);
    } else {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        $title = $status === 200 ? 'Thank you for getting in touch.' : 'We couldn’t send your enquiry.';
        $safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        echo '<!doctype html><html lang="en-ZA"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>Enquiry | Solar Fix Solutions</title><link rel="stylesheet" href="css/styles.css"></head>'
            . '<body><main class="container section"><p class="eyebrow">Solar Fix Solutions</p>'
            . '<h1>' . $title . '</h1><p class="lead">' . $safeMessage . '</p>'
            . '<div class="button-row"><a class="button" href="contact.html">Back to contact</a>'
            . '<a class="text-link" href="mailto:info@solarfixsolutions.co.za">Email us directly</a></div>'
            . '</main></body></html>';
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Use the contact form to send an enquiry.']);
    exit;
}

// Restrict browser submissions to the production website. Non-browser clients
// can omit Origin, so this complements validation and rate limiting below.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://solarfixsolutions.co.za', 'https://www.solarfixsolutions.co.za'];
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    respond(403, 'Please submit your enquiry from our website.');
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    respond(413, 'Your message is too long.');
}
$raw = file_get_contents('php://input', false, null, 0, 20001);
if ($raw === false || strlen($raw) > 20000) {
    respond(413, 'Your message is too long.');
}
$isJson = str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json');
$input = $isJson ? json_decode($raw, true) : $_POST;
if (!is_array($input)) {
    respond(400, 'Please check the form and try again.');
}

$limits = ['name' => 100, 'email' => 254, 'phone' => 40, 'service' => 100, 'message' => 5000, 'website' => 200];
$fields = [];
foreach ($limits as $key => $limit) {
    $value = $input[$key] ?? '';
    if (!is_string($value) || strlen($value) > $limit || str_contains($value, "\0")) {
        respond(400, 'Please check the form and try again.');
    }
    $fields[$key] = trim($value);
}
if ($fields['name'] === '' || $fields['message'] === '' ||
    !filter_var($fields['email'], FILTER_VALIDATE_EMAIL) ||
    preg_match('/[\r\n]/', $fields['email']) || preg_match('/[\r\n]/', $fields['name'])) {
    respond(400, 'A name, valid email address and message are required.');
}
if ($fields['website'] !== '') {
    respond(400, 'Please check the form and try again.');
}

// Keep counters outside the public web directory. Use the direct client IP;
// never trust arbitrary X-Forwarded-For values. A fixed file keeps disk use bounded.
$counterPath = sys_get_temp_dir() . '/solarfix-contact-' . hash('sha256', __DIR__) . '.json';
$counter = @fopen($counterPath, 'c+');
if ($counter === false || !flock($counter, LOCK_EX)) {
    if (is_resource($counter)) fclose($counter);
    respond(503, 'Please call or email us directly.');
}
@chmod($counterPath, 0600);
$now = time();
$stored = json_decode(stream_get_contents($counter) ?: '{}', true);
$stored = is_array($stored) ? $stored : [];
$entries = array_values(array_filter($stored, static fn($entry) =>
    is_array($entry) && isset($entry['at'], $entry['ip']) && is_int($entry['at']) &&
    $entry['at'] > $now - 3600
));
$ipHash = hash('sha256', __DIR__ . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
$recent = array_filter($entries, static fn($entry) => $entry['ip'] === $ipHash && $entry['at'] > $now - 900);
if (count($recent) >= 5 || count($entries) >= 50) {
    flock($counter, LOCK_UN);
    fclose($counter);
    header('Retry-After: ' . (count($entries) >= 50 ? '3600' : '900'));
    respond(429, 'Too many enquiries. Please try again later or call us.');
}
$entries[] = ['at' => $now, 'ip' => $ipHash];
$encoded = json_encode($entries);
rewind($counter);
$written = ftruncate($counter, 0) && fwrite($counter, $encoded) === strlen($encoded) && fflush($counter);
flock($counter, LOCK_UN);
fclose($counter);
if (!$written) respond(503, 'Please call or email us directly.');

$recipient = 'info@solarfixsolutions.co.za';
$body = "New website enquiry\n\n"
    . "Name: {$fields['name']}\nEmail: {$fields['email']}\n"
    . "Phone: " . ($fields['phone'] ?: 'Not provided') . "\n"
    . "Service: " . ($fields['service'] ?: 'General enquiry') . "\n\n"
    . $fields['message'];
$headers = [
    'From' => 'Solar Fix Solutions <info@solarfixsolutions.co.za>',
    'Reply-To' => $fields['email'],
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
];

// mail() confirms acceptance by the host, not delivery to the recipient's inbox.
try {
    $sent = function_exists('mail') && @mail($recipient, 'New Solar Fix Solutions website enquiry', $body, $headers, '-finfo@solarfixsolutions.co.za');
} catch (Throwable $error) {
    $sent = false;
}
if (!$sent) {
    error_log('Solar Fix Solutions: hosting mail service did not accept an enquiry.');
    respond(503, 'We could not send your enquiry. Please call or email us directly.');
}
respond(200, 'Your enquiry has been accepted for sending.');
