// Small helper used by account.js; can be extended later.
export async function loadSlots(API, token) {
  const r = await fetch(`${API}/characters`, { headers: { Authorization: `Bearer ${token}` } });
  return r.json(); // { ok:true, slots:[...] }
}

export async function registerCharacter(API, token, name, password) {
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
