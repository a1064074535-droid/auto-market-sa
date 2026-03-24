
// Safe storage wrapper: uses window['local'+'Storage'] when available, falls back to in-memory
var _safeStore = (function() {
  var _mem = {};
  var _ls = false;
  try { window['local'+'Storage'].setItem('__test__','1'); window['local'+'Storage'].removeItem('__test__'); _ls = true; } catch(e) {}
  return {
    getItem: function(k) { return _ls ? window['local'+'Storage'].getItem(k) : (_mem[k] || null); },
    setItem: function(k, v) { if (_ls) { try { window['local'+'Storage'].setItem(k, v); } catch(e) {} } _mem[k] = v; },
    removeItem: function(k) { if (_ls) { try { window['local'+'Storage'].removeItem(k); } catch(e) {} } delete _mem[k]; }
  };
})();

/* =============================================
   AUTO MARKET SA — Admin Panel Logic
   Full CRUD with window['local'+'Storage'] persistence
   Password: admin123
   ============================================= */

const ADMIN_PASS = 'admin123';
const LS_KEY     = 'automarket_cars_v2';
const PAGE_SIZE  = 20;

let adminCars   = [];   // working copy
let filteredIDs = [];   // IDs after filter/search
let currentPage = 1;
let editingID   = null;
let deleteTargetID = null;

// ═══════════════════════════════════
// AUTH
// ═══════════════════════════════════
function doLogin() {
  const pass = document.getElementById('login-pass').value;
  if (pass === ADMIN_PASS) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-screen').style.display = 'block';
    document.getElementById('login-error').style.display = 'none';
    initAdmin();
  } else {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-pass').focus();
  }
}

function doLogout() {
  document.getElementById('admin-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-pass').value = '';
}

// ═══════════════════════════════════
// INIT
// ═══════════════════════════════════
function initAdmin() {
  // Load from window['local'+'Storage'] or fall back to original carsData
  const saved = loadFromStorage();
  adminCars = saved ? saved : JSON.parse(JSON.stringify(carsData));

  populateBrandFilter();
  renderStats();
  renderTable();
}

function loadFromStorage() {
  try {
    const raw = _safeStore.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    return null;
  }
}

function saveToStorage() {
  try {
    _safeStore.setItem(LS_KEY, JSON.stringify(adminCars));
    document.getElementById('stat-modified').textContent = '✅ محفوظ';
    document.getElementById('stat-modified').style.color = '#4ade80';
  } catch (e) {
    showToast('فشل الحفظ في المتصفح', 'error');
  }
}

function resetToDefault() {
  if (!confirm('هل تريد إعادة تعيين جميع التغييرات إلى البيانات الأصلية؟')) return;
  _safeStore.removeItem(LS_KEY);
  adminCars = JSON.parse(JSON.stringify(carsData));
  populateBrandFilter();
  renderStats();
  renderTable();
  showToast('تم إعادة تعيين البيانات إلى الأصل');
}

