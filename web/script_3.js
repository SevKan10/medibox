// Luôn giữ đúng bốn ngăn vật lý của thiết bị đang chọn.
const defaultMedications = [
  { slot: 1, name: 'Chưa thiết lập', detail: '', tone: 'empty', doses: [] },
  { slot: 2, name: 'Chưa thiết lập', detail: '', tone: 'empty', doses: [] },
  { slot: 3, name: 'Chưa thiết lập', detail: '', tone: 'empty', doses: [] },
  { slot: 4, name: 'Chưa thiết lập', detail: '', tone: 'empty', doses: [] }
];

function normalizeMedicationList(source) {
  const bySlot = new Map();
  (Array.isArray(source) ? source : []).forEach(medication => {
    const normalized = normalizeMedication(medication);
    if (Number.isInteger(normalized.slot) && normalized.slot >= 1 && normalized.slot <= 4) {
      bySlot.set(normalized.slot, normalized);
    }
  });
  return defaultMedications.map(defaultMedication =>
    bySlot.get(defaultMedication.slot) || normalizeMedication(defaultMedication)
  );
}

let medications = normalizeMedicationList(window.serverMedications);

let deviceState = {
  online: false,
  locked: true, // Trạng thái lệnh cuối cùng nếu ESP không ghi locked vào state.
  medicine_taken: null,
  last_seen: null
};

function normalizeMedication(medication) {
  const slot = medication.slot ?? medication.slot_id;
  const name = medication.name ?? medication.medicine_name ?? 'Chưa thiết lập';
  const detail = medication.detail ?? medication.note ?? ''; 
  if (Array.isArray(medication.doses)) {
    return {
      ...medication,
      slot,
      name,
      detail,
      enabled: medication.enabled ?? name !== 'Chưa thiết lập'
    };
  }

  const legacyQuantity = Number(detail.match(/\d+/)?.[0]) || 1;
  return {
    ...medication,
    slot,
    name,
    detail: detail.replace(/^\s*\d+\s*viên\s*[•-]?\s*/i, '').trim(),
    doses: medication.next && medication.next !== '--:--'
      ? [{ time: medication.next, quantity: legacyQuantity }]
      : []
  };
}

function getSchedules() {
  return medications.flatMap(medication => medication.doses.map((dose, doseIndex) => ({
    time: dose.time,
    name: medication.name,
    quantity: dose.quantity,
    slot: medication.slot,
    doseIndex,
    taken: dose.taken === true || deviceState.taken === true
  }))).sort((first, second) => first.time.localeCompare(second.time));
}

function getScheduleStatus(schedule) {
  if (schedule.taken) return { label: 'Đã lấy thuốc', done: true };

  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  const scheduledMinutes = hours * 60 + minutes;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (scheduledMinutes > currentMinutes) return { label: 'Sắp tới', active: true };
  return { label: 'Chưa lấy thuốc' };
}

function getSensorLabel() {
  const sensorState = deviceState.medicine_taken ?? deviceState.pill_taken ?? deviceState.taken;
  if (sensorState === true) return 'Đã lấy thuốc';
  if (sensorState === false) return 'Chưa lấy thuốc';
  return 'Đang chờ dữ liệu';
}

const navItems = [
  { label: 'Tổng quan', icon: 'pill' },
  { label: 'Lịch uống thuốc', icon: 'clock-3' },
  { label: 'Thiết bị Medibox', icon: 'settings-2' },
];

let activeNav = 'Tổng quan';
let locked = true;
let notifications = true;
const userId = window.serverUserId || 'Chưa xác định';
const userName = window.serverUserName || 'Người dùng';
// Giá trị tạm chỉ dùng trước khi danh sách ESP được tải từ Firebase.
let selectedDeviceId = null;
let devices = Object.entries(window.serverDevices || {}).map(([deviceId, state]) => ({
  ...state,
  device_id: deviceId
}));
let deviceListLoaded = devices.length > 0;

