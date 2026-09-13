// Dữ liệu mẫu ban đầu
let medications = [
  { slot: 1, name: 'Vitamin D3', detail: '1 viên • Sau bữa sáng', tone: 'mint', next: '07:00' },
  { slot: 2, name: 'Omega 3', detail: '2 viên • Sau bữa trưa', tone: 'blue', next: '12:00' },
  { slot: 3, name: 'Metformin', detail: '1 viên • Sau bữa tối', tone: 'coral', next: '19:00' },
  { slot: 4, name: 'Chưa thiết lập', detail: 'Thêm loại thuốc', tone: 'empty', next: '--:--' },
  { slot: 5, name: 'Chưa thiết lập', detail: 'Thêm loại thuốc', tone: 'empty', next: '--:--' },
];

const schedules = [
  { time: '07:00', name: 'Vitamin D3', status: 'Đã uống', done: true },
  { time: '12:00', name: 'Omega 3', status: 'Sắp tới', active: true },
  { time: '19:00', name: 'Metformin', status: 'Đang chờ', done: false },
];

const navItems = [
  { label: 'Tổng quan', icon: 'pill' },
  { label: 'Lịch uống thuốc', icon: 'clock-3' },
  { label: 'Thiết bị Medibox', icon: 'settings-2' },
];

let activeNav = 'Tổng quan';
let locked = true;
let notifications = true;

// Khởi tạo ứng dụng khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  renderMobileMenu();
  renderMainContent();
  setupEventListeners();
  lucide.createIcons();
});

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

  if (activeNav === 'Tổng quan') {
    contentContainer.innerHTML = `
      <div class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
              <p class="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Tổng quan</p>
              <h2 class="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Hôm nay của bạn</h2>
              <p class="mt-2 text-sm text-muted-foreground">Mọi thứ đang hoạt động ổn định. Đây là tình trạng hộp thuốc của bạn.</p>
          </div>
          <button class="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
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
                  <span class="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span class="size-2 rounded-full bg-primary"></span> Trực tuyến
                  </span>
              </div>
              <div class="mt-5 flex items-end justify-between">
                  <div>
                      <p class="text-xl font-semibold">Medibox 01</p>
                      <p class="mt-1 text-xs text-muted-foreground">Cập nhật 1 phút trước</p>
                  </div>
                  <i data-lucide="wifi" class="w-5 h-5 text-primary"></i>
              </div>
              <div class="mt-5 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs text-secondary-foreground">
                  <i data-lucide="thermometer" class="w-4 h-4"></i> Nhiệt độ ổn định · 24°C
              </div>
          </div>
      </section>

      <section class="mt-8">
          <div class="mb-4 flex items-center justify-between">
              <div>
                  <h3 class="text-lg font-semibold">Các ngăn thuốc</h3>
                  <p class="text-sm text-muted-foreground">5 ngăn · 3 đang sử dụng</p>
              </div>
          </div>
          <div id="medications-grid" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"></div>
      </section>

      <section class="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div class="rounded-2xl border border-border bg-card p-5">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">Lịch uống hôm nay (Chỉ xem)</h3>
                      <p class="text-sm text-muted-foreground">Thứ Tư, 04/09</p>
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
                  <p class="text-sm text-muted-foreground">5 ngăn cấu hình thiết bị</p>
              </div>
              <button onclick="openEditModal()" class="text-sm font-semibold text-primary hover:underline">Sửa ngăn thuốc →</button>
          </div>
          <div id="medications-grid-editable" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"></div>
      </section>

      <section class="mt-8">
          <div class="rounded-2xl border border-border bg-card p-5">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">Lịch trình uống chi tiết trong ngày</h3>
                      <p class="text-sm text-muted-foreground">Thứ Tư, 04/09</p>
                  </div>
                  <button onclick="openEditModal()" class="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-accent">Thêm giờ uống</button>
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

          <!-- Cài đặt tài khoản (Placeholder phát triển sau) -->
          <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div class="mb-5 flex items-center justify-between">
                  <div>
                      <h3 class="text-lg font-semibold">Cài đặt tài khoản</h3>
                      <p class="text-sm text-muted-foreground">Quản lý hồ sơ người dùng & phân quyền</p>
                  </div>
                  <i data-lucide="user-round" class="w-6 h-6 text-muted-foreground"></i>
              </div>
              <div class="space-y-4">
                  <div>
                      <label class="text-xs font-medium text-muted-foreground">Tên hiển thị</label>
                      <input type="text" disabled value="Minh Anh" class="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  </div>
                  <div>
                      <label class="text-xs font-medium text-muted-foreground">Vai trò hệ thống</label>
                      <input type="text" disabled value="Người chăm sóc chính (Caregiver)" class="mt-1 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  </div>
                  <div class="pt-2">
                      <button disabled class="rounded-xl border border-border px-4 py-2 text-xs font-semibold opacity-50 cursor-not-allowed">Cập nhật tài khoản (Sắp ra mắt)</button>
                  </div>
              </div>
          </div>
      </section>
    `;
    setupLockButtonEvent();
  }

  lucide.createIcons();
}

