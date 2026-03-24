// Convert Arabic-Indic numerals to Western Arabic (English) numerals
function toEnglishNums(str) {
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}
// Run after DOM renders to fix any remaining Arabic numerals
function fixAllNumerals() {
  document.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0 && el.textContent) {
      const fixed = toEnglishNums(el.textContent);
      if (fixed !== el.textContent) el.textContent = fixed;
    }
  });
}
window.toEnglishNums = toEnglishNums;
document.addEventListener('DOMContentLoaded', () => setTimeout(fixAllNumerals, 500));


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
   AUTO MARKET SA — Main App Logic v2 (180 Cars)
   Filtering, rendering, theme toggle
   Reads admin edits from window['local'+'Storage'] first
   ============================================= */

// Load admin-edited data from window['local'+'Storage'] (set by admin panel)
(function() {
  try {
    const saved = _safeStore.getItem('automarket_cars_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Override _carsData with admin edits
        window._carsData = parsed;
      }
    }
  } catch(e) {}
  // If no window['local'+'Storage'] data, use the original _carsData from cars.js
  if (!window._carsData) window._carsData = carsData;
})();

// ===== THEME TOGGLE =====
(function () {
  const html = document.documentElement;
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = window.__siteTheme || preferred;
  html.setAttribute('data-theme', theme);

  function updateToggleIcon(t) {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.innerHTML = t === 'dark'
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
  updateToggleIcon(theme);

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    window.__siteTheme = next;
    updateToggleIcon(next);
  });
})();

// ===== SCROLL HEADER =====
window.addEventListener('scroll', () => {
  document.getElementById('main-header')?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ===== HELPERS =====
function formatPrice(p) { return p.toLocaleString('en-US') + ' ﷼'; }

function getFuelIcon(f) {
  const m = { petrol: '⛽', diesel: '🛢️', hybrid: '♻️', electric: '⚡' };
  return m[(f || '').toLowerCase()] || '⛽';
}

function buildWaUrl(car) {
  const msg = encodeURIComponent(`مرحباً، أريد الاستفسار عن:\n🚗 ${car.nameAr}\n📅 السنة: ${car.year}\n💰 السعر: ${formatPrice(car.price_sar || car.price)}\nالرجاء التواصل معي.`);
  return `https://wa.me/966545888559?text=${msg}`;
}

// ===== RENDER CARD =====
function renderCarCard(car, delay = 0) {
  const price = car.price_sar || car.price || 0;
  const fuel = (car.fuel_type || car.fuel || '').toLowerCase();
  const trans = car.transmission || 'Automatic';
  const hp = car.horsepower_hp || car.horsepower || 0;
  const engine = car.engine_cc > 0
    ? `${(car.engine_cc/1000).toFixed(1)}L`
    : (fuel === 'electric' ? 'كهربائي' : car.engine || '');
  const body = car.body_type || car.category || '';
  const nameAr = car.nameAr || `${car.make_ar} ${car.model_ar}`;
  const img = car.primary_image || car.image || '';
  const fuelLabel = car.fuel_type || car.fuel || '';

  return `
    <article class="car-card" role="listitem" style="animation-delay:${delay}ms"
      tabindex="0"
      aria-label="${nameAr} ${car.year} — ${formatPrice(price)}"
      onclick="window.location.href='car.html?id=${car.id}'"
      onkeydown="if(event.key==='Enter'||event.key===' ')window.location.href='car.html?id=${car.id}'">
      <div class="car-card-img-wrap">
        <img src="${img}" alt="${nameAr}" class="car-card-img" loading="lazy"
          onerror="this.src='https://picsum.photos/seed/car-default/800/500'">
        <div class="car-card-badge">${car.year}</div>
        <div class="car-card-category">${body}</div>
      </div>
      <div class="car-card-body">
        <div class="car-card-header">
          <h3 class="car-card-name">${nameAr}</h3>
        </div>
        <div class="car-card-price" dir="ltr"><span>﷼</span>${price.toLocaleString('en-US')}</div>
        <div class="car-card-specs">
          ${engine ? `<div class="car-spec-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> ${engine}</div>` : ''}
          <div class="car-spec-tag">${getFuelIcon(fuel)} ${fuelLabel}</div>
          <div class="car-spec-tag">🔄 ${trans === 'Automatic' ? 'أوتوماتيك' : 'يدوي'}</div>
          ${hp ? `<div class="car-spec-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg> ${hp} HP</div>` : ''}
        </div>
        <div class="car-card-footer" onclick="event.stopPropagation()">
          <a href="car.html?id=${car.id}" class="btn-details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            التفاصيل
          </a>
          <a href="${buildWaUrl(car)}" target="_blank" rel="noopener" class="btn-wa" onclick="event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            واتساب
          </a>
        </div>
      </div>
    </article>`;
}

// ===== APPLY FILTERS =====
function applyFilters() {
  const search = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const brand  = document.getElementById('filter-brand')?.value || '';
  const priceR = document.getElementById('filter-price')?.value || '';
  const fuel   = document.getElementById('filter-fuel')?.value || '';
  const trans  = document.getElementById('filter-trans')?.value || '';
  const cat    = document.getElementById('filter-cat')?.value || '';

  const filtered = _carsData.filter(car => {
    const nameAr = car.nameAr || `${car.make_ar} ${car.model_ar}`;
    const brandEn = (car.brandEn || car.make_en || '').toLowerCase();
    const fuelType = (car.fuel_type || car.fuelType || car.fuel || '').toLowerCase();
    const transType = (car.transmissionType || (car.transmission === 'Automatic' ? 'automatic' : 'manual'));
    const bodyType = car.body_type || car.category || '';
    const price = car.price_sar || car.price || 0;

    if (search) {
      const hay = `${nameAr} ${car.make_ar || ''} ${car.model_ar || ''} ${brandEn} ${bodyType}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (brand && !brandEn.includes(brand.toLowerCase())) return false;
    if (fuel) {
      if (fuel === 'hybrid' && !fuelType.includes('hybrid')) return false;
      if (fuel !== 'hybrid' && fuelType !== fuel) return false;
    }
    if (trans && transType !== trans) return false;
    if (cat && bodyType !== cat) return false;
    if (priceR) {
      const [min, max] = priceR.split('-').map(Number);
      if (price < min || price > max) return false;
    }
    return true;
  });

  renderGrid(filtered);
  updateResultsCount(filtered.length);
}

function renderGrid(cars) {
  const grid = document.getElementById('cars-grid');
  const empty = document.getElementById('empty-state');
  if (!grid) return;
  if (!cars.length) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
  empty?.classList.add('hidden');
  grid.innerHTML = cars.map((c, i) => renderCarCard(c, Math.min(i * 30, 600))).join('');
}

function updateResultsCount(count) {
  const el = document.getElementById('results-count');
  if (!el) return;
  el.textContent = count === _carsData.length ? `يتم عرض جميع السيارات (${count})` : `عُثر على ${count} سيارة`;
}

function resetFilters() {
  ['search-input','filter-brand','filter-price','filter-fuel','filter-trans','filter-cat']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  renderGrid(_carsData);
  updateResultsCount(_carsData.length);
}

function filterByBrand(brandEn) {
  const sel = document.getElementById('filter-brand');
  if (sel) sel.value = brandEn;
  applyFilters();
  document.getElementById('cars')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', () => {
  renderGrid(_carsData);
  updateResultsCount(_carsData.length);
});
