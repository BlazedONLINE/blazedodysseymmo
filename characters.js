// characters.js
const API = 'https://api.blessedtk.com';

async function loadSlots() {
  const token = localStorage.getItem('btk_token');
  const r = await fetch(`${API}/characters`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.json(); // { ok:true, slots:[...] }
}

async function registerCharacter(name, password) {
  const token = localStorage.getItem('btk_token');
  const r = await fetch(`${API}/characters/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, password })
  });
  return r.json();
}
