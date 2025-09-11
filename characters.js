(() => {
  const CFG = window.BTK_CONFIG || {};
  const API = CFG.API_BASE_URL || "";
  const $ = (id) => document.getElementById(id);

  const grid = $("charGrid");
  const toast = $("toast");

  function getToken() {
    return localStorage.getItem("btk_token") || "";
  }
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(say._t);
    say._t = setTimeout(() => (toast.hidden = true), 2500);
  }

  // Redirect to login if no token
  const TOKEN = getToken();
  if (!TOKEN) {
    location.href = "account.html?next=characters.html";
    return;
  }
  if (!API) {
    say("API not configured (check config.js)");
    return;
  }

  // --- API helpers -----------------------------------------------------------
  async function api(path, opts = {}) {
    try {
      const r = await fetch(`${API}${path}`, {
        ...opts,
        headers: {
          ...(opts.headers || {}),
          Authorization: `Bearer ${TOKEN}`,
        },
      });
      const ct = r.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await r.json() : await r.text();
      return { ok: r.ok, status: r.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: e?.message || "Network error" } };
    }
  }

  async function lookupChar(id) {
    // public lookup, no auth header required
    try {
      const r = await fetch(`${API}/characters/lookup?id=${encodeURIComponent(id)}`);
      const data = await r.json();
      return data && data.ok ? data : null;
    } catch {
      return null;
    }
  }

  // --- Render helpers --------------------------------------------------------
  function slotCardSkeleton(index) {
    const div = document.createElement("div");
    div.className = "card char-card";
    div.innerHTML = `
      <div class="char-head">
        <div class="char-slot">Slot ${index + 1}</div>
        <div class="char-name muted">Loading…</div>
      </div>
      <div class="char-meta muted sm">Please wait</div>
    `;
    return div;
  }

  function filledCard(index, detail) {
    const div = document.createElement("div");
    div.className = "card char-card";
    div.innerHTML = `
      <div class="char-head">
        <div class="char-slot">Slot ${index + 1}</div>
        <div class="char-name">${detail.name}</div>
      </div>
      <div class="char-meta">
        <span class="pill">Level ${detail.level}</span>
        <span class="pill">${detail.pathName || `Path ${detail.pathId ?? "?"}`}</span>
        <span class="pill id">ID ${detail.id}</span>
      </div>
    `;
    return div;
  }

  function emptyCard(index) {
    const div = document.createElement("div");
    div.className = "card char-card empty";
    const formId = `linkForm_${index}`;
    div.innerHTML = `
      <div class="char-head">
        <div class="char-slot">Slot ${index + 1}</div>
        <div class="char-name muted">Empty slot</div>
      </div>

      <details class="linker">
        <summary>Link a character</summary>
        <form id="${formId}" class="inline-form">
          <label>
            <span class="sr-only">Character name</span>
            <input name="name" type="text" placeholder="Character name" required />
          </label>
          <label>
            <span class="sr-only">Character password</span>
            <input name="password" type="password" placeholder="Character password" required />
          </label>
          <button type="submit" class="btn sm">Link</button>
          <div class="err sm" aria-live="polite"></div>
        </form>
      </details>
    `;

    // attach submit handler
    const form = div.querySelector(`#${CSS.escape(formId)}`);
    const errBox = form.querySelector(".err");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errBox.textContent = "";
      const fd = new FormData(form);
      const payload = {
        name: (fd.get("name") || "").toString().trim(),
        password: (fd.get("password") || "").toString(),
      };
      if (!payload.name || !payload.password) {
        errBox.textContent = "Enter name & password.";
        return;
      }
      const res = await api("/characters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.data || res.data.ok === false) {
        errBox.textContent =
          (res.data && res.data.error) || `Failed (HTTP ${res.status || "?"})`;
        return;
      }
      say("Character linked!");
      await loadAndRender(); // refresh all slots
    });

    return div;
  }

  // --- Main loader -----------------------------------------------------------
  async function loadAndRender() {
    grid.innerHTML = "";
    // skeletons first
    for (let i = 0; i < 6; i++) grid.appendChild(slotCardSkeleton(i));

    const res = await api("/characters");
    if (!res.ok || !res.data || res.data.ok === false || !Array.isArray(res.data.slots)) {
      grid.innerHTML = `<div class="muted">Failed to load characters.</div>`;
      return;
    }

    const ids = res.data.slots.slice(0, 6);
    // fetch details for filled slots in parallel
    const detailPromises = ids.map((id) => (id ? lookupChar(id) : Promise.resolve(null)));
    const details = await Promise.all(detailPromises);

    // render final
    grid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const id = ids[i] || 0;
      const det = details[i];
      if (id > 0 && det) {
        grid.appendChild(filledCard(i, det));
      } else {
        grid.appendChild(emptyCard(i));
      }
    }
  }

  // kick off
  loadAndRender();
})();
