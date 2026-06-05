
function key(appKey) {
  return `oa_app_invites_${appKey}`;
}

export function getAppInvitations(appKey) {
  if (!appKey) return [];
  try {
    const raw = localStorage.getItem(key(appKey));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addAppInvitation(appKey, email) {
  if (!appKey || !email?.includes('@')) return getAppInvitations(appKey);
  const list = getAppInvitations(appKey);
  if (list.some(i => i.email === email)) return list;
  const next = [{ id: `inv_${Date.now()}`, email, status: 'Pending', sentAt: new Date().toISOString() }, ...list].slice(0, 100);
  try {
    localStorage.setItem(key(appKey), JSON.stringify(next));
  } catch {}
  return next;
}

export function removeAppInvitation(appKey, id) {
  const next = getAppInvitations(appKey).filter(i => i.id !== id);
  try {
    localStorage.setItem(key(appKey), JSON.stringify(next));
  } catch {}
  return next;
}