// Khởi tạo ứng dụng khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  if (devices.length) {
    selectedDeviceId = devices[0].device_id;
    deviceState = { ...deviceState, ...devices[0] };
  }
  renderSidebar();
  renderMobileMenu();
  renderMainContent();
  setupEventListeners();
  updateRealtimeClock(); // Chạy ngay lập tức khi tải trang
  setInterval(updateRealtimeClock, 1000); // Cập nhật lại mỗi giây
  loadDevices();
  readDeviceStatus();
  setInterval(readDeviceStatus, 15000); // Web chỉ đọc lại trạng thái mỗi 15 giây
  lucide.createIcons();
});

// Hàm hiển thị thời gian Realtime ở Header
function updateRealtimeClock() {
  const clockElement = document.getElementById('realtime-clock');
  if (!clockElement) return;

  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  };
  
  clockElement.innerText = now.toLocaleDateString('vi-VN', options);
}

// Render Sidebar Desktop
function renderSidebar() {
  const container = document.getElementById('sidebar-nav');
  if (!container) return;
  
  let html = `<p class="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Không gian của bạn</p>`;
  navItems.forEach(item => {
    const isActive = activeNav === item.label;
    html += `
      <button onclick="handleNavClick('${item.label}')" class="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}">
        <i data-lucide="${item.icon}" class="w-4 h-4"></i>
        <span>${item.label}</span>
        ${isActive ? '<i data-lucide="chevron-right" class="w-4 h-4 ml-auto"></i>' : ''}
      </button>
    `;
  });
  container.innerHTML = html;
  lucide.createIcons();
}

// Render Mobile Menu
function renderMobileMenu() {
  const container = document.getElementById('mobile-menu');
  if (!container) return;
  
  let html = '';
  navItems.forEach(item => {
    html += `
      <button onclick="handleNavClick('${item.label}'); toggleMobileMenu(false);" class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-accent">
        <i data-lucide="${item.icon}" class="w-4 h-4"></i>
        <span>${item.label}</span>
      </button>
    `;
  });
  container.innerHTML = html;
  lucide.createIcons();
}

