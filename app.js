// Small helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const cfg = window.BTK_CONFIG || {};
const API = cfg.API_BASE_URL || "";

// ----- Nav toggle (mobile) -----
(() => {
  const btn = $('#navToggle');
  const menu = $('#navMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
  });
})();

// ----- Footer/Header external links from config -----
(() => {
  const map = [
    ['#discordBtn', cfg.discord_url],
    ['#discordLink', cfg.discord_url],
    ['#githubLink', cfg.github_url],
    ['#termsLink', cfg.terms_url],
    ['#privacyLink', cfg.privacy_url],
  ];
  map.forEach(([sel, url]) => { const el = $(sel); if (el && url) el.href = url; });
})();

// ----- Trailer handling -----
(() => {
  const btns = $$('[data-open="trailerModal"]');
  const frame = $('#trailerFrame');
  const modal = $('#trailerModal');
  if (!btns.length || !frame || !modal || !cfg.trailer_url) return;

  let embedUrl = cfg.trailer_url;
  try {
    const u = new URL(cfg.trailer_url);
    const isYT = u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be');
    if (isYT) {
      let id = u.searchParams.get('v');
      if (!id && u.hostname.includes('youtu.be')) id = u.pathname.replace('/', '');
      if (id) embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
  } catch { /* ignore */ }

  const open = () => { frame.src = embedUrl; modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); };
  const close = () => { frame.src = ''; modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); };

  btns.forEach(b => b.addEventListener('click', open));
  modal.querySelectorAll('[data-close="trailerModal"], .modal-backdrop').forEach(el => el.addEventListener('click', close));
})();

// ----- Powerlist (if table exists) -----
(async () => {
  const body = $('#powerBody');
  if (!body) return;
  const search = $('#powerSearch');
  const refresh = $('#refreshPower');

  async function fetchPower() {
    try {
      const r = await fetch(`${API}/powerlist/top?limit=100`, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json(); // expected: [{rank,name,path,power}]
      return Array.isArray(data) ? data : (data.rows || []);
    } catch {
      return [];
    }
  }

  function render(rows) {
    const q = (search?.value || '').toLowerCase();
    const filtered = rows.filter(x =>
      !q ||
      (x.name && x.name.toLowerCase().includes(q)) ||
      (x.path && x.path.toLowerCase().includes(q))
    );
    body.innerHTML = filtered.map(r => `
      <tr><td>${r.rank ?? ''}</td><td>${r.name ?? ''}</td><td>${r.path ?? ''}</td><td>${r.power ?? ''}</td></tr>
    `).join('') || `<tr><td colspan="4" class="muted">No data.</td></tr>`;
  }

  const rows = await fetchPower();
  render(rows);
  search?.addEventListener('input', () => render(rows));
  refresh?.addEventListener('click', async () => { const rows2 = await fetchPower(); render(rows2); });
})();

// ----- Updates page loader (if container exists) -----
(function loadUpdates() {
  const wrap = $('#updatesList');
  if (!wrap) return;
  fetch('updates.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : [])
    .then(items => {
      if (!Array.isArray(items) || !items.length) {
        wrap.innerHTML = '<div class="news-tile">No updates yet.</div>';
        return;
      }
      wrap.innerHTML = items.map(u => `
        <article class="news-tile">
          <header><h3>${esc(u.title)}</h3><time class="muted sm">${esc(u.date)}</time></header>
          <p>${esc(u.body)}</p>
        </article>
      `).join('');
    })
    .catch(() => wrap.innerHTML = '<div class="news-tile error">Failed to load updates.</div>');
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));}
})();
