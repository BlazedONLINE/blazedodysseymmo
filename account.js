(() => {
  const API = (window.BTK_CONFIG||{}).API_BASE_URL || "";
  const form = document.getElementById('loginForm');
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const charList = document.getElementById('charList');
  const linkForm = document.getElementById('linkForm');
  const linkError = document.getElementById('linkError');

  // Small UI helpers
  const $ = s => document.querySelector(s);
  function show(el, html){ if (el) el.innerHTML = html; }
  function text(el, t){ if (el) el.textContent = t; }

  function setToken(t){ localStorage.setItem('btk_token', t); }
  function getToken(){ return localStorage.getItem('btk_token') || ""; }
  function clearToken(){ localStorage.removeItem('btk_token'); }

  // Add a logout button next to the header if logged in
  function ensureLogoutButton() {
    let bar = document.querySelector('.container.narrow h2');
    if (!bar) return;
    let btn = document.getElementById('logoutBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'logoutBtn';
      btn.className = 'btn ghost sm';
      btn.style.marginLeft = '1rem';
      btn.textContent = 'Log out';
      btn.addEventListener('click', () => {
        clearToken();
        location.reload();
      });
      bar.appendChild(btn);
    }
    btn.hidden = !getToken();
  }

  async function api(url, opts={}) {
    try {
      const r = await fetch(url, opts);
      const ct = r.headers.get('content-type')||'';
      const body = ct.includes('json') ? await r.json() : await r.text();
      return { ok: r.ok, status: r.status, data: body };
    } catch (e) {
      return { ok:false, status:0, data:{ error: e.message || 'Network error' } };
    }
  }

  async function login() {
    text(loginError, "");
    try {
      const res = await api(`${API}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      if (!res.ok || !res.data?.ok || !res.data?.token) {
        throw new Error(res.data?.error || `Login failed (HTTP ${res.status})`);
      }
      setToken(res.data.token);
      // Force a fresh load so anything that depended on initial token-less state resets
      location.href = 'account.html';
    } catch(e) {
      text(loginError, e.message || 'Login failed');
      console.error('Login error:', e);
    }
  }

  async function getSlots() {
    const token = getToken();
    if (!token) return { ok:false, error:'NO_TOKEN' };
    const res = await api(`${API}/characters`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { ok:false, error: res.data?.error || `HTTP ${res.status}` };
    return res.data;
  }

  // Optional detail lookup (works if backend has /characters/lookup)
  async function lookupChar(id) {
    if (!id) return null;
    const res = await api(`${API}/characters/lookup?id=${encodeURIComponent(id)}`);
    return res.ok ? res.data : null;
  }

  function pathNameFromId(id) {
    const map = { 1:'Rogue', 2:'Mage', 3:'Priest', 4:'Poet', 5:'Warrior', 6:'GM' };
    return map[id] || (id ? `Path ${id}` : 'Unknown');
  }

  async function refreshCharacters() {
    ensureLogoutButton();

    const token = getToken();
    if (!token) {
      show(charList, `
        <div class="muted">
          Not logged in. Please log in above.<br>
          Tip: stay on the same domain (either <code>www.blessedtk.com</code> <em>or</em> <code>blessedtk.com</code>)
          so your saved token is found.
        </div>
      `);
      return;
    }

    show(charList, 'Loading…');

    const slots = await getSlots();
    if (!slots?.ok) {
      show(charList, `<div class="error">Failed to load characters: ${slots?.error || 'Unknown error'}</div>`);
      console.error('Characters load error:', slots);
      return;
    }

    const ids = (slots.slots || []).filter(x => Number(x) > 0);
    if (!ids.length) {
      show(charList, '<div class="muted">No characters linked yet.</div>');
      return;
    }

    // Try to enrich with details; degrade gracefully
    const details = await Promise.all(ids.map(id => lookupChar(id).catch(() => null)));
    const items = ids.map((id, i) => {
      const d = details[i];
      const name = d?.name ?? `#${id}`;
      const level = d?.level ?? '—';
      const path = d?.pathName ?? pathNameFromId(d?.pathId);
      return `
        <div class="char-card">
          <div><strong>${escapeHtml(name)}</strong></div>
          <div class="muted">Level ${escapeHtml(level)} — ${escapeHtml(path)}</div>
        </div>`;
    });

    show(charList, items.join(''));
  }

  async function linkCharacter(e) {
    e.preventDefault();
    text(linkError,'');
    const token = getToken();
    if (!token) { text(linkError,'Please log in first.'); return; }

    const name = (document.getElementById('charName').value||'').trim();
    const pass = document.getElementById('charPassword').value||'';
    if (!name || !pass) { text(linkError, 'Enter name and password.'); return; }

    const res = await api(`${API}/characters/register`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, password: pass })
    });

    if (!res.data?.ok) {
      text(linkError, res.data?.error || `Link failed (HTTP ${res.status})`);
      console.error('Link error:', res);
      return;
    }

    (e.target.reset && e.target.reset());
    await refreshCharacters();
  }

  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));}

  // Wire up
  form?.addEventListener('submit', (e) => { e.preventDefault(); login(); });
  linkForm?.addEventListener('submit', linkCharacter);

  // Auto-load on entry if a token is already present
  refreshCharacters();
})();
