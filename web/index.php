<?php
session_start();
// Chặn truy cập trái phép nếu chưa đăng nhập qua trang login.php trước đó
if (!isset($_SESSION['user_email'])) {
    header("Location: login.php");
    exit();
}
// Lấy tên người dùng từ Session
$userName = $_SESSION['user_name'] ?? 'Người dùng';

// --- ĐỌC DỮ LIỆU TỪ REALTIME DATABASE QUA PHP ---
require_once 'config.php';
$dbUrl = FIREBASE_DB_URL;
$idToken = $_SESSION['id_token'] ?? '';
$localId = $_SESSION['local_id'] ?? '';

// Đọc state trước để lấy đúng device_id do ESP tạo từ MAC.
$statesUrl = $dbUrl . "users/" . rawurlencode($localId) . "/devices.json?auth=" . urlencode($idToken);
$statesCh = curl_init($statesUrl);
curl_setopt($statesCh, CURLOPT_RETURNTRANSFER, true);
$statesResponse = curl_exec($statesCh);
curl_close($statesCh);
$statesData = json_decode($statesResponse ?: '{}', true);
$statesData = is_array($statesData) ? $statesData : [];
$newDeviceStates = [];
foreach ($statesData as $deviceId => $deviceNode) {
    if (preg_match('/^device_[A-F0-9]{12}$/', (string) $deviceId) === 1
        && is_array($deviceNode) && isset($deviceNode['state'])) {
        $newDeviceStates[$deviceId] = $deviceNode['state'];
    }
}
$initialDeviceId = count($newDeviceStates) ? (string) array_key_first($newDeviceStates) : '';

// Lịch của từng ESP nằm ở devices/{device_id}/config.
$targetUrl = $dbUrl . "users/" . rawurlencode($localId) . "/devices/" . rawurlencode($initialDeviceId) . "/config.json?auth=" . urlencode($idToken);

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

// Kiểm tra và truyền dữ liệu mảng cấu hình thuốc trực tiếp xuống JavaScript
$configData = json_decode($response ?: 'null', true);
if (is_array($configData) && isset($configData['slots'])) {
    $initialMedications = json_encode($configData['slots'], JSON_UNESCAPED_UNICODE);
} else {
    $initialMedications = '[]';
}

// Nạp sẵn danh sách thiết bị để giao diện không phải chờ request AJAX đầu tiên.
$initialDevices = json_encode($newDeviceStates, JSON_UNESCAPED_UNICODE);
?>
<!DOCTYPE html>
<html lang="vi" class="bg-background">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medibox — Chăm sóc thuốc thông minh</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        background: 'oklch(1 0 0)',
                        foreground: 'oklch(0.145 0 0)',
                        card: 'oklch(1 0 0)',
                        'card-foreground': 'oklch(0.145 0 0)',

                        /* --- TONE MÀU XANH CHỦ ĐẠO --- */
                        primary: { DEFAULT: '#2563eb', foreground: '#ffffff' },
                        secondary: { DEFAULT: '#eff6ff', foreground: '#1e40af' },
                        muted: { DEFAULT: '#f8fafc', foreground: '#64748b' },
                        accent: { DEFAULT: '#e0f2fe', foreground: '#0369a1' },
                        border: '#e2e8f0',
                        sidebar: '#f8fafc',
                    }
                }
            }
        }
    </script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="style.css">
    <script>
        // Truyền dữ liệu trực tiếp từ Realtime Database xuống JavaScript
        window.serverMedications = <?php echo $initialMedications; ?>;
        // UID này dùng để ghép thiết bị ESP32 vào đúng tài khoản Firebase.
        window.serverUserId = <?php echo json_encode($localId, JSON_UNESCAPED_UNICODE); ?>;
        window.serverUserName = <?php echo json_encode($userName, JSON_UNESCAPED_UNICODE); ?>;
        window.serverDevices = <?php echo $initialDevices; ?>;
    </script>
</head>