// Điều phối hiển thị giao diện tùy thuộc vào Tab đang chọn
function renderMainContent() {
  const contentContainer = document.getElementById('app-content');
  if (!contentContainer) return;

  const selectedDevice = devices.find(device => device.device_id === selectedDeviceId);
  const displayedDeviceId = selectedDevice?.device_id || selectedDeviceId || 'Chưa chọn thiết bị';

  if (activeNav === 'Tổng quan') {
    contentContainer.innerHTML = `
      <div class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
              <p class="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tổng quan</p>
              <h2 class="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Hôm nay của bạn</h2>
              <p class="mt-2 text-sm text-muted-foreground">Mọi thứ đang hoạt động ổn định. Đây là tình trạng hộp thuốc của bạn.</p>
          </div>
          <button onclick="handleNavClick('Lịch uống thuốc')" class="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
              <i data-lucide="settings-2" class="w-4 h-4"></i> Thiết lập nhanh
          </button>
      </div>

      <section class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl bg-primary p-5 text-primary-foreground md:col-span-2">
              <div class="flex items-start justify-between">
                  <div>
                      <p class="text-sm opacity-75">Liều tiếp theo</p>
                      <p class="mt-2 text-4xl font-semibold tracking-tight">12:00 <span class="text-base font-normal opacity-75">trưa nay</span></p>
                      <p class="mt-1 text-sm opacity-80">Omega 3 · 2 viên</p>
                  </div>
                  <div class="rounded-xl bg-primary-foreground/15 p-3">
                      <i data-lucide="clock-3" class="w-5 h-5"></i>
                  </div>
              </div>
              <div class="mt-6 flex items-center gap-2 border-t border-primary-foreground/15 pt-4 text-xs opacity-80">
                  <span class="size-2 rounded-full bg-primary-foreground"></span> Đang chờ Medibox trộn thuốc
                  <span class="ml-auto font-mono">CÒN 02:18:42</span>
              </div>
          </div>

          <div class="rounded-2xl border border-border bg-card p-5">
              <div class="flex items-center justify-between">
                  <p class="text-sm font-medium">Thiết bị</p>
                    <span class="flex items-center gap-1.5 text-xs font-semibold ${deviceState.online ? 'text-primary' : 'text-destructive'}">
                      <span class="size-2 rounded-full ${deviceState.online ? 'bg-primary' : 'bg-destructive'}"></span> ${deviceState.online ? 'Trực tuyến' : 'Không trực tuyến'}
                  </span>
              </div>
              <div class="mt-5 flex items-end justify-between">
                  <div>
                      <p class="text-xl font-semibold">${displayedDeviceId}</p>
                      <p class="mt-1 text-xs text-muted-foreground">${deviceState.last_seen ? `Cập nhật ${deviceState.last_seen}` : 'Chưa nhận dữ liệu từ ESP'}</p>
                  </div>
                  <i data-lucide="${deviceState.online ? 'wifi' : 'wifi-off'}" class="w-5 h-5 ${deviceState.online ? 'text-primary' : 'text-destructive'}"></i>
              </div>
              <div class="mt-5 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs text-secondary-foreground">
                  <i data-lucide="activity" class="w-4 h-4"></i> Cảm biến: ${getSensorLabel()}
              </div>
          </div>
      </section>

      <section class="mt-8">
          <div class="mb-4 flex items-center justify-between">
              <div>
                  <h3 class="text-lg font-semibold">Các ngăn thuốc</h3>
                  <p class="text-sm text-muted-foreground">4 ngăn hệ thống</p>
              </div>
          </div>
          <div id="medications-grid" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"></div>
      </section>

      <section class="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div class="rounded-2xl border border-border bg-card p-5">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">Lịch uống hôm nay (Chỉ xem)</h3>
                      <p class="text-sm text-muted-foreground">Đồng bộ từ hệ thống</p>
                  </div>
              </div>
              <div class="flex flex-col gap-3" id="schedule-list"></div>
          </div>

          <div class="rounded-2xl border border-border bg-card p-5">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">An toàn khoang thuốc</h3>
                      <p class="text-sm text-muted-foreground">Trạng thái khóa hiện tại</p>
                  </div>
                  <i data-lucide="shield-check" class="w-5 h-5 text-primary"></i>
              </div>
              <div class="flex items-center justify-between rounded-xl p-4 bg-secondary">
                  <div class="flex items-center gap-3">
                      <span class="text-primary">
                          <i data-lucide="${locked ? 'lock-keyhole' : 'unlock-keyhole'}" class="w-5 h-5"></i>
                      </span>
                      <div>
                          <p class="text-sm font-semibold">${locked ? 'Đang khóa' : 'Đang mở'}</p>
                          <p class="text-xs text-muted-foreground">Vào tab 'Thiết bị Medibox' để điều khiển</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>
    `;
    renderMedicationsCards('medications-grid', false);
    renderScheduleRows('schedule-list');

  } else if (activeNav === 'Lịch uống thuốc') {
    contentContainer.innerHTML = `
      <div class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
              <p class="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Quản lý lịch</p>
              <h2 class="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Lịch uống & Cấu hình thuốc</h2>
              <p class="mt-2 text-sm text-muted-foreground">Bạn có thể chỉnh sửa lịch uống thuốc và các ngăn chứa tại đây.</p>
          </div>
          <button onclick="openEditModal()" class="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
              <i data-lucide="edit-3" class="w-4 h-4"></i> Chỉnh sửa toàn bộ ngăn
          </button>
      </div>

      <section class="mt-4">
          <div class="mb-4 flex items-center justify-between">
              <div>
                  <h3 class="text-lg font-semibold">Các ngăn thuốc (Nhấn vào ngăn để sửa)</h3>
                  <p class="text-sm text-muted-foreground">4 ngăn cấu hình thiết bị</p>
              </div>
              <button onclick="openEditModal()" class="text-sm font-semibold text-primary hover:underline">Sửa ngăn thuốc →</button>
          </div>
          <div id="medications-grid-editable" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"></div>
      </section>

      <section class="mt-8">
          <div class="rounded-2xl border border-border bg-card p-5">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">Lịch trình uống chi tiết trong ngày</h3>
                      <p class="text-sm text-muted-foreground">Đồng bộ tự động</p>
                  </div>
              </div>
              <div class="flex flex-col gap-3" id="schedule-list-editable"></div>
          </div>
      </section>
    `;
    renderMedicationsCards('medications-grid-editable', true);
    renderScheduleRows('schedule-list-editable');

  } else if (activeNav === 'Thiết bị Medibox') {
    contentContainer.innerHTML = `
      <div class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
              <p class="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Phần cứng & Thiết bị</p>
              <h2 class="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Điều khiển Medibox</h2>
              <p class="mt-2 text-sm text-muted-foreground">Quản lý kết nối phần cứng và khóa bảo vệ khoang thuốc trực tiếp.</p>
          </div>
      </div>

        <section class="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Thiết bị của tôi</h3>
              <p class="text-sm text-muted-foreground">Mỗi thiết bị có dữ liệu và trạng thái riêng.</p>
            </div>
            <span id="device-count" class="text-xs font-semibold text-muted-foreground">Trạng thái thiết bị</span>
          </div>
          <div id="device-list" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"></div>
        </section>

        <section class="grid gap-6 lg:grid-cols-2">
          <!-- Khóa phần cứng -->
          <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">Bảo mật & Khóa khoang</h3>
                      <p class="text-sm text-muted-foreground">Thao tác đóng/mở trực tiếp hộp thuốc</p>
                  </div>
                  <i data-lucide="shield-check" class="w-6 h-6 text-primary"></i>
              </div>
              <div id="lock-card" class="flex items-center justify-between rounded-xl p-5 ${locked ? 'bg-secondary' : 'bg-accent'} transition-colors">
                  <div class="flex items-center gap-3">
                      <span id="lock-icon-wrapper" class="text-primary">
                          <i data-lucide="${locked ? 'lock-keyhole' : 'unlock-keyhole'}" class="w-6 h-6"></i>
                      </span>
                      <div>
                          <p id="lock-title" class="text-base font-semibold">${locked ? 'Khoang thuốc đang khóa' : 'Khoang thuốc đang mở'}</p>
                          <p id="lock-desc" class="text-xs text-muted-foreground">${locked ? 'An toàn, trẻ nhỏ không mở được' : 'Cẩn thận khi thao tác khay'}</p>
                      </div>
                  </div>
                  <button id="lock-toggle-btn" class="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                      ${locked ? 'Mở khóa ngay' : 'Khóa lại ngay'}
                  </button>
              </div>
              <p class="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <i data-lucide="database" class="w-4 h-4 text-primary"></i> Trạng thái được lưu trong Firebase Realtime Database
              </p>
          </div>

          <!-- Cài đặt tài khoản -->
          <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">Cài đặt tài khoản</h3>
                      <p class="text-sm text-muted-foreground">Thông tin người dùng</p>
                  </div>
                  <i data-lucide="user-round" class="w-6 h-6 text-muted-foreground"></i>
              </div>
              <div class="space-y-4">
                  <div>
                    <label class="text-xs font-medium text-muted-foreground">Firebase User ID</label>
                    <div class="mt-1 flex gap-2">
                      <input id="firebase-user-id" type="text" readonly value="${userId}" class="min-w-0 flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                      <button type="button" onclick="copyUserId()" title="Sao chép User ID" aria-label="Sao chép User ID" class="rounded-lg border border-border px-3 py-2 text-primary hover:bg-accent">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                      </button>
                    </div>
                    <p class="mt-1 text-[11px] text-muted-foreground">Dán UID này vào firmware ESP32 khi cài đặt thiết bị.</p>
                  </div>
                  <div>
                      <label class="text-xs font-medium text-muted-foreground">Tên hiển thị</label>
                        <input type="text" disabled value="${userName}" class="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  </div>
                  <div class="pt-2">
                      <a href="logout.php" class="inline-flex items-center gap-2 rounded-xl bg-destructive/10 text-destructive px-4 py-2 text-xs font-semibold hover:bg-destructive/20 transition">
                          <i data-lucide="log-out" class="w-4 h-4"></i> Đăng xuất tài khoản
                      </a>
                  </div>
              </div>
          </div>
      </section>
    `;
    setupLockButtonEvent();
    renderDeviceList();
  }

  lucide.createIcons();
}

