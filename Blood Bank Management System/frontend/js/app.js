/**
 * Blood Bank Management System — Frontend Logic (v2 Full Featured)
 * Member 2 – Frontend Developer  |  Member 3 – Integration & QA Lead
 *
 * Backend API at http://localhost:8080/api
 */

const API = 'http://localhost:8080/api';

// ═══════════════════════════════════════════════════════════════════════════
// INSPIRATIONAL QUOTES FOR CERTIFICATE
// ═══════════════════════════════════════════════════════════════════════════

const DONATION_QUOTES = [
  "Be the reason for someone's heartbeat.",
  "Give blood, save lives.",
  "Every drop counts in the journey to save lives.",
  "A single drop of blood can make a huge difference.",
  "One Drop of Humanity. Give Blood. Save Lives."
];

function getRandomDonationQuote() {
  const idx = Math.floor(Math.random() * DONATION_QUOTES.length);
  return DONATION_QUOTES[idx];
}

async function getUpcomingCampDetails() {
  try {
    const camps = await apiFetch('/camps');
    if (Array.isArray(camps) && camps.length > 0) {
      // Prioritize UPCOMING camps, or take the first available
      const upcoming = camps.find(c => c.status === 'UPCOMING') || camps[0];
      return {
        name: upcoming.name || 'Blood Donation Drive',
        venue: upcoming.venue || 'Main Blood Bank Center, Civic Hospital',
        date: upcoming.date || new Date().toISOString().split('T')[0],
        time: '09:00 AM – 02:00 PM',
        organizer: upcoming.organizer || 'Blood Bank Management System'
      };
    }
  } catch (err) {
    console.warn('Could not fetch camp details for appointment:', err);
  }
  return {
    name: 'Blood Donation Center Camp',
    venue: 'City Hospital Blood Bank Center, Wing B',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:00 AM – 04:00 PM',
    organizer: 'Red Cross & BBMS Healthcare'
  };
}

