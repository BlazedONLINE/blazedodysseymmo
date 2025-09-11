(() => {
  const API = (window.BTK_CONFIG||{}).API_BASE_URL || "";
  const form = document.getElementById('loginForm');
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');

  function setToken(t){ localStorage.setItem('btk_token', t); }

  async function api(url, opts={}) {
    try {
      const r = await fetch(url, opts);
      const data = await r.json().catch(()=>({}));
      return { ok:r.ok, status:r.status, data };
    } catch(e) {
      return { ok:false, status:0, data:{ error: e.message || 'Network error' } };
    }
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const res = await api(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email: email.value.trim(), password: password.value })
    });
    if (!res.ok || !res.data?.ok || !res.data?.token) {
      loginError.textContent = res.data?.error || `Login failed (HTTP ${res.status})`;
      return;
    }
    setToken(res.data.token);
    window.location.href = 'characters.html';
  });
})();
