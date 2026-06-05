
function storageKey(appKey) {
  return `oa_app_session_users_${appKey}`;
}

export function getAppSessionUsers(appKey) {
  if (!appKey) return [];
  try {
    const raw = localStorage.getItem(storageKey(appKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordAppSessionUser(appKey, { email, name, role = 'User' }) {
  if (!appKey || !email) return [];
  const users = getAppSessionUsers(appKey);
  const existing = users.find(u => u.email === email);
  const entry = {
    id: existing?.id || `user_${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    role,
    status: 'Active',
    lastSignIn: new Date().toISOString(),
  };
  const next = [entry, ...users.filter(u => u.email !== email)].slice(0, 50);
  try {
    localStorage.setItem(storageKey(appKey), JSON.stringify(next));
  } catch {}
  return next;
}

export function clearAppSessionUsers(appKey) {
  try {
    localStorage.removeItem(storageKey(appKey));
  } catch {}
}
