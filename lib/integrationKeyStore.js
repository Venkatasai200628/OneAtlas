
const runtimeIntegrationKeys = new Map();

export function setIntegrationCredentials(integrationId, credentials) {
  if (!credentials) {
    runtimeIntegrationKeys.delete(integrationId);
    return;
  }
  runtimeIntegrationKeys.set(integrationId, { ...credentials, updatedAt: new Date().toISOString() });
}

export function getIntegrationCredentials(integrationId) {
  return runtimeIntegrationKeys.get(integrationId) || null;
}

export function getAllIntegrationCredentials() {
  const out = {};
  for (const [id, creds] of runtimeIntegrationKeys) {
    out[id] = {
      configured: !!(creds.apiKey || creds.token || creds.webhookSecret || creds.accountSid),
      updatedAt: creds.updatedAt,
    };
  }
  return out;
}

export function bulkSetIntegrationKeys(keys) {
  if (!keys || typeof keys !== 'object') return;
  for (const [id, creds] of Object.entries(keys)) {
    setIntegrationCredentials(id, creds);
  }
}