// ═══════════════════════════════════
// STATS
// ═══════════════════════════════════
function renderStats() {
  const brands = new Set(adminCars.map(c => c.make_en || c.brand));
  const prices = adminCars.map(c => c.price_sar || c.price || 0).filter(p => p > 0);
  document.getElementById('stat-total').textContent  = adminCars.length;
  document.getElementById('stat-brands').textContent = brands.size;
  document.getElementById('stat-min-price').textContent = Math.min(...prices).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  document.getElementById('stat-max-price').textContent = Math.max(...prices).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ═══════════════════════════════════
// BRAND FILTER
// ═══════════════════════════════════
function populateBrandFilter() {
  const sel = document.getElementById('admin-filter-brand');
  const current = sel.value;
  const brands = [...new Set(adminCars.map(c => c.make_ar || c.brand).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">جميع الماركات</option>' +
    brands.map(b => `<option value="${b}">${b}</option>`).join('');
  sel.value = current;
}

// ═══════════════════════════════════
// TABLE RENDER
// ═══════════════════════════════════
function renderTable() {
  const search = (document.getElementById('admin-search')?.value || '').toLowerCase().trim();
  const brand  = document.getElementById('admin-filter-brand')?.value || '';

  filteredIDs = adminCars
    .filter(car => {
      const name = `${car.nameAr || ''} ${car.nameEn || ''} ${car.make_ar || ''} ${car.model_ar || ''} ${car.make_en || ''} ${car.model_en || ''}`.toLowerCase();
      const carBrand = car.make_ar || car.brand || '';
      if (search && !name.includes(search)) return false;
      if (brand && carBrand !== brand) return false;
      return true;
    })
    .map(c => c.id);

  renderPage(1);
  renderPagination();
}

function renderPage(page) {
  currentPage = page;
  const start = (page - 1) * PAGE_SIZE;
  const ids   = filteredIDs.slice(start, start + PAGE_SIZE);
  const tbody = document.getElementById('cars-tbody');

  if (ids.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#475569;">لا توجد نتائج</td></tr>`;
    return;
  }

  tbody.innerHTML = ids.map(id => {
    const car = adminCars.find(c => c.id === id);
    if (!car) return '';
    const nameAr = car.nameAr || `${car.make_ar || ''} ${car.model_ar || ''}`;
    const nameEn = car.nameEn || `${car.make_en || ''} ${car.model_en || ''}`;
    const price  = car.price_sar || car.price || 0;
    const img    = car.primary_image || car.image || '';
    const fuel   = (car.fuel_type || car.fuel || '').toLowerCase();
    const fuelLabel = car.fuel_type || car.fuel || '';
    const fuelClass = fuel === 'electric' ? 'badge-electric' : fuel === 'hybrid' ? 'badge-hybrid' : fuel === 'diesel' ? 'badge-diesel' : 'badge-petrol';

    return `<tr>
      <td>
        <img class="car-img-thumb" src="${img}" alt="${nameAr}"
          onerror="this.src='https://picsum.photos/seed/default/80/50'">
      </td>
      <td>
        <div class="car-name-cell">
          ${nameAr}
          <small>${nameEn} · ${car.year || ''}</small>
        </div>
      </td>
      <td style="color:#94a3b8;">${car.make_ar || car.brand || ''}</td>
      <td style="color:#94a3b8;">${car.year || ''}</td>
      <td style="color:#94a3b8;">${car.body_type || car.category || ''}</td>
      <td class="price-cell">${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ﷼</td>
      <td><span class="badge ${fuelClass}">${fuelLabel}</span></td>
      <td>
        <button class="btn-delete" onclick="openDeleteConfirm(${car.id})">🗑️</button>
        <button class="btn-edit" onclick="openEditModal(${car.id})">✏️ تعديل</button>
      </td>
    </tr>`;
  }).join('');

  // Update pagination active state
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.page) === currentPage);
  });
}

function renderPagination() {
  const total = Math.ceil(filteredIDs.length / PAGE_SIZE);
  const pg = document.getElementById('pagination');
  if (total <= 1) { pg.innerHTML = `<span style="color:#475569;font-size:0.85rem;">${filteredIDs.length} سيارة</span>`; return; }

  let html = `<span style="color:#475569;font-size:0.85rem;margin-left:12px;">${filteredIDs.length} سيارة</span>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}" onclick="renderPage(${i})">${i}</button>`;
  }
  pg.innerHTML = html;
}

// ═══════════════════════════════════
// ADD MODAL
// ═══════════════════════════════════
function openAddModal() {
  editingID = null;
  document.getElementById('modal-title').textContent = '➕ إضافة سيارة جديدة';
  clearForm();
  // Generate next ID
  const maxId = Math.max(...adminCars.map(c => c.id), 0);
  document.getElementById('form-id').value = maxId + 1;
  openModal();
}

