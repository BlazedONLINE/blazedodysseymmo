// utils.js
export function toast(msg, ms = 3000) {
  const el = document.getElementById("toast");
  if (!el) return alert(msg);
  el.textContent = msg;
  el.hidden = false;
  setTimeout(() => (el.hidden = true), ms);
}

export function setActiveNav(id) {
  const link = document.querySelector(`nav a[data-nav="${id}"]`);
  if (link) link.classList.add("active");
}

export function apiBase() {
  return window.BTK_CONFIG.API_BASE_URL;
}
