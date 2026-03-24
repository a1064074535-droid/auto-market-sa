
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
   AUTO MARKET SA — Car Detail Page v2 (180 Cars)
   Reads admin edits from window['local'+'Storage'] first
   ============================================= */

// Load admin-edited data from window['local'+'Storage']
(function() {
  try {
    const saved = _safeStore.getItem('automarket_cars_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window._carsData = parsed;
      }
    }
  } catch(e) {}
  if (!window._carsData) window._carsData = carsData;
})();

(function () {
  const html = document.documentElement;
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = window.__siteTheme || preferred;
  html.setAttribute('data-theme', theme);

  function updateIcon(t) {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.innerHTML = t === 'dark'
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
  updateIcon(theme);
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    window.__siteTheme = next;
    updateIcon(next);
  });
})();

window.addEventListener('scroll', () => {
  document.getElementById('main-header')?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ===== HELPERS =====
function formatPrice(p) { return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ﷼'; }

function buildWaMsg(car) {
  const nameAr = car.nameAr || `${car.make_ar} ${car.model_ar}`;
  const price = car.price_sar || car.price || 0;
  return encodeURIComponent(`مرحباً، أريد الاستفسار عن:\n🚗 ${nameAr}\n📅 السنة: ${car.year}\n💰 السعر: ${formatPrice(price)}\n🔧 المحرك: ${car.engine_cc > 0 ? (car.engine_cc/1000).toFixed(1)+'L' : 'كهربائي'}\nالرجاء التواصل معي بأسرع وقت.`);
}

function selectGalleryImage(idx, gallery) {
  const el = document.getElementById('gallery-main-img');
  if (el) el.src = gallery[idx];
  document.querySelectorAll('.gallery-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

function renderCarDetail(car) {
  const loading = document.getElementById('detail-loading');
  const container = document.getElementById('car-detail');
  const breadcrumb = document.getElementById('breadcrumb-current');
  const floatingWa = document.getElementById('floating-wa-car');

  const nameAr = car.nameAr || `${car.make_ar} ${car.model_ar}`;
  const nameEn = car.nameEn || `${car.make_en} ${car.model_en}`;
  const price = car.price_sar || car.price || 0;
  const fuel = (car.fuel_type || car.fuel || '').toLowerCase();
  const fuelLabel = car.fuel_type || car.fuel || '';
  const hp = car.horsepower_hp || car.horsepower || 0;
  const torque = car.torque_nm || 0;
  const engine = car.engine_cc > 0 ? `${(car.engine_cc/1000).toFixed(1)}L ${car.cylinders} سلندر` : 'كهربائي';
  const economy = car.fuel_economy_combined || 0;
  const seats = car.seats || 5;
  const doors = car.doors || 4;
  const trans = car.transmission || 'Automatic';
  const drive = car.drive_type || car.driveType || '';
  const color = car.color || 'متعدد الألوان';
  const safety = car.safety_rating || 0;
  const features = car.features || [];
  const desc = car.description_ar || car.description || '';
  const body = car.body_type || car.category || '';
  const brand = car.make_ar || car.brand || '';
  const brandEn = car.make_en || '';
  const trim = car.trim || '';
  const gallery = (car.images && car.images.length) ? car.images : (car.gallery && car.gallery.length ? car.gallery : [car.primary_image || car.image]);

  if (breadcrumb) breadcrumb.textContent = nameAr;
  document.title = `${nameAr} ${car.year} — أوتو ماركت`;
  if (floatingWa) floatingWa.href = `https://wa.me/966545888559?text=${buildWaMsg(car)}`;

  const thumbsHtml = gallery.slice(0, 5).map((img, i) => `
    <button class="gallery-thumb ${i === 0 ? 'active' : ''}"
      onclick="selectGalleryImage(${i}, ${JSON.stringify(gallery.slice(0,5)).replace(/"/g,'&quot;')})"
      aria-label="صورة ${i+1}">
      <img src="${img}" alt="صورة ${nameAr} ${i+1}" loading="lazy"
        onerror="this.src='https://picsum.photos/seed/car-default/800/500'">
    </button>`).join('');

  const featuresHtml = features.map(f => `
    <div class="feature-item">
      <div class="feature-check" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span>${f}</span>
    </div>`).join('');

  const starHtml = Array.from({length: 5}, (_, i) =>
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="${i < safety ? 'var(--gold-500)' : 'none'}" stroke="var(--gold-500)" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  ).join('');

  container.innerHTML = `
    <div class="detail-grid">
      <!-- Gallery -->
      <div class="detail-gallery">
        <div class="gallery-main">
          <img id="gallery-main-img" src="${gallery[0]}" alt="${nameAr}"
            onerror="this.src='https://picsum.photos/seed/car-default/800/500'">
        </div>
        ${gallery.length > 1 ? `<div class="gallery-thumbs">${thumbsHtml}</div>` : ''}
        <div class="detail-description"><h3>نبذة عن السيارة</h3><p>${desc}</p></div>
        ${features.length ? `<div class="detail-features"><h3>المميزات والتجهيزات</h3><div class="features-list">${featuresHtml}</div></div>` : ''}
      </div>

      <!-- Info Panel -->
      <div class="detail-info">
        <div>
          <div class="detail-brand-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            ${brand} · ${body}
          </div>
        </div>
        <div>
          <h1 class="detail-title">${nameAr}</h1>
          <p class="detail-year">${nameEn} ${trim ? '· '+trim : ''} · سنة ${car.year}</p>
        </div>
        <div class="detail-price-wrap">
          <p class="detail-price-label">السعر الاسترشادي</p>
          <div class="detail-price">${formatPrice(price)}</div>
          <p class="detail-price-note">السعر قابل للتفاوض · التواصل عبر واتساب</p>
        </div>
        <a href="https://wa.me/966545888559?text=${buildWaMsg(car)}" target="_blank" rel="noopener" class="detail-wa-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          استفسر عبر واتساب الآن
        </a>

        <!-- Specs Grid -->
        <div>
          <h3 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-4);color:var(--color-text);">المواصفات الأساسية</h3>
          <div class="detail-specs-grid">
            <div class="detail-spec-item">
              <div class="detail-spec-label">⚙️ المحرك</div>
              <div class="detail-spec-value">${engine}</div>
            </div>
            <div class="detail-spec-item">
              <div class="detail-spec-label">⚡ الأحصنة</div>
              <div class="detail-spec-value">${hp} HP</div>
            </div>
            ${torque ? `<div class="detail-spec-item"><div class="detail-spec-label">🔩 العزم</div><div class="detail-spec-value">${torque} نيوتن.م</div></div>` : ''}
            <div class="detail-spec-item">
              <div class="detail-spec-label">🔄 ناقل الحركة</div>
              <div class="detail-spec-value">${trans === 'Automatic' ? 'أوتوماتيك' : 'يدوي'}</div>
            </div>
            <div class="detail-spec-item">
              <div class="detail-spec-label">${fuel === 'electric' ? '🔋' : '⛽'} الوقود</div>
              <div class="detail-spec-value">${fuelLabel}</div>
            </div>
            <div class="detail-spec-item">
              <div class="detail-spec-label">🚗 نظام القيادة</div>
              <div class="detail-spec-value">${drive}</div>
            </div>
            <div class="detail-spec-item">
              <div class="detail-spec-label">🪑 المقاعد</div>
              <div class="detail-spec-value">${seats} مقعد</div>
            </div>
            <div class="detail-spec-item">
              <div class="detail-spec-label">🚪 الأبواب</div>
              <div class="detail-spec-value">${doors} أبواب</div>
            </div>
            ${economy > 0 ? `<div class="detail-spec-item"><div class="detail-spec-label">🌿 استهلاك الوقود</div><div class="detail-spec-value">${economy} كم/لتر</div></div>` : ''}
            ${car.cargo_liters > 0 ? `<div class="detail-spec-item"><div class="detail-spec-label">📦 سعة الصندوق</div><div class="detail-spec-value">${car.cargo_liters} لتر</div></div>` : ''}
            ${car.weight_kg > 0 ? `<div class="detail-spec-item"><div class="detail-spec-label">⚖️ الوزن</div><div class="detail-spec-value">${car.weight_kg} كغ</div></div>` : ''}
            ${safety > 0 ? `<div class="detail-spec-item" style="grid-column:1/-1;"><div class="detail-spec-label">🛡️ تقييم السلامة</div><div class="detail-spec-value" style="display:flex;gap:2px;margin-top:4px;">${starHtml}</div></div>` : ''}
          </div>
        </div>

        ${car.length_mm ? `
        <div>
          <h3 style="font-size:var(--text-base);font-weight:700;margin-bottom:var(--space-4);color:var(--color-text);">الأبعاد</h3>
          <div class="detail-specs-grid">
            <div class="detail-spec-item"><div class="detail-spec-label">↔️ الطول</div><div class="detail-spec-value">${car.length_mm} مم</div></div>
            <div class="detail-spec-item"><div class="detail-spec-label">↕️ العرض</div><div class="detail-spec-value">${car.width_mm} مم</div></div>
            <div class="detail-spec-item"><div class="detail-spec-label">⬆️ الارتفاع</div><div class="detail-spec-value">${car.height_mm} مم</div></div>
            <div class="detail-spec-item"><div class="detail-spec-label">📏 قاعدة العجلات</div><div class="detail-spec-value">${car.wheelbase_mm} مم</div></div>
            ${car.fuel_tank_liters ? `<div class="detail-spec-item"><div class="detail-spec-label">⛽ خزان الوقود</div><div class="detail-spec-value">${car.fuel_tank_liters} لتر</div></div>` : ''}
          </div>
        </div>` : ''}

        <a href="index.html" style="display:flex;align-items:center;gap:var(--space-2);color:var(--color-text-muted);font-size:var(--text-sm);transition:color var(--transition);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18 6-6-6-6"/><path d="M9 18H3V6h6"/></svg>
          العودة لجميع السيارات
        </a>
      </div>
    </div>`;

  loading?.classList.add('hidden');
  container.classList.remove('hidden');
}

function renderRelated(currentCar) {
  const grid = document.getElementById('related-grid');
  if (!grid) return;
  const brandEn = (currentCar.brandEn || currentCar.make_en || '').toLowerCase();
  const body = currentCar.body_type || currentCar.category || '';
  const related = _carsData
    .filter(c => c.id !== currentCar.id && ((c.brandEn || c.make_en || '').toLowerCase() === brandEn || (c.body_type || c.category) === body))
    .slice(0, 3);
  if (!related.length) { document.getElementById('related-section')?.classList.add('hidden'); return; }
  grid.innerHTML = related.map((car) => {
    const nameAr = car.nameAr || `${car.make_ar} ${car.model_ar}`;
    const price = car.price_sar || car.price || 0;
    const img = car.primary_image || car.image || '';
    const body2 = car.body_type || car.category || '';
    const waMsg = encodeURIComponent(`مرحباً، أريد الاستفسار عن: ${nameAr} ${car.year}`);
    return `
      <article class="car-card" role="listitem" tabindex="0"
        onclick="window.location.href='car.html?id=${car.id}'"
        onkeydown="if(event.key==='Enter')window.location.href='car.html?id=${car.id}'">
        <div class="car-card-img-wrap">
          <img src="${img}" alt="${nameAr}" class="car-card-img" loading="lazy"
            onerror="this.src='https://picsum.photos/seed/car-default/800/500'">
          <div class="car-card-badge">${car.year}</div>
          <div class="car-card-category">${body2}</div>
        </div>
        <div class="car-card-body">
          <h3 class="car-card-name">${nameAr}</h3>
          <div class="car-card-price" dir="ltr"><span>﷼</span>${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
          <div class="car-card-footer" onclick="event.stopPropagation()">
            <a href="car.html?id=${car.id}" class="btn-details">التفاصيل</a>
            <a href="https://wa.me/966545888559?text=${waMsg}" target="_blank" rel="noopener" class="btn-wa">واتساب</a>
          </div>
        </div>
      </article>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const id = parseInt(new URLSearchParams(window.location.search).get('id'));
  if (!id || isNaN(id)) { showError(); return; }
  const car = _carsData.find(c => c.id === id);
  if (!car) { showError(); return; }
  renderCarDetail(car);
  renderRelated(car);
});

function showError() {
  document.getElementById('detail-loading')?.classList.add('hidden');
  document.getElementById('detail-error')?.classList.remove('hidden');
}
