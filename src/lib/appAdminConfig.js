
const DEFAULT_CONFIG = {
  deployed: false,
  deployedAt: null,
  visibility: 'Private',
  requireLogin: false,
  domains: [],
  settings: {
    displayName: '',
    supportEmail: '',
    appDescription: '',
    notifications: {
      emailDigests: true,
      recordAlerts: true,
      weeklySummary: false,
    },
  },
  security: {
    previewPassword: '',
    twoFactorEnabled: false,
    lastPasswordChange: null,
  },
};

function storageKey(appKey) {
  return `oa_app_admin_${appKey}`;
}

export function loadAppAdminConfig(appKey) {
  if (!appKey) return { ...DEFAULT_CONFIG, settings: { ...DEFAULT_CONFIG.settings, notifications: { ...DEFAULT_CONFIG.settings.notifications } }, security: { ...DEFAULT_CONFIG.security } };
  try {
    const raw = localStorage.getItem(storageKey(appKey));
    if (!raw) return loadAppAdminConfig(null);
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      settings: { ...DEFAULT_CONFIG.settings, ...parsed.settings, notifications: { ...DEFAULT_CONFIG.settings.notifications, ...parsed.settings?.notifications } },
      security: { ...DEFAULT_CONFIG.security, ...parsed.security },
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
    };
  } catch {
    return loadAppAdminConfig(null);
  }
}

export function saveAppAdminConfig(appKey, patch) {
  if (!appKey) return loadAppAdminConfig(null);
  const current = loadAppAdminConfig(appKey);
  const next = {
    ...current,
    ...patch,
    settings: patch.settings ? { ...current.settings, ...patch.settings } : current.settings,
    security: patch.security ? { ...current.security, ...patch.security } : current.security,
    domains: patch.domains !== undefined ? patch.domains : current.domains,
  };
  try {
    localStorage.setItem(storageKey(appKey), JSON.stringify(next));
  } catch {}
  return next;
}

export function slugifyAppName(name) {
  return (name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
}

export function getDefaultPlatformDomain(appName) {
  const slug = slugifyAppName(appName);
  const host = typeof window !== 'undefined' ? window.location.hostname.replace(/[^a-z0-9.-]/gi, '') : 'oneatlas.app';
  return `${slug}.${host}`;
}