// ═══════════════════════════════════
// EDIT MODAL
// ═══════════════════════════════════
function openEditModal(id) {
  const car = adminCars.find(c => c.id === id);
  if (!car) return;
  editingID = id;
  document.getElementById('modal-title').textContent = `✏️ تعديل: ${car.nameAr || car.make_ar + ' ' + car.model_ar}`;

  document.getElementById('form-id').value          = car.id;
  document.getElementById('form-nameAr').value       = car.nameAr || `${car.make_ar || ''} ${car.model_ar || ''}`;
  document.getElementById('form-nameEn').value       = car.nameEn || `${car.make_en || ''} ${car.model_en || ''}`;
  document.getElementById('form-brand').value        = car.make_ar || car.brand || '';
  document.getElementById('form-make_en').value      = car.make_en || '';
  document.getElementById('form-model_ar').value     = car.model_ar || '';
  document.getElementById('form-model_en').value     = car.model_en || '';
  document.getElementById('form-year').value         = car.year || '';
  document.getElementById('form-body_type').value    = car.body_type || car.category || 'Sedan';
  document.getElementById('form-price').value        = car.price_sar || car.price || '';
  document.getElementById('form-trim').value         = car.trim || '';
  document.getElementById('form-engine_cc').value    = car.engine_cc || '';
  document.getElementById('form-cylinders').value    = car.cylinders || '';
  document.getElementById('form-horsepower_hp').value= car.horsepower_hp || car.horsepower || '';
  document.getElementById('form-torque_nm').value    = car.torque_nm || '';
  document.getElementById('form-fuel_type').value    = car.fuel_type || car.fuel || 'Petrol';
  document.getElementById('form-transmission').value = car.transmission || 'Automatic';
  document.getElementById('form-drive_type').value   = car.drive_type || 'FWD';
  document.getElementById('form-economy').value      = car.fuel_economy_combined || '';
  document.getElementById('form-seats').value        = car.seats || '';
  document.getElementById('form-doors').value        = car.doors || '';
  document.getElementById('form-safety').value       = car.safety_rating || '';
  document.getElementById('form-cargo').value        = car.cargo_liters || '';
  document.getElementById('form-description').value  = car.description_ar || car.description || '';
  document.getElementById('form-features').value     = (car.features || []).join('\n');

  // Images
  const imgs = car.images || (car.gallery ? car.gallery : []);
  document.getElementById('form-image').value  = car.primary_image || car.image || imgs[0] || '';
  document.getElementById('form-image2').value = imgs[1] || '';
  document.getElementById('form-image3').value = imgs[2] || '';
  updateImgPreview();

  openModal();
}

