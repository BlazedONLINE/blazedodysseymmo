// Blessed TK — interactions, trailer, powerlist, signup
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  // Mobile nav
  const t = $('#navToggle'), m = $('#navMenu');
  if (t && m) t.addEventListener('click', ()=>{
    const open = m.classList.toggle('open');
    t.setAttribute('aria-expanded', String(open));
  });

  // Smooth scroll
  document.addEventListener('click', (e)=>{
    const a = e.target.closest("a[href^='#']");
    if(!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(!el) return;
    e.preventDefault();
    el.scrollIntoView({behavior:'smooth'});
    history.pushState(null,'','#'+id);
  });

  // Config & links
  const cfg = window.BTK_CONFIG || {};
  if (cfg.discord_url){ const d1 = $('#discordBtn'); if(d1) d1.href = cfg.discord_url; const d2 = $('#discordLink'); if(d2) d2.href = cfg.discord_url; }
  if (cfg.github_url){ const g = $('#githubLink'); if(g) g.href = cfg.github_url; }
  if (cfg.terms_url){ const el = $('#termsLink'); if(el) el.href = cfg.terms_url; }
  if (cfg.privacy_url){ const el = $('#privacyLink'); if(el) el.href = cfg.privacy_url; }

  // Trailer modal
  const modal = $('#trailerModal');
  const frame = $('#trailerFrame');
  const openers = $$('[data-open="trailerModal"]');
  const closers = $$('[data-close="trailerModal"]');
  function closeModal(){ modal.setAttribute('aria-hidden','true'); frame.src=''; }
  openers.forEach(b=>b.addEventListener('click', ()=>{
    if(cfg.trailer_url){ frame.src = cfg.trailer_url; modal.setAttribute('aria-hidden','true'); /* ensure reflow */ modal.setAttribute('aria-hidden','false'); }
    else alert('Set BTK_CONFIG.trailer_url in config.js');
  }));
  modal?.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
  closers.forEach(b=>b.addEventListener('click', closeModal));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal.getAttribute('aria-hidden')==='false') closeModal(); });

  // Toast helper
  const toastEl = $('#toast');
  function toast(msg){ if(!toastEl) return alert(msg); toastEl.textContent = msg; toastEl.hidden = false; setTimeout(()=> toastEl.hidden = true, 3200); }

  // Powerlist
  const body = $('#powerBody');
  const search = $('#powerSearch');
  const refresh = $('#refreshPower');
  let powerData = [];

  async function fetchPowerlist(){
    try{
      const url = (cfg.POWERLIST_URL && cfg.POWERLIST_URL.length) ? cfg.POWERLIST_URL : 'powerlist.json';
      const res = await fetch(url, { headers:{'Cache-Control':'no-cache'} });
      if(!res.ok) throw 0;
      const arr = await res.json();
      powerData = (arr || []).slice(0,100);
      renderPowerlist();
    }catch(_){
      toast('Powerlist unavailable — showing sample');
      try{
        const res = await fetch('powerlist.json');
        const arr = await res.json();
        powerData = (arr || []).slice(0,100);
        renderPowerlist();
      }catch(e){
        body.innerHTML = '<tr><td colspan="4">No data.</td></tr>';
      }
    }
  }

  function renderPowerlist(){
    const q = (search.value || '').trim().toLowerCase();
    const rows = powerData
      .filter(x => !q || x.name.toLowerCase().includes(q) || x.path.toLowerCase().includes(q))
      .map(x => `<tr><td>${x.rank}</td><td>${escapeHTML(x.name)}</td><td>${escapeHTML(x.path)}</td><td>${x.power?.toLocaleString?.() ?? x.power}</td></tr>`)
      .join('');
    body.innerHTML = rows || '<tr><td colspan="4">No matches.</td></tr>';
  }

  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  search?.addEventListener('input', renderPowerlist);
  refresh?.addEventListener('click', fetchPowerlist);

  // Signup validation
  const form = document.getElementById('signupForm');
  const btn = document.getElementById('signupBtn');
  const apiTip = document.getElementById('apiTip');
  function validate(){
    const u = document.getElementById('username').value.trim();
    const e = document.getElementById('email').value.trim();
    const p = document.getElementById('password').value;
    const c = document.getElementById('confirm').value;
    let valid = true;

    const uErr = document.getElementById('usernameError');
    const eErr = document.getElementById('emailError');
    const pErr = document.getElementById('passwordError');
    const cErr = document.getElementById('confirmError');

    uErr.textContent = eErr.textContent = pErr.textContent = cErr.textContent = '';

    if (!/^[a-zA-Z0-9_]{3,15}$/.test(u)) { uErr.textContent = '3–15 chars, letters/numbers/_ only'; valid = false; }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(e)) { eErr.textContent = 'Invalid email'; valid = false; }
    if (p.length < 6) { pErr.textContent = 'Password must be 6+ chars'; valid = false; }
    if (p !== c) { cErr.textContent = 'Passwords do not match'; valid = false; }

    const apiSet = !!(window.BTK_CONFIG && window.BTK_CONFIG.API_BASE_URL);
    btn.disabled = !valid || !apiSet;
    apiTip.hidden = apiSet;
  }
  form?.addEventListener('input', validate);
  form?.addEventListener('submit', async (e)=>{
    e.preventDefault(); validate(); if (btn.disabled) return;
    const api = window.BTK_CONFIG.API_BASE_URL;
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try{
      const res = await fetch(api + '/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, email, password }) });
      const data = await res.json().catch(()=> ({}));
      if (res.ok && (data.ok || data.success || !data.error)) { toast('Account created! You can log in inside the game client.'); form.reset(); btn.disabled = true; }
      else { toast(data.error || data.message || 'Signup failed'); }
    }catch(err){ toast('Signup service unavailable'); }
  });

  // Updates
  async function loadUpdates(){
    try{
      const res = await fetch('updates.json');
      if(!res.ok) throw 0;
      const data = await res.json();
      const wrap = document.getElementById('updatesList');
      wrap.innerHTML = data.map(u => `<div class='item'><div class='date'>${u.date}</div><h4>${u.title}</h4><p>${u.summary}</p></div>`).join('');
    }catch(_){ /* silent */ }
  }

  loadUpdates();
  fetchPowerlist();
})();
