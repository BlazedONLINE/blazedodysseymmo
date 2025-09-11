// login.js
(() => {
  const API = (window.BTK_CONFIG && window.BTK_CONFIG.API_BASE_URL) || window.API_BASE || '';
  const TOKEN_KEY = window.BTK_TOKEN_KEY || 'btk_token';
  const EMAIL_KEY = window.BTK_EMAIL_KEY || 'btk_email';

  const form = document.getElementById('loginForm');
  const btn  = document.getElementById('loginBtn');
  const emailEl = document.getElementById('loginEmail');
  const passEl  = document.getElementById('loginPassword');
  const errorEl = document.getElementById('loginError');

  if (!form) return; // page doesn't have the login form

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    btn.disabled = true;

    try {
      const email = (emailEl.value || '').trim().toLowerCase();
      const password = passEl.value || '';

      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok || !data.token) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token + email and go to account
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(EMAIL_KEY, email);

      window.location.href = 'account.html';
    } catch (err) {
      errorEl.textContent = err.message || 'Login failed';
      btn.disabled = false;
    }
  });
})();