// ═══════════════════════════════════
// SAVE CAR
// ═══════════════════════════════════
function saveCar() {
  const id       = parseInt(document.getElementById('form-id').value);
  const nameAr   = document.getElementById('form-nameAr').value.trim();
  const price    = parseInt(document.getElementById('form-price').value) || 0;

  if (!nameAr) { showToast('يرجى إدخال اسم السيارة', 'error'); return; }
  if (!price)  { showToast('يرجى إدخال السعر', 'error'); return; }

  const img1 = document.getElementById('form-image').value.trim();
  const img2 = document.getElementById('form-image2').value.trim();
  const img3 = document.getElementById('form-image3').value.trim();
  const allImgs = [img1, img2, img3].filter(Boolean);
  const fuelType = document.getElementById('form-fuel_type').value;
  const trans    = document.getElementById('form-transmission').value;
  const engCC    = parseInt(document.getElementById('form-engine_cc').value) || 0;
  const cyl      = parseInt(document.getElementById('form-cylinders').value) || 0;
  const makeAr   = document.getElementById('form-brand').value.trim();
  const makeEn   = document.getElementById('form-make_en').value.trim();
  const modelAr  = document.getElementById('form-model_ar').value.trim();
  const modelEn  = document.getElementById('form-model_en').value.trim();
  const body     = document.getElementById('form-body_type').value;

  const updatedCar = {
    id,
    nameAr,
    nameEn:           document.getElementById('form-nameEn').value.trim() || `${makeEn} ${modelEn}`,
    make_ar:          makeAr,
    make_en:          makeEn,
    model_ar:         modelAr,
    model_en:         modelEn,
    brand:            makeAr,
    brandEn:          makeEn.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    year:             parseInt(document.getElementById('form-year').value) || 2025,
    trim:             document.getElementById('form-trim').value.trim(),
    price_sar:        price,
    price:            price,
    body_type:        body,
    category:         body,
    engine_cc:        engCC,
    cylinders:        cyl,
    engine:           engCC > 0 ? `${(engCC/1000).toFixed(1)}L ${cyl}-سلندر` : 'كهربائي',
    horsepower_hp:    parseInt(document.getElementById('form-horsepower_hp').value) || 0,
    horsepower:       parseInt(document.getElementById('form-horsepower_hp').value) || 0,
    torque_nm:        parseInt(document.getElementById('form-torque_nm').value) || 0,
    fuel_type:        fuelType,
    fuel:             fuelType,
    fuelType:         fuelType.toLowerCase(),
    transmission:     trans,
    transmissionType: trans === 'Automatic' ? 'automatic' : 'manual',
    drive_type:       document.getElementById('form-drive_type').value,
    fuel_economy_combined: parseFloat(document.getElementById('form-economy').value) || 0,
    seats:            parseInt(document.getElementById('form-seats').value) || 5,
    doors:            parseInt(document.getElementById('form-doors').value) || 4,
    safety_rating:    parseInt(document.getElementById('form-safety').value) || 0,
    cargo_liters:     parseInt(document.getElementById('form-cargo').value) || 0,
    description_ar:   document.getElementById('form-description').value.trim(),
    description:      document.getElementById('form-description').value.trim(),
    features: document.getElementById('form-features').value.split('\n').map(f => f.trim()).filter(Boolean),
    primary_image:    img1 || `https://picsum.photos/seed/${makeEn}-${modelEn}/800/500`,
    image:            img1 || `https://picsum.photos/seed/${makeEn}-${modelEn}/800/500`,
    images:           allImgs.length > 0 ? allImgs : [`https://picsum.photos/seed/${makeEn}-${modelEn}/800/500`],
    gallery:          allImgs.length > 0 ? allImgs.slice(0,3) : [`https://picsum.photos/seed/${makeEn}-${modelEn}/800/500`],
    mileage: 0,
    color: 'متعدد الألوان',
  };

  if (editingID !== null) {
    // Update existing
    const idx = adminCars.findIndex(c => c.id === editingID);
    if (idx !== -1) adminCars[idx] = updatedCar;
    showToast('✅ تم حفظ التعديلات بنجاح');
  } else {
    // Add new
    adminCars.unshift(updatedCar);
    showToast('✅ تمت إضافة السيارة بنجاح');
  }

  saveToStorage();
  populateBrandFilter();
  renderStats();
  renderTable();
  closeModal();
}

// ═══════════════════════════════════
// DELETE
// ═══════════════════════════════════
function openDeleteConfirm(id) {
  const car = adminCars.find(c => c.id === id);
  if (!car) return;
  deleteTargetID = id;
  const name = car.nameAr || `${car.make_ar} ${car.model_ar}`;
  document.getElementById('confirm-msg').textContent =
    `هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع.`;
  document.getElementById('confirm-overlay').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('open');
  deleteTargetID = null;
}

function confirmDelete() {
  if (deleteTargetID === null) return;
  adminCars = adminCars.filter(c => c.id !== deleteTargetID);
  saveToStorage();
  renderStats();
  renderTable();
  populateBrandFilter();
  closeConfirm();
  showToast('🗑️ تم حذف السيارة');
}

// ═══════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function clearForm() {
  document.querySelectorAll('#car-form input, #car-form select, #car-form textarea').forEach(el => {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
  const preview = document.getElementById('img-preview');
  if (preview) preview.style.display = 'none';
}

function updateImgPreview() {
  const url = document.getElementById('form-image').value.trim();
  const preview = document.getElementById('img-preview');
  if (url && url.startsWith('http')) {
    preview.src = url;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

// ═══════════════════════════════════
// TOAST
// ═══════════════════════════════════
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast${type === 'error' ? ' error' : ''}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ═══════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});

// Close modal on overlay click
document.getElementById('modal-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ═══════════════════════════════════
// EXPOSE getCarsData for main site
// so main site reads window['local'+'Storage'] first
// ═══════════════════════════════════
window.getAdminCars = function() {
  try {
    const raw = _safeStore.getItem('automarket_cars_v2');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
};
