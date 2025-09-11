// Signup page logic (create.html)
(() => {
  const form = document.getElementById('signupForm');
  if (!form) return;
  const email = document.getElementById('email');
  const pass = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  const btn = document.getElementById('signupBtn');
  const apiTip = document.getElementById('apiTip');
  const { API_BASE_URL: API } = window.BTK_CONFIG || {};

  if (!API) { apiTip.hidden = false; btn.disabled = true; return; }

  function validate() {
    const ok = email.value && pass.value.length >= 6 && pass.value === confirm.value;
    btn.disabled = !ok;
  }
  [email, pass, confirm].forEach(i => i.addEventListener('input', validate));
  validate();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    try {
      const r = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.value.trim(), password: pass.value })
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Signup failed');
      alert('Account created! Please log in on the Account page.');
      window.location.href = 'account.html';
    } catch (err) {
      alert(err.message || 'Signup failed');
    } finally {
      btn.disabled = false;
    }
  });
})();