// Render các thẻ ngăn thuốc
function renderMedicationsCards(containerId, isClickable) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  grid.innerHTML = medications.map(med => {
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
          <span class="text-[11px] text-muted-foreground">Liều kế tiếp</span>
          <span class="font-mono text-xs font-semibold">${med.next}</span>
        </div>
      </article>
    `;
  }).join('');
}

// Render danh sách lịch uống
function renderScheduleRows(containerId) {
  const list = document.getElementById(containerId);
  if (!list) return;

  list.innerHTML = schedules.map(sch => `
    <div class="flex items-center gap-4 rounded-xl px-3 py-3 ${sch.active ? 'bg-primary/8 ring-1 ring-primary/25' : ''}">
      <span class="w-12 font-mono text-xs font-semibold text-muted-foreground">${sch.time}</span>
      <span class="size-2 rounded-full ${sch.done ? 'bg-primary' : sch.active ? 'bg-primary ring-4 ring-primary/15' : 'bg-border'}"></span>
      <div class="flex-1">
        <p class="text-sm font-semibold">${sch.name}</p>
        <p class="text-xs text-muted-foreground">${sch.done ? 'Đã xác nhận lấy thuốc' : sch.active ? 'Sẽ trộn tự động' : 'Chưa đến giờ'}</p>
      </div>
      <span class="text-xs font-medium ${sch.done || sch.active ? 'text-primary' : 'text-muted-foreground'}">${sch.status}</span>
    </div>
  `).join('');
}

// Mở Modal Chỉnh Sửa
window.openEditModal = function() {
  const modal = document.getElementById('edit-modal');
  const container = document.getElementById('modal-med-list');
  if (!modal || !container) return;

  container.innerHTML = medications.map((med, index) => `
    <div class="rounded-xl border border-border p-3.5 bg-secondary/30 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs font-semibold uppercase text-primary">Ngăn ${med.slot}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label class="text-[11px] text-muted-foreground mb-1 block">Tên thuốc</label>
          <input type="text" id="med-name-${index}" value="${med.name}" class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary">
        </div>
        <div>
          <label class="text-[11px] text-muted-foreground mb-1 block">Chi tiết liều</label>
          <input type="text" id="med-detail-${index}" value="${med.detail}" class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary">
        </div>
        <div>
          <label class="text-[11px] text-muted-foreground mb-1 block">Giờ uống</label>
          <input type="text" id="med-next-${index}" value="${med.next}" class="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary">
        </div>
      </div>
    </div>
  `).join('');

  modal.classList.remove('hidden');
}

// Đóng Modal Chỉnh Sửa
window.closeEditModal = function() {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.add('hidden');
}

// Lưu thay đổi từ Modal
window.saveMedications = function() {
  medications.forEach((med, index) => {
    const nameInput = document.getElementById(`med-name-${index}`);
    const detailInput = document.getElementById(`med-detail-${index}`);
    const nextInput = document.getElementById(`med-next-${index}`);

    if (nameInput && detailInput && nextInput) {
      med.name = nameInput.value;
      med.detail = detailInput.value;
      med.next = nextInput.value;
      
      if (med.name !== 'Chưa thiết lập' && med.tone === 'empty') {
        med.tone = index === 3 ? 'mint' : 'blue';
      }
    }
  });

  renderMainContent();
  closeEditModal();
}

// Chuyển tab qua lại
window.handleNavClick = function(label) {
  activeNav = label;
  renderSidebar();
  renderMainContent();
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

// Xử lý nút khóa phần cứng
function setupLockButtonEvent() {
  const lockBtn = document.getElementById('lock-toggle-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      locked = !locked;
      renderMainContent(); // Tự động load lại giao diện trạng thái khóa mới
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