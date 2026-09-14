<?php
session_start();

$error_message = "";
$success_message = "";
require_once 'config.php';
$firebaseApiKey = FIREBASE_API_KEY;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $action = $_POST['action'] ?? 'login';
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $fullname = trim($_POST['fullname'] ?? '');

    // Kiểm tra email bắt buộc cho mọi hành động
    if (empty($email)) {
        $error_message = "Vui lòng nhập địa chỉ email.";
    } else {
        if ($action === 'signup') {
            if (empty($password)) {
                $error_message = "Vui lòng nhập đầy đủ email và mật khẩu.";
            } else {
                // --- XỬ LÝ ĐĂNG KÝ QUA FIREBASE REST API ---
                $url = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" . $firebaseApiKey;
                $data = json_encode([
                    "email" => $email,
                    "password" => $password,
                    "returnSecureToken" => true
                ]);

                $response = callFirebaseApi($url, $data);
                $result = json_decode($response, true);

                if (isset($result['idToken'])) {
                    $idToken = $result['idToken'];

                    // --- CẬP NHẬT TÊN HIỂN THỊ (DISPLAY NAME) NẾU CÓ ---
                    if (!empty($fullname)) {
                        $updateUrl = "https://identitytoolkit.googleapis.com/v1/accounts:update?key=" . $firebaseApiKey;
                        $updateData = json_encode([
                            "idToken" => $idToken,
                            "displayName" => $fullname,
                            "returnSecureToken" => true
                        ]);
                        callFirebaseApi($updateUrl, $updateData);
                    }

                    $success_message = "Đăng ký thành công! Bạn có thể đăng nhập ngay.";
                } else {
                    $error_message = "Lỗi đăng ký: " . ($result['error']['message'] ?? 'Không xác định');
                }
            }

        } elseif ($action === 'forgot') {
            // --- XỬ LÝ QUÊN MẬT KHẨU QUA FIREBASE REST API ---
            $url = "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=" . $firebaseApiKey;
            $data = json_encode([
                "requestType" => "PASSWORD_RESET",
                "email" => $email
            ]);

            $response = callFirebaseApi($url, $data);
            $result = json_decode($response, true);

            if (isset($result['email'])) {
                $success_message = "Đã gửi liên kết đặt lại mật khẩu về email của bạn. Vui lòng kiểm tra hộp thư!";
            } else {
                $error_message = "Lỗi: " . ($result['error']['message'] ?? 'Không thể gửi email đặt lại mật khẩu.');
            }

        } else {
            if (empty($password)) {
                $error_message = "Vui lòng nhập đầy đủ email và mật khẩu.";
            } else {
                // --- XỬ LÝ ĐĂNG NHẬP QUA FIREBASE REST API ---
                $url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" . $firebaseApiKey;
                $data = json_encode([
                    "email" => $email,
                    "password" => $password,
                    "returnSecureToken" => true
                ]);

                $response = callFirebaseApi($url, $data);
                $result = json_decode($response, true);

                if (isset($result['idToken'])) {
                    // Đăng nhập thành công, lưu thông tin và tên hiển thị vào PHP Session
                    $_SESSION['user_email'] = $result['email'];
                    $_SESSION['user_name'] = !empty($result['displayName']) ? $result['displayName'] : "Người dùng";
                    $_SESSION['id_token'] = $result['idToken'];
                    $_SESSION['local_id'] = $result['localId'];

                    initializeUserData(
                        $result['localId'],
                        $_SESSION['user_name'],
                        $result['idToken']
                    );

                    // Chuyển hướng sang trang quản lý chính
                    header("Location: index.php");
                    exit();
                } else {
                    $error_message = "Đăng nhập thất bại: Email hoặc mật khẩu không đúng.";
                }
            }
        }
    }
}

function callFirebaseApi($url, $data) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

function initializeUserData($localId, $displayName, $idToken) {
    $profilePath = 'users/' . rawurlencode($localId) . '/profile';
    $profileUrl = FIREBASE_DB_URL . trim($profilePath, '/') . '.json?auth=' . urlencode($idToken);
    $profileResponse = callFirebaseDatabase($profileUrl, 'GET');
    $profile = json_decode($profileResponse, true);

    $profileData = [
        'display_name' => $displayName,
        'timezone' => 'Asia/Ho_Chi_Minh'
    ];
    if (!is_array($profile) || !isset($profile['created_at'])) {
        $profileData['created_at'] = time();
    }

    $userData = [
        'profile' => $profileData,
        'user_settings' => [
            'low_battery_threshold_percent' => 20,
            'offline_timeout_seconds' => 120
        ]
    ];
    $userUrl = FIREBASE_DB_URL . 'users/' . rawurlencode($localId) . '.json?auth=' . urlencode($idToken);
    callFirebaseDatabase($userUrl, 'PATCH', $userData);
}

function callFirebaseDatabase($url, $method, $payload = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
    }
    $response = curl_exec($ch);
    curl_close($ch);
    return $response === false ? '' : $response;
}
?>
<!DOCTYPE html>
<html lang="vi" class="bg-background">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medibox — Đăng nhập & Đăng ký (PHP Backend)</title>
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
                        primary: { DEFAULT: '#2563eb', foreground: '#ffffff' },
                        secondary: { DEFAULT: '#eff6ff', foreground: '#1e40af' },
                        muted: { DEFAULT: '#f8fafc', foreground: '#64748b' },
                        accent: { DEFAULT: '#e0f2fe', foreground: '#0369a1' },
                        border: '#e2e8f0',
                    }
                }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="style.css">
