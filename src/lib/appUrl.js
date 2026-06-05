
export function getAppBaseUrl() {
  const env = import.meta.env.VITE_APP_URL;
  if (env) return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://appforge.app';
}

export function getUserInviteLink(uid) {
  const base = getAppBaseUrl();
  return uid ? `${base}/login?ref=${uid}` : `${base}/login`;
}

export function getAppShareLink(appInstanceId) {
  const base = getAppBaseUrl();
  return `${base}/login?appInvite=${encodeURIComponent(appInstanceId)}`;
}

export function getUserAppShareLink(uid, appName) {
  const slug = (appName || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const base = getAppBaseUrl();
  return uid
    ? `${base}/app/projects?invite=${encodeURIComponent(slug)}&owner=${encodeURIComponent(uid)}`
    : `${base}/app/projects?invite=${encodeURIComponent(slug)}`;
}

export function getGeneratedAppInviteLink(appInstanceId, ownerUid, appName) {
  const base = getAppBaseUrl();
  const params = new URLSearchParams();
  params.set('appInvite', appInstanceId);
  if (ownerUid) params.set('owner', ownerUid);
  if (appName) params.set('appName', appName);
  return `${base}/login?${params.toString()}`;
}
