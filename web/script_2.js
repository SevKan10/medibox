// Thay thế hàm saveMedications cũ bằng hàm gọi API Backend PHP bảo mật
window.saveMedications = function() {
  let updatedMedications = [];
  
  medications.forEach((med, index) => {
    const nameInput = document.getElementById(`med-name-${index}`);
    const detailInput = document.getElementById(`med-detail-${index}`);
    const nextInput = document.getElementById(`med-next-${index}`);

    if (nameInput && detailInput && nextInput) {
      updatedMedications.push({
        slot: med.slot,
        name: nameInput.value,
        detail: detailInput.value,
        next: nextInput.value,
        tone: nameInput.value !== 'Chưa thiết lập' ? (index === 3 ? 'mint' : 'blue') : 'empty'
      });
    }
  });

  // Gửi dữ liệu qua Backend PHP để lưu Firebase Realtime Database
  fetch('api.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'save_medications',
      medications: updatedMedications
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      medications = updatedMedications;
      renderMainContent();
      closeEditModal();
      alert("Đã cập nhật cấu hình thuốc trong Firebase thành công!");
    } else {
      alert("Có lỗi xảy ra: " + data.message);
    }
  })
  .catch(error => {
    console.error('Lỗi kết nối:', error);
  });
}

// Cập nhật hàm điều khiển Khóa qua Backend PHP
function setupLockButtonEvent() {
  const lockBtn = document.getElementById('lock-toggle-btn');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      const newState = !locked;

      // Gọi Backend PHP để lưu trạng thái khóa trong Firebase
      fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'control_lock',
          locked: newState
        })
      })
      .then(res => res.json())
      .then(data => {
        if(data.status === 'success') {
          locked = data.lock_state;
          renderMainContent();
        }
      });
    });
  }
}