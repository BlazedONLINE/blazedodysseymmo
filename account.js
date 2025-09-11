(() => {
  // --- config & helpers ------------------------------------------------------
  const CFG = window.BTK_CONFIG || {};
  const API = CFG.API_BASE_URL || "";              // must be set in config.js
  const NEXT = new URLSearchParams(location.search).get("next") || "characters.html";

  const $ = (id) => document.getElementById(id);
  const form = $("loginForm");
  const email = $("loginEmail");
  const password = $("loginPassword");
  const loginError = $("loginError");

  const getToken  = () => localStorage.getItem("btk_token") || "";
  const setToken  = (t) => localStorage.setItem("btk_token", t);
  const clearErr  = () => (loginError.textContent = "");
  const showErr   = (m) => (loginError.textContent = m);

  // If already logged in, go straight to characters
  const existing = getToken();
  if (existing) {
    // small delay so the DOM paints
    setTimeout(() => (window.location.href = NEXT), 50);
    return;
  }

  // --- network wrapper --------------------------------------------------------
  async function api(url, opts = {}) {
    try {
      const r = await fetch(url, opts);
      const isJson = (r.headers.get("content-type") || "").includes("application/json");
      const data = isJson ? await r.json() : await r.text();
      return { ok: r.ok, status: r.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: e?.message || "Network error" } };
    }
  }

  // --- submit handler ---------------------------------------------------------
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErr();

    if (!API) {
      showErr("API not configured. Check config.js (API_BASE_URL).");
      return;
    }
    const payload = {
      email: (email?.value || "").trim(),
      password: password?.value || ""
    };
    if (!payload.email || !payload.password) {
      showErr("Please enter email and password.");
      return;
    }

    const res = await api(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // handle non-200 or {ok:false}
    if (!res.ok || !res.data || res.data.ok === false || !res.data.token) {
      const msg =
        (res.data && res.data.error) ||
        (typeof res.data === "string" ? res.data : null) ||
        `Login failed (HTTP ${res.status})`;
      showErr(msg);
      return;
    }

    // success: store token & redirect
    setToken(res.data.token);
    window.location.href = NEXT; // default to characters.html
  });

  // Safety: if the submit button is clicked without JS binding (edge), prevent duplicate submits
  $("loginSubmit")?.addEventListener("click", (ev) => {
    if (!form) return;
    // Let the form submit handler run
  });

  // Optional: Enter key convenience
  [email, password].forEach((el) =>
    el?.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") form?.dispatchEvent(new Event("submit"));
    })
  );
})();
