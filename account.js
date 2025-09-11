(() => {
  const API = (window.BTK_CONFIG||{}).API_BASE_URL || "";
  const form = document.getElementById('loginForm');
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const charList = document.getElementById('charList');
  const linkForm = document.getElementById('linkForm');
  const linkError = document.getElementById('linkError');

  function setToken(t){ localStorage.setItem('btk_token', t); }
  function getToken(){ return localStorage.getItem('btk_token') || ""; }

  async function api(url, opts={}) {
    const r = await fetch(url, opts);
    const ct = r.headers.get('content-type')||'';
    const body = ct.includes('json') ? await r.json() : await r.text();
    return { ok: r.ok, data: body };
  }

  async function login() {
    loginError.textContent = "";
    try {
      const res = await api(`${API}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      if (!res.ok || !res.data?.ok || !res.data?.token) {
        throw new Error(res.data?.error || 'Invalid credentials');
      }
      setToken(res.data.token);
      await refreshCharacters();
    } catch(e) { loginError.textContent = e.message || 'Login failed'; }
  }

  async function getSlots() {
    const token = getToken();
    if (!token) return null;
    const res = await api(`${API}/characters`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  }

  // Optional detail lookup (works if backend has /characters/lookup)
  async function lookupChar(id) {
    if (!id) return null;
    try {
      const res = await api(`${API}/characters/lookup?id=${encodeURIComponent(id)}`);
      return res.ok ? res.data : null;
    } catch { return null; }
  }

  function pathNameFromId(id) {
    const map = {
      1:'Rogue', 2:'Mage', 3:'Priest', 4:'Poet', 5:'Warrior', 6:'GM'
    };
    return map[id] || `Path ${id ?? ''}`.trim();
  }

  async function refreshCharacters() {
    const token = getToken();
    if (!token) { charList.textContent = 'Log in to view characters.'; return; }
    charList.textContent = 'Loading…';
    try {
      const data = await getSlots();
      if (!data?.ok) throw new Error(data?.error || 'Failed to load characters');

      const ids = (data.slots || []).filter(x => Number(x) > 0);
      if (!ids.length) { charList.innerHTML = '<div class="muted">No characters linked yet.</div>'; return; }

      // Try to enrich with details; gracefully degrade
      const details = await Promise.all(ids.map(id => lookupChar(id).catch(()=>null)));
      const items = ids.map((id, i) => {
        const d = details[i];
        const name = d?.name ?? `#${id}`;
        const level = d?.level ?? '—';
        const path = d?.pathName ?? pathNameFromId(d?.pathId);
        return `<div class="char-card"><div><strong>${name}</strong></div><div class="muted">Level ${level} — ${path}</div></div>`;
      });

      charList.innerHTML = items.join('');
    } catch (e) {
      charList.innerHTML = '<div class="error">Failed to load characters.</div>';
    }
  }

  async function linkCharacter(e) {
    e.preventDefault();
    linkError.textContent = '';
    const token = getToken();
    if (!token) { linkError.textContent = 'Please log in first.'; return; }
    const name = (document.getElementById('charName').value||'').trim();
    const pass = document.getElementById('charPassword').value||'';
    if (!name || !pass) { linkError.textContent = 'Enter name and password.'; return; }

    try {
      const res = await api(`${API}/characters/register`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, password: pass })
      });
      if (!res.data?.ok) throw new Error(res.data?.error || 'Link failed');
      await refreshCharacters();
      linkForm.reset();
    } catch (e) {
      linkError.textContent = e.message || 'Link failed';
    }
  }

  // Wire up events
  form?.addEventListener('submit', (e) => { e.preventDefault(); login(); });
  linkForm?.addEventListener('submit', linkCharacter);

  // Auto-load if token exists
  if (getToken()) refreshCharacters();
})();
