/* ============================================================
   HOTEL MELATI - SISTEM RESERVASI
   File: script.js
   ============================================================ */

/* ================= DATA DEFAULT ================= */
const DEFAULT_ROOMS = [
  {
    id: 'R1', roomNo: '101', name: 'Standard AC', price: 250000, capacity: 2,
    facil: 'AC, TV, WiFi, KM Dalam',
    image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600'
  },
  {
    id: 'R2', roomNo: '102', name: 'Standard AC', price: 250000, capacity: 2,
    facil: 'AC, TV, WiFi, KM Dalam',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'
  },
  {
    id: 'R3', roomNo: '103', name: 'Deluxe', price: 400000, capacity: 3,
    facil: 'AC, TV, WiFi, Air Panas, Kulkas',
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'
  },
  {
    id: 'R4', roomNo: '201', name: 'VIP', price: 600000, capacity: 4,
    facil: 'AC, Smart TV, WiFi, Air Panas, Kulkas, Balkon',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'
  }
];

const DEFAULT_BANKS = [
  { id: 'B1', name: 'BCA', no: '1234567890', owner: 'Hotel Melati' },
  { id: 'B2', name: 'Mandiri', no: '9876543210', owner: 'Hotel Melati' }
];

/* ================= STATE ================= */
let rooms = JSON.parse(localStorage.getItem('hm_rooms')) || DEFAULT_ROOMS;
let bookings = JSON.parse(localStorage.getItem('hm_bookings')) || [];
let banks = JSON.parse(localStorage.getItem('hm_banks')) || DEFAULT_BANKS;
const ADMIN_PASS = 'admin123'; // ubah sesuai kebutuhan

/* ================= UTIL ================= */
function formatRp(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function saveAll() {
  localStorage.setItem('hm_rooms', JSON.stringify(rooms));
  localStorage.setItem('hm_bookings', JSON.stringify(bookings));
  localStorage.setItem('hm_banks', JSON.stringify(banks));
}

function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (error ? ' error' : '');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function uid(prefix = '') {
  return prefix + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 5).toUpperCase();
}

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

