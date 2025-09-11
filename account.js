// website/account.js

/* ====== tiny utils ====== */
const $  = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const CFG = (window.BTK_CONFIG && window.BTK_CONFIG.API_BASE_URL) || 'https://api.blessedtk.com';
const TOKEN_KEY = 'btk_token';

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

function toast(msg, ms = 3000) {
  const el = $('toast');
  if (!el) return alert(msg);
  el.textContent = msg;
  el.hidden = false;
  setTimeout(() => (el.hidden = true), ms);
}

async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const token = getToken();
  const h = { ...headers };
  if (!('Content-Type' in h) && body != null && typeof body !== 'string') {
    h['Content-Type'] = 'application/json';
  }
  if (token) h.Authorization = `Bearer ${token}`;

  const res = await fetch(`${CFG}${path}`, {
    method,
    headers: h,
    body: body && typeof body !== 'string' ? JSON.stringify(body) : body,
    credentials: 'omit',
  });
  let data = null;
  try { data = await res.json(); } catch { /* leave null */ }
  return data || { ok: false, error: `HTTP ${res.status}` };
}

/* ====== rendering ====== */
function renderSlotsRich(slots = [], details = []) {
  const body = $('slotBody');
  if (!body) return;
  const byId = new Map(details.map(d => [Number(d.id), d]));

  body.innerHTML = '';
  slots.forEach((cid, idx) => {
    const d = cid ? byId.get(Number(cid)) : null;

    const tr = document.createElement('tr');

    const tdSlot  = document.createElement('td');
    const tdName  = document.createElement('td');
    const tdPath  = document.createElement('td');
    const tdLevel = document.createElement('td');
    const tdId    = document.createElement('td');

    tdSlot.textContent  = String(idx + 1);
    tdName.textContent  = d ? (d.name || '—') : '—';
    tdPath.textContent  = d ? (d.pathName || (d.pathId ? `Path ${d.pathId}` : '—')) : '—';
    tdLevel.textContent = d ? String(d.level ?? 0) : '—';
    tdId.textContent    = cid ? String(cid) : '—';

    tr.appendChild(tdSlot);
    tr.appendChild(tdName);
    tr.appendChild(tdPath);
    tr.appendChild(tdLevel);
    tr.appendChild(tdId);

    body.appendChild(tr);
  });
}

async function refreshSlots() {
  // Prefer rich endpoint
  let r = await api('/characters/details');
  if (r && r.ok) {
    renderSlotsRich(r.slots || [], r.details || []);
    return;
  }
  // Fallback (IDs only)
  r = await api('/characters');
  if (r && r.ok) {
    renderSlotsRich(r.slots || [], []);
  } else {
    renderSlotsRich([], []);
    toast((r && r.error) || 'Failed to load characters.');
  }
}

/* ====== link / unlink actions ====== */
async function handleLinkSubmit(e) {
  e.preventDefault();
  const name = ($('linkName') || {}).value?.trim();
  const pass = ($('linkPassword') || {}).value || '';

  if (!name || !pass) {
    toast('Enter character name and password.');
    return;
  }

  const r = await api('/characters/register', {
    method: 'POST',
    body: { name, password: pass },
  });

  if (r && r.ok) {
    toast('Character linked!');
    ( $('linkName') && ($('linkName').value = '') );
    ( $('linkPassword') && ($('linkPassword').value = '') );
    refreshSlots();
  } else {
    toast((r && r.error) || 'Failed to link character.');
  }
}

async function handleUnlinkSubmit(e) {
  e.preventDefault();
  const idStr = ($('unlinkId') || {}).value?.trim();
  const id = Number(idStr);
  if (!id || Number.isNaN(id)) {
    toast('Enter a valid character ID to unlink.');
    return;
  }

  const r = await api('/characters/unlink', {
    method: 'POST',
    body: { id },
  });

  if (r && r.ok) {
    toast('Character unlinked.');
    ($('unlinkId') && ($('unlinkId').value = ''));
    refreshSlots();
  } else {
    toast((r && r.error) || 'Failed to unlink character.');
  }
}

/* ====== auth gate ====== */
function checkAuthAndWireUI() {
  const token = getToken();
  const needLogin = !token;

  // Optional: show account email from JWT
  const emailEl = $('acctEmail');
  if (emailEl) {
    let email = '';
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        email = payload.email || '';
      }
    } catch {}
    emailEl.textContent = email;
  }

  // Toggle UI areas (if your HTML has them)
  const gated = $$('#authGate');
  gated.forEach(el => el.hidden = needLogin);

  const loginMsg = $('loginReminder');
  if (loginMsg) loginMsg.hidden = !needLogin;

  // Wire forms only when authed
  const linkForm = $('linkForm');
  const unlinkForm = $('unlinkForm');

  if (needLogin) {
    // disable forms
    if (linkForm) linkForm.querySelectorAll('input,button').forEach(x => x.disabled = true);
    if (unlinkForm) unlinkForm.querySelectorAll('input,button').forEach(x => x.disabled = true);
    toast('Please log in first.');
    return;
  }

  if (linkForm) {
    linkForm.querySelectorAll('input,button').forEach(x => x.disabled = false);
    linkForm.addEventListener('submit', handleLinkSubmit);
  }
  if (unlinkForm) {
    unlinkForm.querySelectorAll('input,button').forEach(x => x.disabled = false);
    unlinkForm.addEventListener('submit', handleUnlinkSubmit);
  }

  refreshSlots();
}

/* ====== init ====== */
document.addEventListener('DOMContentLoaded', () => {
  // Optional: health check to hint config issues
  api('/healthz').then(r => {
    if (!r || !r.ok) toast('API unavailable.');
  }).catch(() => toast('API unavailable.'));

  checkAuthAndWireUI();
});
