(function () {
  const API = window.API_BASE;
  const TOKEN_KEY = window.BTK_TOKEN_KEY || "btk_token";
  const EMAIL_KEY = window.BTK_EMAIL_KEY || "btk_email";

  // Elements
  const authGate = document.getElementById("authGate");
  const accountPanel = document.getElementById("accountPanel");
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPass = document.getElementById("loginPass");
  const loginMsg = document.getElementById("loginMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const linkForm = document.getElementById("linkForm");
  const charName = document.getElementById("charName");
  const charPass = document.getElementById("charPass");
  const linkMsg = document.getElementById("linkMsg");
  const charGrid = document.getElementById("charGrid");
  const toast = document.getElementById("toast");

  function show(el) { el && el.removeAttribute("hidden"); }
  function hide(el) { el && el.setAttribute("hidden", ""); }
  function token() { return localStorage.getItem(TOKEN_KEY) || ""; }

  function setToast(msg) {
    if (!toast) return;
    toast.textContent = msg || "";
    if (!msg) { toast.hidden = true; return; }
    toast.hidden = false;
    setTimeout(() => (toast.hidden = true), 2500);
  }

  async function api(path, opts = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      opts.headers || {}
    );
    if (!("Authorization" in headers) && token()) {
      headers.Authorization = `Bearer ${token()}`;
    }
    const res = await fetch(`${API}${path}`, Object.assign({}, opts, { headers }));
    // Handle 401 cleanly
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      renderGate();
    }
    let data;
    try { data = await res.json(); } catch { data = { ok: false, error: "Bad JSON" }; }
    return data;
  }

  // ----------------------
  // Auth
  // ----------------------
  async function handleLogin(ev) {
    ev.preventDefault();
    loginMsg.textContent = "";

    const email = (loginEmail.value || "").trim().toLowerCase();
    const pass = loginPass.value || "";
    if (!email || !pass) { loginMsg.textContent = "Email and password required."; return; }

    const r = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
      headers: {} // api() adds JSON + Authorization as needed
    });

    if (!r.ok || !r.token) {
      loginMsg.textContent = r.error || "Login failed.";
      return;
    }
    localStorage.setItem(TOKEN_KEY, r.token);
    localStorage.setItem(EMAIL_KEY, email);
    loginForm.reset();
    await renderPanel();
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    renderGate();
  }

  // ----------------------
  // Characters
  // ----------------------
  function slotCard(slotIndex, detail) {
    const i = slotIndex + 1;
    if (!detail) {
      return `
        <div class="card slot empty">
          <div class="slot-head">Slot ${i}</div>
          <div class="muted">Empty</div>
        </div>`;
    }
    const { id, name, level, pathName, gmLevel } = detail;
    const gm = gmLevel && gmLevel > 0 ? `<span class="badge">GM ${gmLevel}</span>` : "";
    return `
      <div class="card slot">
        <div class="slot-head">Slot ${i} ${gm}</div>
        <div class="slot-body">
          <div class="slot-title">${name} <span class="muted">#${id}</span></div>
          <div class="slot-meta">Level ${level} • ${pathName}</div>
        </div>
      </div>`;
  }

  async function renderSlots() {
    // Prefer rich details; if route is missing, fall back to basic ids
    let details = await api("/characters/details");
    if (!details.ok) {
      // Fallback to /characters and map
      const base = await api("/characters");
      if (!base.ok) throw new Error(base.error || "Failed to load slots");
      const ids = base.slots || [0,0,0,0,0,0];
      const filled = await Promise.all(ids.map(async (id) => {
        if (!id) return null;
        const d = await api(`/characters/lookup?id=${encodeURIComponent(id)}`);
        return d.ok ? d : null;
      }));
      charGrid.innerHTML = filled.map((d, idx) => slotCard(idx, d && {
        id: d.id, name: d.name, level: d.level, pathName: d.pathName, gmLevel: d.gmLevel
      })).join("");
      return;
    }

    // details.ok
    const slots = details.slots || [null, null, null, null, null, null];
    charGrid.innerHTML = slots.map((d, idx) => {
      return slotCard(idx, d && {
        id: d.id, name: d.name, level: d.level, pathName: d.pathName, gmLevel: d.gmLevel
      });
    }).join("");
  }

  async function handleLink(ev) {
    ev.preventDefault();
    linkMsg.textContent = "";
    const name = (charName.value || "").trim();
    const pass = charPass.value || "";
    if (!name || !pass) { linkMsg.textContent = "Both fields required."; return; }

    const r = await api("/characters/register", {
      method: "POST",
      body: JSON.stringify({ name, password: pass })
    });

    if (!r.ok) {
      linkMsg.textContent = r.error || "Link failed.";
      return;
    }
    setToast("Character linked!");
    linkForm.reset();
    await renderSlots();
  }

  // ----------------------
  // Render gates/panel
  // ----------------------
  async function renderPanel() {
    hide(authGate);
    show(accountPanel);
    try {
      await renderSlots();
    } catch (e) {
      console.error(e);
      charGrid.innerHTML = `<div class="error">Failed to load characters.</div>`;
    }
  }

  function renderGate() {
    show(authGate);
    hide(accountPanel);
  }

  // ----------------------
  // Init
  // ----------------------
  document.addEventListener("DOMContentLoaded", () => {
    // Wire up events
    loginForm && loginForm.addEventListener("submit", handleLogin);
    logoutBtn && logoutBtn.addEventListener("click", handleLogout);
    linkForm && linkForm.addEventListener("submit", handleLink);

    // Decide what to show
    if (token()) renderPanel();
    else renderGate();
  });
})();