function initTheme() {
  const savedTheme = localStorage.getItem('bbms_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  localStorage.setItem('bbms_theme', target);
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PASSKEY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const ADMIN_PASSKEY = 'blood@123';
let adminUnlocked = false;

function tryOpenAdmin() {
  if (adminUnlocked) {
    showPage('admin');
  } else {
    openPasskeyModal();
  }
}

function openPasskeyModal() {
  const modal = document.getElementById('passkeyModal');
  const input = document.getElementById('passkeyInput');
  const error = document.getElementById('passkeyError');
  modal.classList.add('show');
  error.classList.remove('show');
  input.value = '';
  setTimeout(() => input.focus(), 200);
}

function closePasskeyModal() {
  document.getElementById('passkeyModal').classList.remove('show');
}

function verifyPasskey(e) {
  e.preventDefault();
  const input = document.getElementById('passkeyInput');
  const error = document.getElementById('passkeyError');

  if (input.value === ADMIN_PASSKEY) {
    adminUnlocked = true;
    closePasskeyModal();
    showPage('admin');
  } else {
    error.classList.add('show');
    input.value = '';
    input.focus();
    input.style.animation = 'none';
    input.offsetHeight; // trigger reflow
    input.style.animation = 'shake .4s ease';
  }
}

function lockAdmin() {
  adminUnlocked = false;
  showPage('dashboard');
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'passkeyModal') closePasskeyModal();
  if (e.target.id === 'certModal') closeCertModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePasskeyModal();
    closeCertModal();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION & ADMIN SUB-TABS
// ═══════════════════════════════════════════════════════════════════════════

function showPage(id) {
  if (id === 'admin' && !adminUnlocked) {
    openPasskeyModal();
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tabs li a').forEach(a => a.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const navLink = document.querySelector(`a[data-page="${id}"]`);
  if (navLink) navLink.classList.add('active');

  // Trigger page specific data loading
  if (id === 'dashboard') loadStock();
  if (id === 'camps')     loadCamps();
  if (id === 'admin')     loadAdminData();
}

function showAdminTab(tabName) {
  const subTabs = ['analytics', 'donors', 'requests', 'history'];
  subTabs.forEach(t => {
    const el = document.getElementById(`admin${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (el) el.classList.remove('active');
  });

  document.querySelectorAll('.sub-tabs button').forEach(b => b.classList.remove('active'));

  const targetEl = document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (targetEl) targetEl.classList.add('active');

  const activeBtn = Array.from(document.querySelectorAll('.sub-tabs button')).find(
    btn => btn.getAttribute('onclick')?.includes(tabName)
  );
  if (activeBtn) activeBtn.classList.add('active');

  if (tabName === 'analytics') loadAnalytics();
  if (tabName === 'donors')    loadDonorsTable();
  if (tabName === 'requests')  loadRequestsTable();
  if (tabName === 'history')   loadDonationHistory();
}

function loadAdminData() {
  loadAnalytics();
}

// ═══════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

async function apiPost(path, data) {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED COUNTER HELPER
// ═══════════════════════════════════════════════════════════════════════════

function animateValue(elem, start, end, duration = 800) {
  if (!elem) return;
  if (isNaN(end)) { elem.textContent = end; return; }
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    elem.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      elem.textContent = end;
    }
  };
  window.requestAnimationFrame(step);
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD — STOCK CARDS
// ═══════════════════════════════════════════════════════════════════════════

function renderStockSkeleton() {
  const grid = document.getElementById('stockGrid');
  grid.innerHTML = Array(8).fill(0).map(() => `
    <div class="skeleton">
      <div class="skeleton-circle"></div>
      <div class="skeleton-bar w60" style="margin:0 auto 8px auto;"></div>
      <div class="skeleton-bar w40" style="margin:0 auto;"></div>
    </div>
  `).join('');
}

async function loadStock() {
  renderStockSkeleton();
  const grid = document.getElementById('stockGrid');

  try {
    const stocks = await apiFetch('/stock');
    let totalUnits = 0;
    let lowCount = 0;

    grid.innerHTML = '';
    stocks.forEach(s => {
      totalUnits += s.units;
      if (s.lowStock) lowCount++;

      grid.innerHTML += `
        <div class="stock-card ${s.lowStock ? 'low' : ''}">
          <div class="blood-type">${s.bloodGroup}</div>
          <div class="unit-count">${s.units} <span>unit${s.units !== 1 ? 's' : ''}</span></div>
          ${s.lowStock ? '<span class="low-tag">⚠ Low Stock</span>' : ''}
        </div>`;
    });

    const totalEl = document.getElementById('totalUnits');
    const lowEl = document.getElementById('lowCount');
    if (totalEl) animateValue(totalEl, 0, totalUnits);
    if (lowEl) animateValue(lowEl, 0, lowCount);
  } catch {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--danger)">
        <div style="font-size:2rem;margin-bottom:.5rem">⚠️</div>
        <strong>Cannot reach backend</strong><br>
        <span style="color:var(--text-secondary);font-size:.85rem">Ensure Java server is active on port 8080.</span>
      </div>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER DONOR
// ═══════════════════════════════════════════════════════════════════════════

async function registerDonor(e) {
  e.preventDefault();
  const form = e.target;
  const alert = document.getElementById('registerAlert');

  const data = {
    name: form.name.value.trim(),
    age: parseInt(form.age.value),
    bloodGroup: form.bloodGroup.value,
    phone: form.phone.value.trim(),
    lastDonationDate: form.lastDonationDate.value || ''
  };

  try {
    const res = await apiPost('/donors', data);
    showAlert(alert, res.success
      ? `✅ Donor "${data.name}" registered successfully! (ID: ${res.donor.id})`
      : `❌ ${res.message}`, res.success ? 'success' : 'error');
    if (res.success) form.reset();
  } catch {
    showAlert(alert, '⚠ Backend unreachable. Start the Java server first.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DONATE BLOOD & CERTIFICATE
// ═══════════════════════════════════════════════════════════════════════════

async function processDonation(e) {
  e.preventDefault();
  const form = e.target;
  const alert = document.getElementById('donateAlert');

  const donorId = parseInt(form.donorId.value);
  const units = parseInt(form.units.value);

  try {
    const res = await apiPost('/donate', { donorId, units });
    showAlert(alert, res.success ? `✅ ${res.message}` : `❌ ${res.message}`,
              res.success ? 'success' : 'error');

    if (res.success) {
      form.reset();
      // Show donation certificate modal with camp schedule details
      await showCertificate(donorId, res.bloodGroup || 'Blood', units, null, null, true);
    }
  } catch {
    showAlert(alert, '⚠ Backend unreachable.', 'error');
  }
}

function quickDonate(donorId) {
  showPage('donate');
  const input = document.querySelector('input[name="donorId"]');
  if (input) {
    input.value = donorId;
    input.focus();
  }
}

async function showCertificate(donorId, bloodGroup, units, donorNameOpt = null, dateOpt = null, isNewDonation = false) {
  const modal = document.getElementById('certModal');
  const quoteEl = document.getElementById('certQuote');
  const nameEl = document.getElementById('certName');
  const detailEl = document.getElementById('certDetail');
  const appointmentEl = document.getElementById('certAppointment');

  // Random inspirational quote replacing the old "Certificate of Blood Donation" heading
  if (quoteEl) {
    quoteEl.textContent = `“${getRandomDonationQuote()}”`;
  }

  // Retrieve donor name if not provided
  let donorName = donorNameOpt;
  if (!donorName) {
    try {
      const donors = await apiFetch('/donors');
      const found = Array.isArray(donors) ? donors.find(d => d.id === donorId) : null;
      donorName = found ? found.name : `Donor #${donorId}`;
    } catch {
      donorName = `Donor #${donorId}`;
    }
  }

  const dateStr = dateOpt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  nameEl.textContent = donorName;
  detailEl.innerHTML = `
    Has registered a donation of <strong>${units} unit(s)</strong> of <strong>${bloodGroup}</strong> blood.<br>
    Your generosity saves lives and strengthens our healthcare community.
  `;

  // Always fetch and attach camp details (Date, Time, Venue/Address) so the donor knows when & where to go
  const camp = await getUpcomingCampDetails();
  if (appointmentEl) {
    appointmentEl.style.display = 'block';
    appointmentEl.innerHTML = `
      <div class="cert-appointment-title">
        <span>📍</span> Donation Venue & Appointment Details
      </div>
      <div class="cert-appointment-item">
        <span>🎪</span>
        <div><strong>Camp / Drive:</strong> ${camp.name} (${camp.organizer})</div>
      </div>
      <div class="cert-appointment-item">
        <span>📅</span>
        <div><strong>Date:</strong> ${camp.date}</div>
      </div>
      <div class="cert-appointment-item">
        <span>⏰</span>
        <div><strong>Time:</strong> ${camp.time}</div>
      </div>
      <div class="cert-appointment-item">
        <span>🏢</span>
        <div><strong>Address / Venue:</strong> ${camp.venue}</div>
      </div>
    `;
  }

  modal.classList.add('show');
}

function closeCertModal() {
  document.getElementById('certModal').classList.remove('show');
}

function printCertificate() {
  window.print();
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOOD REQUEST
// ═══════════════════════════════════════════════════════════════════════════

async function submitRequest(e) {
  e.preventDefault();
  const form = e.target;
  const alert = document.getElementById('requestAlert');

  const data = {
    recipientName: form.recipientName.value.trim(),
    bloodGroup: form.bloodGroup.value,
    units: parseInt(form.units.value),
    reason: form.reason.value.trim()
  };

  try {
    const res = await apiPost('/request', data);
    showAlert(alert, res.success ? `✅ ${res.message}` : `⚠ ${res.message}`,
              res.success ? 'success' : 'warning');
    if (res.success) form.reset();
  } catch {
    showAlert(alert, '⚠ Backend unreachable.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FIND DONOR (SEARCH)
// ═══════════════════════════════════════════════════════════════════════════

async function searchNearby(e) {
  e.preventDefault();
  const bg = document.getElementById('searchBG').value;
  const res = document.getElementById('nearbyResult');
  res.innerHTML = '<p style="color:var(--text-muted)">Searching…</p>';

  try {
    const donors = await apiFetch(`/donors?bloodGroup=${encodeURIComponent(bg)}`);
    if (!donors.length) {
      res.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--text-secondary)">
          <div style="font-size:2rem;margin-bottom:.5rem">🔍</div>
          No donors registered for <strong>${bg}</strong>.
        </div>`;
      return;
    }

    res.innerHTML = donors.map(d => {
      const initials = d.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      return `
        <div class="donor-card">
          <div class="donor-info">
            <div class="avatar">${initials}</div>
            <div>
              <div class="donor-name">${d.name}</div>
              <div class="donor-meta">Age ${d.age} • Last donated: ${d.lastDonationDate ?? 'Never'}</div>
            </div>
          </div>
          <div class="donor-right">
            <div class="donor-bg">${d.bloodGroup}</div>
            <div class="donor-phone">📞 ${d.phone}</div>
            <button class="btn btn-primary btn-sm" style="margin-top:4px" onclick="quickDonate(${d.id})">Donate</button>
          </div>
        </div>`;
    }).join('');
  } catch {
    res.innerHTML = '<p style="color:var(--danger)">⚠ Backend unreachable.</p>';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPS & EVENTS MODULE
// ═══════════════════════════════════════════════════════════════════════════

async function loadCamps() {
  const list = document.getElementById('campsList');
  if (!list) return;
  list.innerHTML = '<p style="color:var(--text-muted)">Loading camps…</p>';

  try {
    const camps = await apiFetch('/camps');
    if (!camps.length) {
      list.innerHTML = '<p style="color:var(--text-muted)">No camps scheduled.</p>';
      return;
    }

    list.innerHTML = camps.map(c => {
      const badgeClass = c.status === 'UPCOMING' ? 'badge-ok'
                       : c.status === 'COMPLETED' ? 'badge-info'
                       : 'badge-err';
      return `
        <div class="camp-card">
          <div class="camp-header">
            <span class="camp-name">${c.name}</span>
            <span class="badge ${badgeClass}">${c.status}</span>
          </div>
          <div class="camp-detail">📍 ${c.venue}</div>
          <div class="camp-detail">📅 ${c.date}</div>
          <div class="camp-detail">🏢 Organized by ${c.organizer}</div>
        </div>`;
    }).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--danger)">⚠ Could not load camps.</p>';
  }
}

async function registerCamp(e) {
  e.preventDefault();
  const form = e.target;
  const alert = document.getElementById('campAlert');

  const data = {
    name: form.name.value.trim(),
    venue: form.venue.value.trim(),
    date: form.date.value,
    organizer: form.organizer.value.trim()
  };

  try {
    const res = await apiPost('/camps', data);
    showAlert(alert, res.success ? `✅ Camp scheduled successfully!` : `❌ Failed to schedule.`,
              res.success ? 'success' : 'error');
    if (res.success) {
      form.reset();
      loadCamps();
    }
  } catch {
    showAlert(alert, '⚠ Backend unreachable.', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — ANALYTICS & CHARTS
// ═══════════════════════════════════════════════════════════════════════════

async function loadAnalytics() {
  try {
    const data = await apiFetch('/analytics');
    const stock = await apiFetch('/stock');

    // 1. Top Stat Cards
    const statsContainer = document.getElementById('analyticsStats');
    const totalReq = data.totalRequests || 0;
    const fulfilled = data.fulfilledRequests || 0;
    const fulfillmentRate = totalReq > 0 ? Math.round((fulfilled / totalReq) * 100) : 0;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon red">🩸</div>
        <div class="stat-value" id="anTotalUnits">${data.totalUnitsInStock}</div>
        <div class="stat-label">Total Blood Units</div>
        <div class="stat-sub">Across 8 blood groups</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">👥</div>
        <div class="stat-value" id="anTotalDonors">${data.totalDonors}</div>
        <div class="stat-label">Registered Donors</div>
        <div class="stat-sub">${data.totalDonations} donations recorded</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">📋</div>
        <div class="stat-value" id="anTotalReq">${data.totalRequests}</div>
        <div class="stat-label">Total Requests</div>
        <div class="stat-sub">${fulfilled} fulfilled, ${data.rejectedRequests || 0} rejected</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">🎯</div>
        <div class="stat-value" id="anFulfillRate">${fulfillmentRate}%</div>
        <div class="stat-label">Fulfillment Rate</div>
        <div class="stat-sub">Supply matching efficiency</div>
      </div>
    `;

    // 2. Donut Chart — Stock Distribution
    renderDonutChart(stock);

    // 3. Stock Levels Bar Chart
    renderStockBarChart(stock);

    // 4. Donations vs Requests Comparison
    renderComparisonChart(data.donationsPerGroup || [], data.requestsPerGroup || []);

    // 5. Ranking — Most Requested Groups
    renderRankingChart(data.requestsPerGroup || []);

    // 6. Low-Stock Alerts
    renderLowStockAlerts(stock);

  } catch (err) {
    console.error('Analytics loading error:', err);
  }
}

function renderDonutChart(stock) {
  const container = document.getElementById('donutChart');
  if (!container) return;

  const colors = ['#dc2626', '#ea580c', '#eab308', '#16a34a', '#06b6d4', '#2563eb', '#9333ea', '#db2777'];
  const total = stock.reduce((sum, s) => sum + s.units, 0) || 1;

  let currentPercent = 0;
  const gradientParts = stock.map((s, idx) => {
    const percent = (s.units / total) * 100;
    const start = currentPercent;
    currentPercent += percent;
    return `${colors[idx % colors.length]} ${start}% ${currentPercent}%`;
  });

  const donutCss = `conic-gradient(${gradientParts.join(', ')})`;

  const legendHtml = stock.map((s, idx) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${colors[idx % colors.length]}"></span>
      <span>${s.bloodGroup}</span>
      <span class="legend-value">${s.units}u (${Math.round((s.units / total) * 100)}%)</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="donut-chart" style="background:${donutCss}">
      <div class="donut-center">
        <span class="donut-value">${total}</span>
        <span class="donut-label">Units</span>
      </div>
    </div>
    <div class="donut-legend">${legendHtml}</div>
  `;
}

function renderStockBarChart(stock) {
  const container = document.getElementById('stockBarChart');
  if (!container) return;

  const maxVal = Math.max(...stock.map(s => s.units), 10);

  const barsHtml = stock.map(s => {
    const heightPercent = Math.min(Math.round((s.units / maxVal) * 130), 130);
    return `
      <div class="bar-group">
        <div class="bar-stack">
          <div class="bar stock" style="height:${heightPercent}px" title="${s.bloodGroup}: ${s.units} units"></div>
        </div>
        <span class="bar-label">${s.bloodGroup}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="bar-chart">${barsHtml}</div>
    <div class="bar-chart-legend">
      <div class="legend-item"><span class="legend-dot" style="background:var(--primary)"></span> Stock Units</div>
    </div>
  `;
}

function renderComparisonChart(donations, requests) {
  const container = document.getElementById('comparisonChart');
  if (!container) return;

  const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  let maxVal = 1;

  const getD = bg => (donations.find(d => d.bloodGroup === bg) || {}).donations || 0;
  const getR = bg => (requests.find(r => r.bloodGroup === bg) || {}).requests || 0;

  groups.forEach(bg => {
    maxVal = Math.max(maxVal, getD(bg), getR(bg));
  });

  const barsHtml = groups.map(bg => {
    const dVal = getD(bg);
    const rVal = getR(bg);
    const dHeight = Math.max(Math.round((dVal / maxVal) * 120), 4);
    const rHeight = Math.max(Math.round((rVal / maxVal) * 120), 4);

    return `
      <div class="bar-group">
        <div class="bar-stack">
          <div class="bar donated" style="height:${dHeight}px" title="Donations: ${dVal}"></div>
          <div class="bar requested" style="height:${rHeight}px" title="Requests: ${rVal}"></div>
        </div>
        <span class="bar-label">${bg}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="bar-chart">${barsHtml}</div>
    <div class="bar-chart-legend">
      <div class="legend-item"><span class="legend-dot" style="background:var(--success)"></span> Donations</div>
      <div class="legend-item"><span class="legend-dot" style="background:var(--info)"></span> Requests</div>
    </div>
  `;
}

function renderRankingChart(requests) {
  const container = document.getElementById('rankingChart');
  if (!container) return;

  const sorted = [...requests].sort((a, b) => b.requests - a.requests);
  const maxReq = sorted.length > 0 && sorted[0].requests > 0 ? sorted[0].requests : 1;

  if (!sorted.length || sorted.every(s => s.requests === 0)) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:1rem 0;">No blood requests recorded yet.</p>';
    return;
  }

  container.innerHTML = `
    <div class="ranking-list">
      ${sorted.slice(0, 5).map((item, idx) => {
        const medalClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
        const widthPercent = Math.round((item.requests / maxReq) * 100);
        return `
          <div class="ranking-item">
            <span class="ranking-pos ${medalClass}">${idx + 1}</span>
            <div class="ranking-bar-wrap">
              <span class="ranking-bg">${item.bloodGroup}</span>
              <div class="ranking-fill-track">
                <div class="ranking-fill" style="width:${widthPercent}%"></div>
              </div>
              <span class="ranking-count">${item.requests}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLowStockAlerts(stock) {
  const container = document.getElementById('lowStockAlerts');
  if (!container) return;

  const lowItems = stock.filter(s => s.lowStock);
  if (!lowItems.length) {
    container.innerHTML = `
      <div style="color:var(--success-text);display:flex;align-items:center;gap:.5rem;padding:.5rem 0;">
        <span>✅</span> All blood groups currently have sufficient inventory (>5 units).
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="low-stock-list">
      ${lowItems.map(item => `
        <div class="low-stock-item">
          <div class="lsi-left">
            <span class="lsi-group">${item.bloodGroup}</span>
            <span class="lsi-info">Critical supply: only <strong>${item.units} unit(s)</strong> available (threshold: 5)</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="quickDonate('')">Mobilize Donors</button>
        </div>
      `).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — DONORS TABLE (WITH ELIGIBILITY BADGE & QUICK DONATE)
// ═══════════════════════════════════════════════════════════════════════════

async function loadDonorsTable(bloodGroup = '') {
  const tbody = document.querySelector('#donorsTable tbody');
  tbody.innerHTML = '<tr><td colspan="8" style="color:var(--text-muted);text-align:center;padding:1.5rem">Loading…</td></tr>';

  try {
    const url = bloodGroup ? `/donors?bloodGroup=${encodeURIComponent(bloodGroup)}` : '/donors';
    const donors = await apiFetch(url);

    if (!donors.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="color:var(--text-muted);text-align:center;padding:1.5rem">No donors found.</td></tr>';
      return;
    }

    // Check eligibility for each donor asynchronously
    const rows = await Promise.all(donors.map(async d => {
      let isEligible = false;
      let eligReason = '';
      try {
        const elig = await apiFetch(`/eligibility?donorId=${d.id}`);
        isEligible = elig.eligible;
        eligReason = elig.message;
      } catch (e) {
        isEligible = false;
      }

      const badgeHtml = isEligible
        ? `<span class="badge badge-ok" title="${eligReason}">✅ Eligible</span>`
        : `<span class="badge badge-err" title="${eligReason}">❌ Ineligible</span>`;

      return `
        <tr>
          <td><strong>${d.id}</strong></td>
          <td>${d.name}</td>
          <td>${d.age}</td>
          <td><span class="badge badge-ok">${d.bloodGroup}</span></td>
          <td>${d.phone}</td>
          <td>${d.lastDonationDate ?? '<em style="color:var(--text-muted)">Never</em>'}</td>
          <td>${badgeHtml}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="quickDonate(${d.id})" title="Record donation for ${d.name}">
              💉 Donate
            </button>
          </td>
        </tr>`;
    }));

    tbody.innerHTML = rows.join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--danger);text-align:center;padding:1.5rem">⚠ Backend unreachable.</td></tr>';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — REQUESTS TABLE
// ═══════════════════════════════════════════════════════════════════════════

async function loadRequestsTable() {
  const tbody = document.querySelector('#requestsTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);text-align:center;padding:1.5rem">Loading…</td></tr>';

  try {
    const reqs = await apiFetch('/requests');
    if (!reqs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);text-align:center;padding:1.5rem">No requests yet.</td></tr>';
      return;
    }

    tbody.innerHTML = reqs.map(r => {
      const badgeClass = r.status === 'FULFILLED' ? 'badge-ok'
                        : r.status === 'REJECTED'  ? 'badge-err'
                        : 'badge-warn';
      return `<tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.recipientName}</td>
        <td><span class="badge badge-ok">${r.bloodGroup}</span></td>
        <td>${r.unitsNeeded}</td>
        <td>${r.requestDate}</td>
        <td><span class="badge ${badgeClass}">${r.status}</span></td>
      </tr>`;
    }).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--danger);text-align:center;padding:1.5rem">⚠ Backend unreachable.</td></tr>';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — DONATION HISTORY TABLE & CERTIFICATES
// ═══════════════════════════════════════════════════════════════════════════

async function loadDonationHistory(donorId = '') {
  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);text-align:center;padding:1.5rem">Loading…</td></tr>';

  try {
    const url = donorId ? `/donations?donorId=${encodeURIComponent(donorId)}` : '/donations';
    const list = await apiFetch(url);

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);text-align:center;padding:1.5rem">No donation history recorded.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(item => `
      <tr>
        <td><strong>#${item.id}</strong></td>
        <td>${item.donorId}</td>
        <td>${item.donorName}</td>
        <td><span class="badge badge-ok">${item.bloodGroup}</span></td>
        <td><strong>${item.units}</strong></td>
        <td>${item.donationDate}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="showCertificate(${item.donorId}, '${item.bloodGroup}', ${item.units}, '${item.donorName}', '${item.donationDate}')">
            🏅 Certificate
          </button>
        </td>
      </tr>
    `).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--danger);text-align:center;padding:1.5rem">⚠ Backend unreachable.</td></tr>';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function showAlert(el, msg, type) {
  el.textContent = msg;
  el.className = `alert ${type} show`;
  setTimeout(() => el.classList.remove('show'), 6000);
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  showPage('dashboard');
});
