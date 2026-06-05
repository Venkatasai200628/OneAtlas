import { NextResponse } from 'next/server';
import { getAllProviderStatus, setRuntimeKey, PROVIDER_DEFS } from '../../../lib/keyStore.js';
import { getUidFromAuthHeader, getEncryptedUserKeys, saveEncryptedUserKeys } from '../../../lib/userServerKeys.js';

export async function GET(req) {
  let vaultConfigured = false;
  let vaultConnected = false;
  try {
    try {
      const uid = await getUidFromAuthHeader(req);
      const auth = req?.headers?.get('authorization') || '';
      const idToken = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null;
      vaultConfigured = !!process.env.KEY_ENCRYPTION_SECRET;

      if (uid && idToken) {
        const storedKeys = await getEncryptedUserKeys(uid, idToken);
        if (storedKeys && typeof storedKeys === 'object') {
          for (const [provider, key] of Object.entries(storedKeys)) {
            if (PROVIDER_DEFS.find(p => p.id === provider)) {
              setRuntimeKey(provider, key);
            }
          }
          vaultConnected = true;
        }
      }
    } catch {}
  } catch {
    // Ignore auth/storage issues and fall back to env/runtime status.
  }

  return NextResponse.json({
    providers: getAllProviderStatus(),
    keys: Object.fromEntries(
      getAllProviderStatus()
        .filter(p => p.configured)
        .map(p => [p.id, 'configured'])
    ),
    vaultConfigured,
    vaultConnected,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { keys } = body;

    if (!keys || typeof keys !== 'object') {
      return NextResponse.json({ error: 'keys object required' }, { status: 400 });
    }

    const auth = req.headers.get('authorization') || '';
    const idToken = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
    let uid = null;
    if (idToken) uid = await getUidFromAuthHeader(req);

    const updated = [];
    const normalized = {};
    for (const [provider, key] of Object.entries(keys)) {
      const validProvider = PROVIDER_DEFS.find(p => p.id === provider);
      if (validProvider) {
        const normalizedKey = typeof key === 'string' ? key.trim() : '';
        setRuntimeKey(provider, normalizedKey);
        normalized[provider] = normalizedKey;
        updated.push(provider);
      }
    }

    let persistedToUserVault = false;
    let vaultWarning = null;
    if (uid && idToken) {
      try {
        await saveEncryptedUserKeys(uid, normalized, idToken);
        persistedToUserVault = true;
      } catch (err) {
        vaultWarning = err?.message || 'Failed to persist encrypted user keys';
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      persistedToUserVault,
      vaultWarning,
      vaultConfigured: !!process.env.KEY_ENCRYPTION_SECRET,
      vaultConnected: persistedToUserVault,
      providers: getAllProviderStatus(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
