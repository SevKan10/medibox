<?php
session_start();
require_once 'config.php';

set_exception_handler(function (Throwable $exception) {
    respondError($exception->getMessage(), 502);
});

if (!isset($_SESSION['user_email'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);
$action = $data['action'] ?? '';
$idToken = $_SESSION['id_token'] ?? '';
$localId = $_SESSION['local_id'] ?? '';

if ($localId === '') {
    respondError('Không xác định được tài khoản Firebase', 401);
}

// Tất cả dữ liệu của request này nằm trong nhánh riêng của user đang đăng nhập.
$userRoot = FIREBASE_USER_ROOT . '/' . rawurlencode($localId);
$deviceId = (string) ($data['device_id'] ?? '');

// list_devices đọc cả nhánh nên không cần device_id; các action còn lại cần ID cụ thể.
if ($deviceId === '' && $action !== 'list_devices') {
    respondError('Mã thiết bị không hợp lệ', 400);
}

if ($deviceId !== '' && !isSupportedDeviceId($deviceId)) {
    respondError('Mã thiết bị phải có dạng device_XXXXXXXXXXXX', 400);
}

// Schema v1: users/{uid}/devices/{device_id}/{meta|config|state|command}.
$deviceRoot = $userRoot . '/' . FIREBASE_DEVICE_ROOT . '/' . rawurlencode($deviceId);

if ($action === 'save_medications') {
    $medications = $data['medications'] ?? [];

    if (!is_array($medications)) {
        respondError('Danh sách thuốc không hợp lệ', 400);
    }

    $currentConfig = firebaseGet($deviceRoot . '/config', $idToken) ?? [];
    $currentRevision = (int) ($currentConfig['revision'] ?? 0);
    $config = [
        'schema_version' => 1,
        'revision' => $currentRevision + 1,
        'updated_at' => time(),
        'updated_by' => 'web',
        'slots' => normalizeMedicationSlots($medications)
    ];

    firebasePut($deviceRoot . '/config', $config, $idToken);

    respond(["status" => "success", "revision" => $config['revision'], "message" => "Đã lưu cấu hình và lịch trình vào Firebase"]);
    exit();
}
else if ($action === 'read_medications') {
    $config = firebaseGet($deviceRoot . '/config', $idToken);
    if (is_array($config) && isset($config['slots'])) {
        $medications = normalizeMedicationSlots($config['slots']);
    } else {
        $medications = normalizeMedicationSlots([]);
    }
    respond(["status" => "success", "medications" => $medications]);
    exit();
}
else if ($action === 'control_lock') {
    $lockState = (bool) ($data['locked'] ?? true);
    $command = [
        'schema_version' => 1,
        'command_id' => 'cmd_' . bin2hex(random_bytes(8)),
        'type' => 'set_lock',
        'requested_lock' => $lockState ? 'locked' : 'unlocked',
        'created_at' => time(),
        'created_by' => 'web',
        'status' => 'pending',
        'ack_at' => null,
        'error_code' => null
    ];

    firebasePut($deviceRoot . '/command', $command, $idToken);

    respond(["status" => "success", "lock_state" => $lockState, "command_id" => $command['command_id']]);
    exit();
}
else if ($action === 'read_device_state') {
    $state = getDeviceState($deviceRoot, $idToken);

    respond(["status" => "success", "device_status" => $state]);
    exit();
}
else if ($action === 'list_devices') {
    $deviceNodes = firebaseGet($userRoot . '/' . FIREBASE_DEVICE_ROOT, $idToken) ?? [];
    $deviceNodes = is_array($deviceNodes) ? $deviceNodes : [];
    $devices = [];
    foreach ($deviceNodes as $id => $node) {
        if (!isSupportedDeviceId((string) $id)) continue;
        $state = getDeviceState($userRoot . '/' . FIREBASE_DEVICE_ROOT . '/' . rawurlencode($id), $idToken);
        $meta = is_array($node['meta'] ?? null) ? $node['meta'] : [];
        $state['device_id'] = $id;
        $state['display_name'] = $meta['display_name'] ?? '';
        $state['lifecycle'] = $meta['lifecycle'] ?? 'active';
        if ($state['lifecycle'] !== 'deleted') $devices[] = $state;
    }
    respond(["status" => "success", "devices" => $devices]);
    exit();
}
else if ($action === 'delete_device') {
    firebasePut($deviceRoot . '/meta/lifecycle', 'deleted', $idToken);
    firebasePut($deviceRoot . '/meta/deleted_at', time(), $idToken);
    firebasePut($deviceRoot . '/command', [
        'schema_version' => 1,
        'command_id' => 'cmd_' . bin2hex(random_bytes(8)),
        'type' => 'delete_device',
        'created_at' => time(),
        'created_by' => 'web',
        'status' => 'pending'
    ], $idToken);
    respond(["status" => "success", "message" => "Đã yêu cầu xóa thiết bị"]);
    exit();
}
else {
    respondError('Action không hợp lệ', 400);
}

function firebasePut($path, $payload, $idToken) {
    firebaseRequest($path, $idToken, 'PUT', $payload);
}

function firebaseGet($path, $idToken) {
    return firebaseRequest($path, $idToken, 'GET');
}

function isSupportedDeviceId($deviceId) {
    return preg_match('/^device_[A-F0-9]{12}$/', $deviceId) === 1;
}

function normalizeMedicationSlots($medications) {
    if (!is_array($medications) || count($medications) > MEDIBOX_SLOT_COUNT) {
        respondError('Cấu hình phải có tối đa ' . MEDIBOX_SLOT_COUNT . ' ngăn thuốc', 400);
    }

    $slots = [];
    foreach ($medications as $medication) {
        if (!is_array($medication)) continue;
        $slotId = filter_var($medication['slot'] ?? $medication['slot_id'] ?? null, FILTER_VALIDATE_INT);
        if ($slotId === false || $slotId < 1 || $slotId > MEDIBOX_SLOT_COUNT || isset($slots[$slotId])) {
            respondError('Ngăn thuốc không hợp lệ', 400);
        }
        $doses = [];
        foreach (($medication['doses'] ?? []) as $index => $dose) {
            if (!is_array($dose) || !preg_match('/^([01][0-9]|2[0-3]):[0-5][0-9]$/', (string) ($dose['time'] ?? ''))) {
                respondError('Giờ uống không hợp lệ', 400);
            }
            $quantity = filter_var($dose['quantity'] ?? null, FILTER_VALIDATE_INT);
            if ($quantity === false || $quantity < 1) {
                respondError('Số viên không hợp lệ', 400);
            }
            $doses[] = [
                'dose_id' => $slotId . '-' . ($index + 1),
                'time' => $dose['time'],
                'quantity' => $quantity
            ];
        }
        $slots[$slotId] = [
            'slot_id' => $slotId,
            'enabled' => (bool) ($medication['enabled'] ?? (($medication['name'] ?? $medication['medicine_name'] ?? '') !== 'Chưa thiết lập')),
            'medicine_name' => (string) ($medication['name'] ?? $medication['medicine_name'] ?? ''),
            'note' => (string) ($medication['detail'] ?? $medication['note'] ?? ''),
            'doses' => $doses
        ];
    }

    $normalizedSlots = [];
    for ($slotId = 1; $slotId <= MEDIBOX_SLOT_COUNT; $slotId++) {
        $normalizedSlots[] = $slots[$slotId] ?? [
            'slot_id' => $slotId,
            'enabled' => false,
            'medicine_name' => '',
            'note' => '',
            'doses' => []
        ];
    }
    return $normalizedSlots;
}

function getDeviceState($deviceRoot, $idToken) {
    $state = firebaseGet($deviceRoot . '/state', $idToken);
    $state = is_array($state) ? $state : [];
    $command = firebaseGet($deviceRoot . '/command', $idToken);
    $command = is_array($command) ? $command : [];
    $state = normalizeDeviceState($state, $command);
    $state['online'] = resolveOnlineState($state);
    $state['locked'] = ($state['lock'] ?? 'unknown') === 'locked';
    return $state;
}

function normalizeDeviceState($state, $command) {
    if (!isset($state['lock']) && isset($command['requested_lock'])) {
        $state['lock'] = $command['requested_lock'];
    }
    return $state;
}

function parseDeviceTime($value) {
    if (is_numeric($value)) {
        $timestamp = (int) $value;
        return $timestamp > 20000000000 ? (int) ($timestamp / 1000) : $timestamp;
    }

    if (is_string($value) && $value !== '') {
        $timestamp = strtotime($value);
        return $timestamp === false ? null : $timestamp;
    }

    return null;
}

function resolveOnlineState($state) {
    if (($state['connection'] ?? null) === 'offline' || ($state['online'] ?? null) === false) {
        return false;
    }

    // last_seen là Unix timestamp giây hoặc mili-giây. Chỉ timeout khi quá hạn.
    $lastSeen = parseDeviceTime($state['last_seen'] ?? $state['reported_at'] ?? $state['updated_at'] ?? null);
    if ($lastSeen === null) {
        return ($state['connection'] ?? null) === 'online' || (bool) ($state['online'] ?? false);
    }

    return (time() - $lastSeen) <= DEVICE_OFFLINE_TIMEOUT_SECONDS;
}

function firebaseRequest($path, $idToken, $method, $payload = null) {
    $url = FIREBASE_DB_URL . trim($path, '/') . '.json?auth=' . urlencode($idToken);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
    }

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new RuntimeException('Firebase cURL lỗi: ' . $curlError);
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        $firebaseError = json_decode($response, true);
        $detail = $firebaseError['error'] ?? trim($response);
        throw new RuntimeException('Firebase HTTP ' . $httpCode . ': ' . ($detail ?: 'phản hồi rỗng'));
    }

    return $method === 'GET' ? json_decode($response, true) : null;
}

function respond($payload) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}

function respondError($message, $httpCode = 500) {
    http_response_code($httpCode);
    respond(["status" => "error", "message" => $message]);
    exit();
}
?>