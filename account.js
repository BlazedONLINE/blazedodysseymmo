// account.js

const API_BASE = (window.BTK_CONFIG && window.BTK_CONFIG.API_BASE_URL) || 'https://api.blessedtk.com';

function getToken() {
  return localStorage.getItem('btk_token') || '';
}

function setToken(t) {
  if (t) localStorage.setItem('btk_token', t);
}

function clearToken() {
  localStorage.removeItem('btk_token');
}

async function api(path, opts = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    (getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
  );
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  return data;
}

function $(id) {
  return document.getElementById(id);
}

function setHidden(el, hidden) {
  if (!el) return;
  el.hidden = !!hidden;
}

function showLogin() {
  setHidden($('loginPanel'), false);
  setHidden($('accountPanel'), true);
}

function showAccount() {
  setHidden($('loginPanel'), true);
  setHidden($('accountPanel'), false);
}

function renderSlots(slots = []) {
  const body = $('slotBody');
  body.innerHTML = '';
  slots.forEach((id, idx) => {
    const tr = document.createElement('tr');
    const tdIdx = document.createElement('td');
    const tdId  = document.createElement('td');
    tdIdx.textContent = (idx + 1).toString();
    tdId.textContent  = id ? id : '—';
    tr.appendChild(tdIdx);
    tr.appendChild(tdId);
    body.appendChild(tr);
  });
}

async function refreshSlots() {
  const r = await api('/characters');
  if (r && r.ok) {
    renderSlots(r.slots || []);
  } else {
    renderSlots([]);
    toast(r.error || 'Failed to load characters.');
  }
}

function toast(msg, ok = false) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('error');
  if (ok) t.classList.add('ok'); else t.classList.remove('ok');
  t.hidden = false;
  setTimeout(() => (t.hidden = true), 3000);
}

// --- Event wiring ---
window.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (token) {
    showAccount();
    refreshSlots();
  } else {
    showLogin();
  }

  // Login
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginError').textContent = '';
    const email = $('loginEmail').value.trim().toLowerCase();
    const password = $('loginPassword').value;

    const r = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (r && r.ok && r.token) {
      setToken(r.token);
      $('loginPassword').value = '';
      showAccount();
      refreshSlots();
      toast('Logged in!', true);
    } else {
      $('loginError').textContent = r.error || 'Login failed.';
    }
  });

  // Logout
  $('logoutBtn').addEventListener('click', () => {
    clearToken();
    showLogin();
    toast('Logged out', true);
  });

  // Refresh
  $('refreshBtn').addEventListener('click', refreshSlots);

  // Link character
  $('linkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('linkError').textContent = '';
    $('linkOk').textContent = '';

    const name = $('charName').value.trim();
    const password = $('charPass').value;

    if (!name || !password) {
      $('linkError').textContent = 'Character name and password are required.';
      return;
    }

    const r = await api('/characters/register', {
      method: 'POST',
      body: JSON.stringify({ name, password })
    });

    if (r && r.ok) {
      $('linkOk').textContent = 'Character linked!';
      $('charPass').value = '';
      refreshSlots();
    } else {
      $('linkError').textContent = r.error || 'Failed to link character.';
    }
  });

  // Unlink character
  $('unlinkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('unlinkError').textContent = '';
    $('unlinkOk').textContent = '';

    const idVal = $('unlinkId').value.trim();
    const charId = parseInt(idVal, 10);

    if (!charId) {
      $('unlinkError').textContent = 'Enter a valid character ID (number).';
      return;
    }

    const r = await api('/characters/unregister', {
      method: 'POST',
      body: JSON.stringify({ charId })
    });

    if (r && r.ok) {
      $('unlinkOk').textContent = 'Character unlinked.';
      $('unlinkId').value = '';
      refreshSlots();
    } else {
      $('unlinkError').textContent = r.error || 'Failed to unlink character.';
    }
  });
});
