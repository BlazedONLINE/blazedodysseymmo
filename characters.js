(() => {
  const API = (window.BTK_CONFIG||{}).API_BASE_URL || "";
  const charList = document.getElementById('charList');
  const linkForm = document.getElementById('linkForm');
  const linkError = document.getElementById('linkError');
  const tokenError = document.getElementById('tokenError');
  const logoutBtn = document.getElementById('logoutBtn');

  const getToken = () => localStorage.getItem('btk_token') || "";
  const clearToken = () => localStorage.removeItem('btk_token');

  // Guard: if no token, go back to login page
  const token = getToken();
  if (!token) {
    tokenError.hidden = false;
    tokenError.textContent = 'Not logged in. Redirecting to account…';
    setTimeout(() => (window.location.href = 'account.html'), 800);
  }

  logoutBtn?.addEventListener('click', () => {
    clearToken();
    window.location.href = 'account.html';
  });

  async function api(url, opts={}) {
    try {
      const r = await fetch(url, opts);
      const ct = r.headers.get('content-type')||'';
      const body = ct.includes('json') ? await r.json() : await r.text();
      return { ok:r.ok, status:r.status, data: body };
    } catch(e) {
      return { ok:false, status:0, data:{ error: e.message || 'Network error' } };
    }
  }

  async function getSlots() {
    const res = await api(`${API}/characters`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error(res.data?.error || `HTTP ${res.status}`);
    return res.data.slots || [];
  }

  async function lookupChar(id) {
    const res = await api(`${API}/characters/lookup?id=${encodeURIComponent(id)}`);
    return res.ok ? res.data : null;
  }

  function pathNameFromId(id) {
    const map = {1:'Rogue',2:'Mage',3:'Priest',4:'Poet',5:'Warrior',6:'GM'};
    return map[id] || (id ? `Path ${id}` : 'Unknown');
  }

  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));}

  async function render() {
    charList.textContent = 'Loading…';
    try {
      const ids = (await getSlots()).filter(x => Number(x) > 0);
      if (!ids.length) { charList.innerHTML = '<div class="muted">No characters linked yet.</div>'; return; }

      const details = await Promise.all(ids.map(id => lookupChar(id).catch(()=>null)));
      const html = ids.map((id,i) => {
        const d = details[i];
        const name = d?.name ?? `#${id}`;
        const level = d?.level ?? '—';
        const path = d?.pathName ?? pathNameFromId(d?.pathId);
        return `
          <div class="char-card">
            <div><strong>${escapeHtml(name)}</strong></div>
            <div class="muted">Level ${escapeHtml(level)} — ${escapeHtml(path)}</div>
          </div>`;
      }).join('');
      charList.innerHTML = html;
    } catch(e) {
      charList.innerHTML = `<div class="error">Failed to load: ${escapeHtml(e.message||'Unknown')}</div>`;
      console.error(e);
    }
  }

  linkForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    linkError.textContent = '';
    const name = (document.getElementById('charName').value||'').trim();
    const pass = document.getElementById('charPassword').value||'';
    if (!name || !pass) { linkError.textContent = 'Enter name and password.'; return; }

    const res = await api(`${API}/characters/register`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ name, password: pass })
    });

    if (!res.data?.ok) {
      linkError.textContent = res.data?.error || `Link failed (HTTP ${res.status})`;
      return;
    }
    (e.target.reset && e.target.reset());
    render();
  });

  render();
})();