<body class="antialiased bg-background text-foreground min-h-screen">

    <main class="min-h-screen">
        <!-- Sidebar cho Desktop -->
        <aside class="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-sidebar px-5 py-6 lg:flex">
            <div class="flex items-center gap-3 px-2">
                <div class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <i data-lucide="pill" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">MEDIBOX</p>
                    <p class="text-xs text-muted-foreground">Chăm sóc thông minh</p>
                </div>
            </div>

            <div class="mt-12 flex flex-1 flex-col gap-2" id="sidebar-nav">
                <!-- Render qua JS -->
            </div>

            <div class="rounded-2xl border border-border bg-card p-4">
                <div class="mb-3 flex items-center justify-between">
                    <span class="text-xs font-semibold">Hỗ trợ nhanh</span>
                    <i data-lucide="circle-help" class="w-4 h-4 text-muted-foreground"></i>
                </div>
                <p class="text-xs leading-5 text-muted-foreground">Cần trợ giúp cài đặt thiết bị?</p>
                <button class="mt-3 text-xs font-semibold text-primary hover:underline">Xem hướng dẫn →</button>
            </div>
        </aside>

        <!-- Main Content Area -->
        <div class="lg:pl-64">
            <!-- Header -->
            <header class="flex h-20 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur sm:px-8">
                <button id="menu-toggle" class="rounded-lg p-2 hover:bg-accent lg:hidden" aria-label="Mở menu">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                </button>
                <div class="hidden lg:block">
                    <!-- Thời gian Realtime -->
                    <p class="text-xs text-muted-foreground font-mono" id="realtime-clock">Đang cập nhật thời gian...</p>
                    <h1 class="text-lg font-semibold tracking-tight">Xin chào, <?php echo htmlspecialchars($userName); ?></h1>
                </div>
                <div class="ml-auto flex items-center gap-3">
                    <button id="notif-btn" aria-label="Thông báo"
                        class="relative rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-accent">
                        <i data-lucide="bell" class="w-4 h-4"></i>
                        <span id="notif-dot" class="absolute right-2 top-2 size-1.5 rounded-full bg-primary"></span>
                    </button>
                    <div class="flex items-center gap-2 border-l border-border pl-3">
                        <div class="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <i data-lucide="user-round" class="w-4 h-4"></i>
                        </div>
                        <div class="hidden sm:block">
                            <p class="text-sm font-semibold"><?php echo htmlspecialchars($userName); ?></p>
                            <p class="text-[11px] text-muted-foreground">Người chăm sóc</p>
                        </div>
                        <!-- Nút Đăng xuất (Logout) -->
                        <a href="logout.php" title="Đăng xuất" class="ml-2 rounded-xl border border-border p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
                            <i data-lucide="log-out" class="w-4 h-4"></i>
                        </a>
                    </div>
                </div>
            </header>

            <!-- Mobile Menu Dropdown -->
            <div id="mobile-menu" class="hidden border-b border-border bg-sidebar p-4 lg:hidden"></div>

            <!-- Content Body (Được thay đổi nội dung linh hoạt qua JS theo Tab) -->
            <div id="app-content" class="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
                <!-- Nội dung các tab sẽ được render tự động tại đây -->
            </div>
        </div>
    </main>

    <!-- Modal Quản lý / Chỉnh sửa lịch thuốc -->
    <div id="edit-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm hidden">
        <div class="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl mx-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Chỉnh sửa lịch & Ngăn thuốc</h3>
                <button onclick="closeEditModal()" class="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <p class="text-xs text-muted-foreground mb-6">Cập nhật tên thuốc, liều lượng và giờ uống cho từng ngăn.</p>
            
            <div id="modal-med-list" class="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
                <!-- Render input chỉnh sửa -->
            </div>

            <div class="mt-6 flex justify-end gap-3 border-t border-border pt-4">
                <button onclick="closeEditModal()" class="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold hover:bg-accent">Đóng</button>
                <button onclick="saveMedications()" class="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Lưu thay đổi</button>
            </div>
        </div>
    </div>

    <!-- Custom JS -->
    <script src="script_3.js?v=20260914-4slots"></script>
</body>

</html>