/* ================= NAVIGASI ================= */
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('header nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  document.getElementById('hero').style.display = name === 'home' ? 'block' : 'none';

  if (name === 'booking') populateRoomSelect();
  if (name === 'admin' && document.getElementById('adminPanel').style.display === 'block') {
    renderAdmin();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================= CEK KETERSEDIAAN KAMAR ================= */
function isRoomAvailable(roomId, checkin, checkout) {
  if (!checkin || !checkout) return true;
  return !bookings.some(b =>
    b.roomId === roomId &&
    ['pending', 'confirmed', 'checkedin'].includes(b.status) &&
    !(checkout <= b.checkin || checkin >= b.checkout)
  );
}

/* ================= RENDER KAMAR (HOME) ================= */
function renderRooms() {
  const grid = document.getElementById('roomGrid');
  if (rooms.length === 0) {
    grid.innerHTML = '<p class="empty">Belum ada kamar. Tambahkan via Admin.</p>';
    return;
  }
  grid.innerHTML = rooms.map(r => `
    <div class="room-card">
      <img src="${r.image || 'https://via.placeholder.com/400x200?text=Room'}"
           alt="${r.name}"
           onerror="this.src='https://via.placeholder.com/400x200?text=Room'">
      <div class="room-body">
        <span class="room-no">Room ${r.roomNo}</span>
        <h3>${r.name}</h3>
        <div class="room-facil">
          ${(r.facil || '').split(',').map(f => `<span>${f.trim()}</span>`).join('')}
        </div>
        <div class="note">👥 Maks ${r.capacity} tamu</div>
        <div class="room-price">${formatRp(r.price)} <small>/malam</small></div>
        <button class="btn-book" onclick="quickBook('${r.id}')">📝 Booking</button>
      </div>
    </div>
  `).join('');
}

function quickBook(roomId) {
  showSection('booking');
  setTimeout(() => {
    document.getElementById('roomSelect').value = roomId;
    calculateTotal();
  }, 100);
}

/* ================= FORM BOOKING ================= */
function populateRoomSelect() {
  const sel = document.getElementById('roomSelect');
  sel.innerHTML = '<option value="">-- Pilih Kamar --</option>' +
    rooms.map(r =>
      `<option value="${r.id}">Room ${r.roomNo} - ${r.name} (${formatRp(r.price)})</option>`
    ).join('');
}

function calculateTotal() {
  const roomId = document.getElementById('roomSelect').value;
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const guests = parseInt(document.getElementById('guests').value) || 1;

  if (!roomId || !checkin || !checkout) {
    document.getElementById('summary').style.display = 'none';
    return;
  }
  const room = rooms.find(r => r.id === roomId);
  const nights = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
  if (nights <= 0) {
    document.getElementById('summary').style.display = 'none';
    return;
  }
  const total = room.price * nights;
  document.getElementById('summary').style.display = 'block';
  document.getElementById('sumRoom').textContent = `Room ${room.roomNo} - ${room.name}`;
  document.getElementById('sumPrice').textContent = formatRp(room.price);
  document.getElementById('sumNights').textContent = nights + ' malam';
  document.getElementById('sumGuests').textContent = guests + ' orang';
  document.getElementById('sumTotal').textContent = formatRp(total);
}

function submitBooking(e) {
  e.preventDefault();
  const roomId = document.getElementById('roomSelect').value;
  const room = rooms.find(r => r.id === roomId);
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const guests = parseInt(document.getElementById('guests').value);

  if (!room) return showToast('Pilih kamar dulu!', true);
  if (new Date(checkout) <= new Date(checkin))
    return showToast('Tanggal checkout harus setelah checkin!', true);
  if (new Date(checkin) < new Date(todayStr()))
    return showToast('Tanggal checkin tidak boleh lewat!', true);
  if (guests > room.capacity)
    return showToast(`Maksimal ${room.capacity} tamu untuk kamar ini!`, true);
  if (!isRoomAvailable(roomId, checkin, checkout))
    return showToast('Kamar sudah dibooking di tanggal tersebut!', true);

  const nights = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
  const total = room.price * nights;

  const booking = {
    code: 'HM-' + uid(),
    roomId, roomNo: room.roomNo, roomName: room.name,
    guestName: document.getElementById('guestName').value,
    guestPhone: document.getElementById('guestPhone').value,
    guestEmail: document.getElementById('guestEmail').value,
    guestAddress: document.getElementById('guestAddress').value,
    checkin, checkout, nights, guests,
    notes: document.getElementById('notes').value,
    total, pricePerNight: room.price,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  saveAll();

  showBookingSuccess(booking);
  document.getElementById('bookingForm').reset();
  document.getElementById('summary').style.display = 'none';
  renderRooms();
}

function showBookingSuccess(b) {
  const banksHTML = banks.length
    ? banks.map(bank => `
        <div class="bank-card">
          <div>
            <div class="bank-name">🏦 ${bank.name}</div>
            <div class="bank-no">${bank.no}</div>
            <small>a.n. ${bank.owner}</small>
          </div>
          <button class="btn-copy" onclick="copyText('${bank.no}')">📋 Copy</button>
        </div>
      `).join('')
    : '<p class="note">Admin belum menambahkan rekening.</p>';

  document.getElementById('detailContent').innerHTML = `
    <button class="close-btn" onclick="closeModal()">&times;</button>
    <h2>✅ Booking Berhasil!</h2>
    <div style="background:#d4edda;padding:12px;border-radius:8px;margin-bottom:15px;text-align:center;">
      <div style="font-size:.8rem;color:#155724;">Kode Booking Anda</div>
      <div style="font-size:1.4rem;font-weight:700;color:#0f5132;">${b.code}</div>
      <small>Simpan kode ini untuk cek status</small>
    </div>
    <div class="summary">
      <div class="row"><span>Nama</span><span>${b.guestName}</span></div>
      <div class="row"><span>Kamar</span><span>Room ${b.roomNo} - ${b.roomName}</span></div>
      <div class="row"><span>Check-in</span><span>${b.checkin}</span></div>
      <div class="row"><span>Check-out</span><span>${b.checkout}</span></div>
      <div class="row"><span>Durasi</span><span>${b.nights} malam</span></div>
      <div class="row"><span>Tamu</span><span>${b.guests} orang</span></div>
      <div class="row total"><span>TOTAL</span><span>${formatRp(b.total)}</span></div>
    </div>
    <h3 style="color:#0f5132;margin:15px 0 8px;font-size:1rem;">🏦 Silakan Transfer ke:</h3>
    ${banksHTML}
    <div class="info-box" style="margin-top:12px;">
      ⚠️ Setelah transfer, konfirmasi ke WhatsApp hotel agar booking dikonfirmasi admin.
    </div>
    <button class="btn-primary" style="width:100%;margin-top:10px;"
            onclick="closeModal();showSection('status');">Cek Status Booking</button>
  `;
  document.getElementById('detailModal').classList.add('active');
}

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('✅ Nomor rekening dicopy!'));
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('active');
}

/* ================= CEK STATUS BOOKING ================= */
function searchBooking() {
  const code = document.getElementById('searchCode').value.trim().toUpperCase();
  const phone = document.getElementById('searchPhone').value.trim();
  const res = document.getElementById('searchResult');

  if (!code && !phone) return showToast('Isi kode booking atau no HP!', true);

  const found = bookings.filter(b =>
    (code && b.code.toUpperCase() === code) ||
    (phone && b.guestPhone === phone)
  );

  if (found.length === 0) {
    res.innerHTML = '<div class="form-card"><p class="empty">❌ Booking tidak ditemukan</p></div>';
    return;
  }

  res.innerHTML = found.map(b => `
    <div class="form-card" style="border-left:5px solid #198754;">
      <h3 style="color:#0f5132;">
        ${b.code} <span class="status ${b.status}">${statusLabel(b.status)}</span>
      </h3>
      <p>👤 ${b.guestName} | 📱 ${b.guestPhone}</p>
      <p>🛏️ Room ${b.roomNo} - ${b.roomName}</p>
      <p>📅 ${b.checkin} → ${b.checkout} (${b.nights} malam)</p>
      <p>👥 ${b.guests} tamu</p>
      ${b.notes ? `<p>📝 ${b.notes}</p>` : ''}
      <p style="font-size:1.1rem;font-weight:700;color:#ff6b35;margin-top:8px;">
        Total: ${formatRp(b.total)}
      </p>
      ${b.status === 'pending'
        ? '<p class="note">⏳ Menunggu konfirmasi pembayaran dari admin</p>'
        : ''}
    </div>
  `).join('');
}

function statusLabel(s) {
  return {
    pending: '⏳ Menunggu',
    confirmed: '✅ Terkonfirmasi',
    checkedin: '🔵 Check-in',
    checkedout: '⚪ Selesai',
    cancelled: '❌ Dibatalkan'
  }[s] || s;
}

/* ================= ADMIN ================= */
function loginAdmin() {
  const pass = document.getElementById('adminPass').value;
  if (pass === ADMIN_PASS) {
    document.getElementById('loginBox').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    renderAdmin();
    showToast('✅ Login berhasil!');
  } else {
    showToast('❌ Password salah!', true);
  }
}

function renderAdmin() {
  // Statistik
  const total = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const income = bookings
    .filter(b => ['confirmed', 'checkedin', 'checkedout'].includes(b.status))
    .reduce((s, b) => s + b.total, 0);

  document.getElementById('statsBox').innerHTML = `
    <div class="stat-box"><div class="num">${rooms.length}</div><div class="lbl">Total Kamar</div></div>
    <div class="stat-box"><div class="num">${total}</div><div class="lbl">Total Booking</div></div>
    <div class="stat-box"><div class="num">${pending}</div><div class="lbl">Menunggu</div></div>
    <div class="stat-box"><div class="num">${confirmed}</div><div class="lbl">Terkonfirmasi</div></div>
    <div class="stat-box">
      <div class="num" style="font-size:1rem;">${formatRp(income)}</div>
      <div class="lbl">Total Pendapatan</div>
    </div>
  `;

  // Tabel kamar
  document.getElementById('roomAdminTable').innerHTML = rooms.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${r.roomNo}</b></td>
      <td>${r.name}</td>
      <td>${formatRp(r.price)}</td>
      <td>${r.capacity}</td>
      <td style="font-size:.75rem;">${r.facil || '-'}</td>
      <td>
        <button class="btn-warning btn-sm" onclick="editRoom('${r.id}')">✏️</button>
        <button class="btn-danger btn-sm" onclick="deleteRoom('${r.id}')">🗑️</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="empty">Belum ada kamar</td></tr>';

  // Tabel booking
  document.getElementById('bookingAdminTable').innerHTML =
    bookings.slice().reverse().map(b => `
      <tr>
        <td><b>${b.code}</b></td>
        <td>${b.guestName}<br><small>${b.guestPhone}</small></td>
        <td>Room ${b.roomNo}<br><small>${b.roomName}</small></td>
        <td>${b.checkin}</td>
        <td>${b.checkout}</td>
        <td>${formatRp(b.total)}</td>
        <td><span class="status ${b.status}">${statusLabel(b.status)}</span></td>
        <td>
          ${b.status === 'pending'
            ? `<button class="btn-primary btn-sm" onclick="setStatus('${b.code}','confirmed')">✔️ Konfirmasi</button>`
            : ''}
          ${b.status === 'confirmed'
            ? `<button class="btn-warning btn-sm" onclick="setStatus('${b.code}','checkedin')">Check-in</button>`
            : ''}
          ${b.status === 'checkedin'
            ? `<button class="btn-warning btn-sm" onclick="setStatus('${b.code}','checkedout')">Check-out</button>`
            : ''}
          ${['pending', 'confirmed'].includes(b.status)
            ? `<button class="btn-danger btn-sm" onclick="setStatus('${b.code}','cancelled')">Batal</button>`
            : ''}
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="empty">Belum ada booking</td></tr>';

  // Bank list
  document.getElementById('bankList').innerHTML = banks.map(bk => `
    <div class="bank-card">
      <div>
        <div class="bank-name">🏦 ${bk.name}</div>
        <div class="bank-no">${bk.no}</div>
        <small>a.n. ${bk.owner}</small>
      </div>
      <button class="btn-danger btn-sm" onclick="deleteBank('${bk.id}')">Hapus</button>
    </div>
  `).join('');
}

function setStatus(code, status) {
  const b = bookings.find(x => x.code === code);
  if (b) {
    b.status = status;
    saveAll();
    renderAdmin();
    showToast('Status diupdate!');
  }
}

/* ================= ROOM CRUD ================= */
function saveRoom() {
  const id = document.getElementById('editRoomId').value;
  const data = {
    roomNo: document.getElementById('roomNo').value.trim(),
    name: document.getElementById('roomName').value.trim(),
    price: parseInt(document.getElementById('roomPrice').value),
    capacity: parseInt(document.getElementById('roomCap').value) || 2,
    facil: document.getElementById('roomFacil').value.trim(),
    image: document.getElementById('roomImg').value.trim()
  };
  if (!data.roomNo || !data.name || !data.price)
    return showToast('Lengkapi data kamar!', true);

  if (id) {
    const idx = rooms.findIndex(r => r.id === id);
    rooms[idx] = { ...rooms[idx], ...data };
    showToast('✅ Kamar diupdate');
  } else {
    rooms.push({ id: 'R' + Date.now(), ...data });
    showToast('✅ Kamar ditambahkan');
  }
  saveAll();
  resetRoomForm();
  renderRooms();
  renderAdmin();
}

function editRoom(id) {
  const r = rooms.find(x => x.id === id);
  document.getElementById('editRoomId').value = r.id;
  document.getElementById('roomNo').value = r.roomNo;
  document.getElementById('roomName').value = r.name;
  document.getElementById('roomPrice').value = r.price;
  document.getElementById('roomCap').value = r.capacity;
  document.getElementById('roomFacil').value = r.facil;
  document.getElementById('roomImg').value = r.image || '';
  window.scrollTo({
    top: document.getElementById('adminPanel').offsetTop,
    behavior: 'smooth'
  });
}

function deleteRoom(id) {
  if (!confirm('Hapus kamar ini?')) return;
  rooms = rooms.filter(r => r.id !== id);
  saveAll();
  renderRooms();
  renderAdmin();
  showToast('🗑️ Kamar dihapus');
}

function resetRoomForm() {
  document.getElementById('editRoomId').value = '';
  ['roomNo', 'roomName', 'roomPrice', 'roomFacil', 'roomImg']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('roomCap').value = 2;
}

/* ================= BANK CRUD ================= */
function saveBank() {
  const name = document.getElementById('bankName').value.trim();
  const no = document.getElementById('bankNo').value.trim();
  const owner = document.getElementById('bankOwner').value.trim();
  if (!name || !no || !owner) return showToast('Lengkapi data bank!', true);

  banks.push({ id: 'B' + Date.now(), name, no, owner });
  saveAll();
  document.getElementById('bankName').value = '';
  document.getElementById('bankNo').value = '';
  document.getElementById('bankOwner').value = '';
  renderAdmin();
  showToast('✅ Rekening ditambahkan');
}

function deleteBank(id) {
  if (!confirm('Hapus rekening ini?')) return;
  banks = banks.filter(b => b.id !== id);
  saveAll();
  renderAdmin();
}

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', () => {
  renderRooms();
  populateRoomSelect();

  document.getElementById('checkin').min = todayStr();
  document.getElementById('checkout').min = todayStr(1);
  document.getElementById('checkin').value = todayStr(1);
  document.getElementById('checkout').value = todayStr(2);

  document.getElementById('detailModal').addEventListener('click', e => {
    if (e.target.id === 'detailModal') closeModal();
  });
});