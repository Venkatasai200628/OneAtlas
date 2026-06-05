
const STORAGE_KEY = 'oa_integration_keys';

const CORE = ['slack', 'whatsapp', 'gmail', 'stripe', 'webhook'];

export function loadIntegrationKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveIntegrationKey(integrationId, credentials) {
  const all = loadIntegrationKeys();
  if (!credentials || (!credentials.apiKey && !credentials.token && !credentials.webhookSecret)) {
    delete all[integrationId];
  } else {
    all[integrationId] = {
      ...credentials,
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
  return all;
}

export function removeIntegrationKey(integrationId) {
  const all = loadIntegrationKeys();
  delete all[integrationId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
  return all;
}

export function getIntegrationKey(integrationId) {
  return loadIntegrationKeys()[integrationId] || null;
}

export function isIntegrationConfigured(integrationId) {
  const c = getIntegrationKey(integrationId);
  if (!c) return false;
  return !!(c.apiKey || c.token || c.webhookSecret || c.accountSid);
}

export function maskSecret(value) {
  if (!value || value.length < 8) return '••••••••';
  return value.slice(0, 4) + '••••' + value.slice(-4);
}

export async function syncIntegrationKeysToServer(keys) {
  try {
    const res = await fetch('/api/integration-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export { CORE as CORE_INTEGRATIONS };
