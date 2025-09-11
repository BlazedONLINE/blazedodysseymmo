// home.js
(function () {
  const cfg = window.BTK_CONFIG || {};
  // Wire external links
  const setHref = (id, url) => { const el = document.getElementById(id); if (el && url) el.href = url; };
  setHref('discordBtn', cfg.discord_url);
  setHref('discordLink', cfg.discord_url);
  setHref('githubLink', cfg.github_url);
  setHref('termsLink', cfg.terms_url);
  setHref('privacyLink', cfg.privacy_url);

  // Trailer: use YouTube embed ID from config
  const id = cfg.trailer_embed_id || 'RBE-C-b86-Y';
  const iframe = document.getElementById('trailerFrame');
  if (iframe) iframe.src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;

  // Latest Updates preview (reads updates.json at site root)
  // Expected format: [{ "date":"2025-09-01", "title":"...", "body":"...", "link":"optional" }, ...]
  async function loadUpdatesPreview() {
    try {
      const r = await fetch('updates.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('updates.json not found');
      const items = await r.json();
      const list = document.getElementById('updatesPreview');
      if (!list) return;

      list.innerHTML = '';
      (items || []).slice(0, 3).forEach(u => {
        const card = document.createElement('article');
        card.className = 'news-tile';
        const date = u.date ? `<time class="muted sm">${u.date}</time>` : '';
        const title = u.link
          ? `<h3 class="news-title"><a href="${u.link}" target="_blank" rel="noopener">${u.title || 'Update'}</a></h3>`
          : `<h3 class="news-title">${u.title || 'Update'}</h3>`;
        const body = u.body ? `<p>${u.body}</p>` : '';
        card.innerHTML = `${date}${title}${body}`;
        list.appendChild(card);
      });

      if ((items || []).length === 0) {
        list.innerHTML = '<p class="muted">No updates yet.</p>';
      }
    } catch (e) {
      const list = document.getElementById('updatesPreview');
      if (list) list.innerHTML = '<p class="muted">Unable to load updates.</p>';
      // console.warn(e);
    }
  }

  loadUpdatesPreview();
})();
