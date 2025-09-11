// website/account.js

/* ====== tiny utils ====== */
const $  = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const CFG = (window.BTK_CONFIG && window.BTK_CONFIG.API_BASE_URL) || 'https://api.blessedtk.com';
const TOKEN_KEY = 'btk_token';

function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function toast(msg, ms = 3000) {
  const el = $('toast'); if (!el) return console.log(msg);
  el.textContent = msg; el.hidden = false; setTimeout(() => (el.hidden = true), ms);
}

async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const token = getToken();
  const h = { ...headers };
  if (!('Content-Type' in h) && body != null && typeof body !== 'string') h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;

  const res = await fetch(`${CFG}${path}`, {
    method,
    headers: h,
    body: body && typeof body !== 'string' ? JSON.stringify(body) : body,
    credentials: 'omit',
  });
  try { return await res.json(); } catch { return { ok:false, error:`HTTP ${res.status}` }; }
}

/* ====== rendering ====== */
function renderSlotsRich(slots = [], details = []) {
  const body = $('slotBody'); if (!body) return;
  const byId = new Map((details || []).map(d => [Number(d.id), d]));
  body.innerHTML = '';

  // If no slots provided, show 6 blanks
  const safeSlots = (slots && slots.length) ? slots : [0,0,0,0,0,0];

  safeSlots.forEach((cid, idx) => {
    const d = cid ? byId.get(Number(cid)) : null;

    const tr = document.createElement('tr');
    const tdSlot  = document.createElement('td');
    const tdName  = document.createElement('td');
    const tdPath  = document.createElement('td');
    const tdLevel = document.createElement('td');
    const tdId    = document.createElement('td');

    tdSlot.textContent  = String(idx + 1);
    tdName.textContent  = d ? (d.name || '—') : '—';
    tdPath.textContent  = d ? (d.pathName || (d.pathId != null ? `Path ${d.pathId}` : '—')) : '—';
    tdLevel.textContent = d ? String(d.level ?? 0) : '—';
    tdId.textContent    = cid ? String(cid) : '—';

    tr.append(tdSlot, tdName, tdPath, tdLevel, tdId);
    body.appendChild(tr);
  });
}

/* ====== data loaders ====== */
async function loadSlotsOnly() {
  const r = await api('/characters');
  if (r && r.ok) return r.slots || [0,0,0,0,0,0];
  throw new Error(r?.error || 'Failed to load slots');
}

async function loadDetailsBatch(ids) {
  // Try the rich endpoint first
  const r = await api('/characters/details');
  if (r && r.ok && Array.isArray(r.details) && r.details.length) {
    return { slots: r.slots || ids, details: r.details };
  }
  // Fallback: lookup each id
  const filled = ids.filter(x => Number(x) > 0);
  const lookups = await Promise.all(filled.map(id => api(`/characters/lookup?id=${encodeURIComponent(id)}`)));
  const details = lookups
    .map((res, i) => res && res.ok ? res : null)
    .filter(Boolean)
    .map(res => ({
      id: Number(res.id),
      name: res.name || '',
      level: res.level ?? null,
      pathId: res.pathId ?? null,
      pathName: res.pathName || (res.pathId != null ? `Path ${res.pathId}` : ''),
    }));
  return { slots: ids, details };
}

async function refreshSlots() {
  try {
    const slots = await loadSlotsOnly();
    const { details } = await loadDetailsBatch(slots);
    renderSlotsRich(slots, details);
  } catch (e) {
    console.error(e);
    toast('Could not load character slots.');
    renderSlotsRich([], []);
  }
}

/* ====== link / unlink actions ====== */
async function handleLinkSubmit(e) {
  e.preventDefault();
  const name = ($('linkName') || {}).value?.trim();
  const pass = ($('linkPassword') || {}).value || '';
  if (!name || !pass) return toast('Enter character name and password.');
  const r = await api('/characters/register', { method:'POST', body:{ name, password: pass } });
  if (r && r.ok) {
    toast('Character linked!');
    $('linkName').value = ''; $('linkPassword').value = '';
    refreshSlots();
  } else {
    toast(r?.error || 'Failed to link character.');
  }
}

async function handleUnlinkSubmit(e) {
  e.preventDefault();
  const idStr = ($('unlinkId') || {}).value?.trim();
  const id = Number(idStr);
  if (!id || Number.isNaN(id)) return toast('Enter a valid character ID.');
  const r = await api('/characters/unlink', { method:'POST', body:{ id } });
  if (r && r.ok) {
    toast('Character unlinked.');
    $('unlinkId').value = '';
    refreshSlots();
  } else {
    toast(r?.error || 'Failed to unlink character.');
  }
}

/* ====== auth gate & init ====== */
function gateUI() {
  const token = getToken();
  const needLogin = !token;

  const gated = $$('#authGate'); gated.forEach(el => el.hidden = needLogin);
  const loginMsg = $('loginReminder'); if (loginMsg) loginMsg.hidden = !needLogin;

  // Show email from JWT if present
  const emailEl = $('acctEmail');
  if (emailEl && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      emailEl.textContent = payload.email || '';
    } catch { emailEl.textContent = ''; }
  }

  const linkForm = $('linkForm');
  const unlinkForm = $('unlinkForm');
  if (needLogin) {
    [linkForm, unlinkForm].forEach(f => f && f.querySelectorAll('input,button').forEach(x => x.disabled = true));
    toast('Please log in first.');
    return false;
  } else {
    [linkForm, unlinkForm].forEach(f => f && f.querySelectorAll('input,button').forEach(x => x.disabled = false));
    if (linkForm) linkForm.addEventListener('submit', handleLinkSubmit);
    if (unlinkForm) unlinkForm.addEventListener('submit', handleUnlinkSubmit);
    return true;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // quick health ping (optional)
  api('/healthz').then(r => { if (!r?.ok) toast('API unavailable.'); }).catch(() => toast('API unavailable.'));
  if (gateUI()) refreshSlots();
});