// Render các thẻ ngăn thuốc
function renderMedicationsCards(containerId, isClickable) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  grid.innerHTML = medications.map(med => {
    const nextDose = med.doses[0];
    const doseSummary = med.doses.length
      ? med.doses.map(dose => `${dose.time} (${dose.quantity} viên)`).join(', ')
      : '--:--';
    let toneClass = 'bg-muted text-muted-foreground';
    if (med.tone === 'mint') toneClass = 'bg-emerald-500/10 text-emerald-600';
    if (med.tone === 'blue') toneClass = 'bg-blue-500/10 text-blue-600';
    if (med.tone === 'coral') toneClass = 'bg-orange-500/10 text-orange-600';

    const clickAttr = isClickable ? `onclick="openEditModal()"` : '';
    const cursorClass = isClickable ? 'cursor-pointer hover:border-primary/50' : '';

    return `
      <article ${clickAttr} class="rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md ${cursorClass}">
        <div class="flex items-center justify-between">
          <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ngăn ${med.slot}</span>
          <span class="flex size-9 items-center justify-center rounded-xl ${toneClass}">
            <i data-lucide="pill" class="w-4 h-4"></i>
          </span>
        </div>
        <h4 class="mt-4 truncate text-sm font-semibold">${med.name}</h4>
        <p class="mt-1 truncate text-xs text-muted-foreground">${med.detail}</p>
        <div class="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span class="text-[11px] text-muted-foreground">Giờ uống</span>
          <span class="font-mono text-xs font-semibold" title="${doseSummary}">${nextDose ? `${nextDose.time} (${nextDose.quantity})` : '--:--'}</span>
        </div>
      </article>
    `;
  }).join('');
}