</head>

<body class="antialiased bg-background text-foreground min-h-screen flex items-center justify-center px-4">

    <div class="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div class="flex flex-col items-center text-center mb-8">
            <div class="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3 shadow-md">
                <i data-lucide="pill" class="w-6 h-6"></i>
            </div>
            <h1 class="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">MEDIBOX</h1>
            <h2 id="form-title" class="text-2xl font-semibold tracking-tight mt-1">Chào mừng trở lại</h2>
            <p id="form-subtitle" class="text-xs text-muted-foreground mt-1">Hệ thống quản lý thuốc</p>
        </div>

        <?php if (!empty($error_message)): ?>
            <div class="mb-4 p-3 rounded-xl bg-destructive/10 text-red-600 text-xs font-medium border border-red-200">
                <?php echo htmlspecialchars($error_message); ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($success_message)): ?>
            <div class="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-200">
                <?php echo htmlspecialchars($success_message); ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="login.php" class="space-y-4">
            <input type="hidden" name="action" id="form-action" value="login">

            <div id="name-field" class="hidden">
                <label class="text-xs font-medium text-muted-foreground mb-1 block">Họ và tên</label>
                <div class="relative flex items-center">
                    <i data-lucide="user" class="absolute left-3 w-4 h-4 text-muted-foreground"></i>
                    <input type="text" name="fullname" id="fullname" placeholder="Nhập họ và tên của bạn" class="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition">
                </div>
            </div>

            <div>
                <label class="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <div class="relative flex items-center">
                    <i data-lucide="mail" class="absolute left-3 w-4 h-4 text-muted-foreground"></i>
                    <input type="email" name="email" required placeholder="name@example.com" class="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition">
                </div>
            </div>

            <div id="password-field-container">
                <div class="flex items-center justify-between mb-1">
                    <label class="text-xs font-medium text-muted-foreground">Mật khẩu</label>
                    <button type="button" onclick="switchToForgotMode()" class="text-xs font-semibold text-primary hover:underline">Quên mật khẩu?</button>
                </div>
                <div class="relative flex items-center">
                    <i data-lucide="lock" class="absolute left-3 w-4 h-4 text-muted-foreground"></i>
                    <input type="password" name="password" id="password-input" minlength="6" placeholder="••••••••" class="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition">
                </div>
            </div>

            <button type="submit" id="submit-btn" class="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 mt-2">
                Đăng nhập
            </button>
        </form>

        <div class="mt-6 text-center border-t border-border pt-4">
            <p id="switch-text" class="text-xs text-muted-foreground">
                Chưa có tài khoản Medibox? 
                <button type="button" onclick="toggleAuthMode()" class="font-semibold text-primary hover:underline ml-1">Đăng ký ngay</button>
            </p>
        </div>
    </div>

    <script>
        let currentMode = 'login'; // 'login', 'signup', 'forgot'

        function toggleAuthMode() {
            if (currentMode === 'login') {
                setMode('signup');
            } else {
                setMode('login');
            }
        }

        function switchToForgotMode() {
            setMode('forgot');
        }

        function setMode(mode) {
            currentMode = mode;
            const title = document.getElementById('form-title');
            const subtitle = document.getElementById('form-subtitle');
            const nameField = document.getElementById('name-field');
            const passwordContainer = document.getElementById('password-field-container');
            const passwordInput = document.getElementById('password-input');
            const submitBtn = document.getElementById('submit-btn');
            const switchText = document.getElementById('switch-text');
            const formAction = document.getElementById('form-action');

            if (mode === 'login') {
                title.innerText = "Chào mừng trở lại";
                subtitle.innerText = "Hệ thống quản lý thuốc";
                nameField.classList.add('hidden');
                passwordContainer.classList.remove('hidden');
                passwordInput.setAttribute('required', 'true');
                submitBtn.innerText = "Đăng nhập";
                formAction.value = "login";
                switchText.innerHTML = `Chưa có tài khoản Medibox? <button type="button" onclick="toggleAuthMode()" class="font-semibold text-primary hover:underline ml-1">Đăng ký ngay</button>`;
            } else if (mode === 'signup') {
                title.innerText = "Tạo tài khoản mới";
                subtitle.innerText = "Đăng ký tài khoản an toàn qua hệ thống PHP.";
                nameField.classList.remove('hidden');
                passwordContainer.classList.remove('hidden');
                passwordInput.setAttribute('required', 'true');
                submitBtn.innerText = "Đăng ký";
                formAction.value = "signup";
                switchText.innerHTML = `Đã có tài khoản Medibox? <button type="button" onclick="toggleAuthMode()" class="font-semibold text-primary hover:underline ml-1">Đăng nhập ngay</button>`;
            } else if (mode === 'forgot') {
                title.innerText = "Khôi phục mật khẩu";
                subtitle.innerText = "Nhập email để nhận liên kết đặt lại mật khẩu.";
                nameField.classList.add('hidden');
                passwordContainer.classList.add('hidden');
                passwordInput.removeAttribute('required');
                submitBtn.innerText = "Gửi yêu cầu";
                formAction.value = "forgot";
                switchText.innerHTML = `Nhớ lại mật khẩu rồi? <button type="button" onclick="setMode('login')" class="font-semibold text-primary hover:underline ml-1">Đăng nhập ngay</button>`;
            }
            lucide.createIcons();
        }

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
        });
    </script>
</body>

</html>