// Render danh sách lịch uống
function renderScheduleRows(containerId) {
  const list = document.getElementById(containerId);
  if (!list) return;

  const schedules = getSchedules();
  list.innerHTML = schedules.length ? schedules.map(schedule => {
    const status = getScheduleStatus(schedule);
    return `
    <div class="flex items-center gap-4 rounded-xl px-3 py-3 ${status.active ? 'bg-primary/8 ring-1 ring-primary/25' : ''}">
      <span class="w-12 font-mono text-xs font-semibold text-muted-foreground">${schedule.time}</span>
      <span class="size-2 rounded-full ${status.done ? 'bg-primary' : status.active ? 'bg-primary ring-4 ring-primary/15' : 'bg-border'}"></span>
      <div class="flex-1">
        <p class="text-sm font-semibold">${schedule.name} · ${schedule.quantity} viên</p>
        <p class="text-xs text-muted-foreground">Ngăn ${schedule.slot}</p>
      </div>
      <span class="text-xs font-medium ${status.done || status.active ? 'text-primary' : 'text-muted-foreground'}">${status.label}</span>
    </div>
  `;
  }).join('') : '<p class="px-3 py-3 text-sm text-muted-foreground">Chưa có lịch uống.</p>';
}

// Mở Modal Chỉnh Sửa
window.openEditModal = function() {
  const modal = document.getElementById('edit-modal');
  const container = document.getElementById('modal-med-list');
  if (!modal || !container) return;

  container.innerHTML = medications.map((med, index) => {
    const doses = med.doses.length ? med.doses : [{ time: '', quantity: 1 }];
    return `
      <div class="rounded-xl border border-border p-3.5 bg-secondary/30 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-semibold uppercase text-primary">Ngăn ${med.slot}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] text-muted-foreground mb-1 block">Tên thuốc</label>
            <input type="text" id="med-name-${index}" value="${med.name}" class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary">
          </div>
          <div>
            <label class="text-[11px] text-muted-foreground mb-1 block">Note (trước/sau ăn hoặc khác)</label>
            <input type="text" id="med-note-${index}" value="${med.detail || ''}" placeholder="Ví dụ: Sau ăn sáng" class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary">
          </div>
        </div>
        <div>
          <div class="mb-1 flex items-center justify-between">
            <label class="text-[11px] text-muted-foreground">Lịch uống và số viên</label>
            <button type="button" onclick="addDoseRow(${index})" class="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Thêm giờ
            </button>
          </div>
          <div id="dose-list-${index}" class="flex flex-col gap-2">
            ${doses.map((dose, doseIndex) => doseRowTemplate(index, doseIndex, dose)).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function doseRowTemplate(medicationIndex, doseIndex, dose) {
  return `
    <div class="flex items-end gap-2" data-dose-row>
      <div class="flex-1">
        <label class="text-[10px] text-muted-foreground mb-1 block">Giờ ${doseIndex + 1}</label>
        <input type="time" data-dose-time value="${dose.time || ''}" class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary">
      </div>
      <div class="w-24">
        <label class="text-[10px] text-muted-foreground mb-1 block">Số viên</label>
        <input type="number" min="1" step="1" data-dose-quantity value="${dose.quantity || 1}" class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary">
      </div>
      <button type="button" onclick="this.closest('[data-dose-row]').remove()" aria-label="Xóa giờ uống" class="mb-0.5 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-destructive">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `;
}

window.addDoseRow = function(medicationIndex) {
  const list = document.getElementById(`dose-list-${medicationIndex}`);
  if (!list) return;
  const doseIndex = list.querySelectorAll('[data-dose-row]').length;
  list.insertAdjacentHTML('beforeend', doseRowTemplate(medicationIndex, doseIndex, { time: '', quantity: 1 }));
  lucide.createIcons();
}

// Đóng Modal Chỉnh Sửa
window.closeEditModal = function() {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.add('hidden');
}

// Lưu thay đổi từ Modal vào Firebase Realtime Database
window.saveMedications = function() {
  if (!selectedDeviceId) {
    alert('Chưa có thiết bị để lưu lịch.');
    return;
  }

  let updatedMedications = [];
  medications.forEach((med, index) => {
    const nameInput = document.getElementById(`med-name-${index}`);
    const noteInput = document.getElementById(`med-note-${index}`);
    const doseList = document.getElementById(`dose-list-${index}`);

    if (nameInput && noteInput && doseList) {
      const doses = [...doseList.querySelectorAll('[data-dose-row]')]
        .map(row => ({
          time: row.querySelector('[data-dose-time]').value,
          quantity: Number(row.querySelector('[data-dose-quantity]').value)
        }))
        .filter(dose => dose.time && dose.quantity > 0);

      updatedMedications.push({
        slot: med.slot,
        name: nameInput.value,
        detail: noteInput.value,
        doses,
        tone: nameInput.value !== 'Chưa thiết lập' ? (index === 3 ? 'mint' : 'blue') : 'empty'
      });
    }
  });

  fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_medications',
      device_id: selectedDeviceId,
      medications: updatedMedications
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      medications = updatedMedications;
      renderMainContent();
      closeEditModal();
      alert("Đã lưu cấu hình và lịch trình thành công!");
    } else {
      alert("Lỗi khi lưu: " + (data.message || 'Không xác định'));
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("Lỗi kết nối đến server backend!");
  });
}

// Chuyển tab qua lại
window.handleNavClick = function(label) {
  activeNav = label;
  renderSidebar();
  renderMainContent();
  if (label === 'Thiết bị Medibox') loadDevices();
}

function toggleMobileMenu(forceState) {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  if (typeof forceState === 'boolean') {
    if (forceState) menu.classList.remove('hidden');
    else menu.classList.add('hidden');
  } else {
    menu.classList.toggle('hidden');
  }
}

// Đọc trạng thái khóa đã lưu trong Firebase Realtime Database
function readDeviceStatus() {
  if (!selectedDeviceId) return;

  fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'read_device_state', device_id: selectedDeviceId })
  })
    .then(async response => {
      const body = await response.text();
      let data;
      try {
        data = JSON.parse(body);
      } catch (error) {
        throw new Error(`API trả về HTTP ${response.status}, không phải JSON`);
      }
      if (!response.ok) throw new Error(data.message || `API HTTP ${response.status}`);
      return data;
    })
    .then(data => {
      if (data.status !== 'success') {
        console.warn('Firebase status error:', data.message || data);
        return;
      }

      const deviceStatus = data.device_status || {};
      deviceState = { ...deviceState, ...deviceStatus };
      const listedDevice = devices.find(device => device.device_id === selectedDeviceId);
      if (listedDevice) Object.assign(listedDevice, deviceStatus);
      const deviceLocked = typeof deviceStatus === 'object'
        ? (deviceStatus.locked ?? deviceStatus.lock_state ?? deviceStatus.lock ?? deviceStatus.doorLocked)
        : undefined;

      const normalizedLocked = typeof deviceLocked === 'string'
        ? ['locked', 'lock', 'true', '1'].includes(deviceLocked.toLowerCase())
        : deviceLocked;

      if (typeof normalizedLocked === 'boolean' && normalizedLocked !== locked) {
        locked = normalizedLocked;
      }
      if (activeNav === 'Tổng quan' || activeNav === 'Thiết bị Medibox') renderMainContent();
    })
    .catch(error => console.warn('Không đọc được trạng thái Firebase:', error));
}

function setupLockButtonEvent() {
  const lockBtn = document.getElementById('lock-toggle-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      if (!selectedDeviceId) {
        alert('Chưa chọn thiết bị.');
        return;
      }

      const newState = !locked;
      lockBtn.disabled = true;
      lockBtn.textContent = 'Đang gửi...';
      
      fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'control_lock',
          device_id: selectedDeviceId,
          locked: newState
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          locked = data.lock_state;
          renderMainContent();
          readDeviceStatus();
        } else {
          alert("Không thể lưu trạng thái khóa: " + (data.message || 'Lỗi không xác định'));
          renderMainContent();
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Lỗi kết nối Firebase: ' + error.message);
        renderMainContent();
      });
    });
  }
}

function setupEventListeners() {
  const menuToggle = document.getElementById('menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => toggleMobileMenu());
  }

  const notifBtn = document.getElementById('notif-btn');
  const notifDot = document.getElementById('notif-dot');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      notifications = !notifications;
      if (notifDot) notifDot.style.display = notifications ? 'block' : 'none';
      alert(notifications ? 'Đã bật thông báo' : 'Đã tắt thông báo');
    });
  }
}

window.copyUserId = function() {
  if (!navigator.clipboard) {
    alert('Trình duyệt không hỗ trợ sao chép tự động.');
    return;
  }

  navigator.clipboard.writeText(userId)
    .then(() => alert('Đã sao chép Firebase User ID.'))
    .catch(() => alert('Không thể sao chép User ID.'));
}

function loadDevices() {
  const count = document.getElementById('device-count');
  const list = document.getElementById('device-list');
  if (!list) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list_devices' }),
    signal: controller.signal
  })
    .then(async response => {
      const body = await response.text();
      let data;
      try {
        data = JSON.parse(body);
      } catch (error) {
        throw new Error(`API trả về HTTP ${response.status}, không phải JSON`);
      }
      if (!response.ok) throw new Error(data.message || `API HTTP ${response.status}`);
      return data;
    })
    .then(data => {
      if (data.status !== 'success') throw new Error(data.message || 'Không đọc được danh sách thiết bị');
      devices = data.devices || [];
      deviceListLoaded = true;
      if (!devices.some(device => device.device_id === selectedDeviceId) && devices.length) {
        selectedDeviceId = devices[0].device_id;
        deviceState = { ...deviceState, ...devices[0] };
        readDeviceStatus();
      }
      loadDeviceMedications();
      renderDeviceList();
    })
    .catch(error => {
      const message = error.name === 'AbortError'
        ? 'Hết thời gian chờ Firebase.'
        : error.message;
      if (count) count.textContent = 'Không trực tuyến';
      if (list) list.innerHTML = `<p class="text-sm text-muted-foreground">${message}</p>`;
      console.warn('Không đọc được danh sách thiết bị:', error);
    })
    .finally(() => clearTimeout(timeoutId));
}

function renderDeviceList() {
  const list = document.getElementById('device-list');
  const count = document.getElementById('device-count');
  if (!list) return;
  if (count) count.textContent = `${devices.length} thiết bị`;
  list.innerHTML = devices.length ? devices.map(device => `
    <div class="rounded-xl border ${device.device_id === selectedDeviceId ? 'border-primary ring-1 ring-primary/20' : 'border-border'} p-3">
      <div class="flex items-start gap-3">
        <button type="button" onclick="selectDevice('${device.device_id}')" class="min-w-0 flex-1 text-left">
          <p class="truncate text-sm font-semibold">${device.device_id}</p>
          <p class="truncate text-xs text-muted-foreground">${device.mac_address || device.mac || 'Chưa có MAC'}</p>
          <p class="mt-1 text-xs ${device.online ? 'text-primary' : 'text-destructive'}">${device.online ? 'Trực tuyến' : 'Không trực tuyến'}</p>
        </button>
        <button type="button" onclick="deleteDevice('${device.device_id}')" title="Xóa thiết bị" aria-label="Xóa thiết bị" class="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-destructive">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
      <div class="mt-3 flex items-center justify-between border-t border-border pt-2">
        <span class="flex items-center gap-1.5 text-xs ${device.locked !== false ? 'text-primary' : 'text-orange-600'}">
          <i data-lucide="${device.locked !== false ? 'lock-keyhole' : 'unlock-keyhole'}" class="w-3.5 h-3.5"></i>
          ${device.locked !== false ? 'Đang khóa' : 'Đang mở'}
        </span>
        <button type="button" onclick="toggleDeviceLock('${device.device_id}', ${device.locked !== false})" class="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-accent">
          ${device.locked === false ? 'Khóa lại' : 'Mở khóa'}
        </button>
      </div>
    </div>
  `).join('') : '<p class="text-sm text-destructive">Không trực tuyến</p>';
  lucide.createIcons();
}

window.selectDevice = function(deviceId) {
  selectedDeviceId = deviceId;
  const selected = devices.find(device => device.device_id === deviceId);
  if (selected) deviceState = { ...deviceState, ...selected };
  renderDeviceList();
  loadDeviceMedications();
  readDeviceStatus();
  if (activeNav === 'Thiết bị Medibox') renderMainContent();
}

window.toggleDeviceLock = function(deviceId, currentLocked) {
  const lockedState = !currentLocked;
  fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'control_lock',
      device_id: deviceId,
      locked: lockedState
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status !== 'success') throw new Error(data.message || 'Không thể điều khiển thiết bị');
      const device = devices.find(item => item.device_id === deviceId);
      if (device) device.locked = data.lock_state;
      if (deviceId === selectedDeviceId) locked = data.lock_state;
      renderDeviceList();
      if (deviceId === selectedDeviceId && activeNav === 'Thiết bị Medibox') renderMainContent();
    })
    .catch(error => alert(error.message));
}

window.deleteDevice = function(deviceId) {
  if (!confirm(`Xóa toàn bộ dữ liệu của ${deviceId}?`)) return;
  fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_device', device_id: deviceId })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status !== 'success') throw new Error(data.message || 'Không thể xóa thiết bị');
      devices = devices.filter(device => device.device_id !== deviceId);
      if (selectedDeviceId === deviceId) {
        selectedDeviceId = devices[0]?.device_id || null;
        deviceState = { online: false, locked: true, medicine_taken: null, last_seen: null };
        readDeviceStatus();
      }
      renderDeviceList();
      if (activeNav === 'Thiết bị Medibox') renderMainContent();
    })
    .catch(error => alert(error.message));
}

function loadDeviceMedications() {
  if (!selectedDeviceId) return;

  fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'read_medications', device_id: selectedDeviceId })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status !== 'success' || !Array.isArray(data.medications)) return;
      medications = normalizeMedicationList(data.medications);
      renderMainContent();
    })
    .catch(error => console.warn('Không đọc được lịch thiết bị:', error));
}

