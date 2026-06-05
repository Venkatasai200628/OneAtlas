
import { db, ensureFirebase } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function storageKey(instanceId) {
  return `oa_invite_payload_${instanceId}`;
}

/** Firestore rejects undefined fields — strip via JSON round-trip. */
function forFirestore(value) {
  if (value == null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

/** Local cache (creator's browser). */
export function saveInvitePayload(instanceId, payload) {
  if (!instanceId || !payload) return;
  try {
    localStorage.setItem(storageKey(instanceId), JSON.stringify({
      ...payload,
      savedAt: new Date().toISOString(),
    }));
  } catch {}
}

export function loadInvitePayload(instanceId) {
  if (!instanceId) return null;
  try {
    const raw = localStorage.getItem(storageKey(instanceId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getInviteSyncStatus(instanceId) {
  try {
    return sessionStorage.getItem(`oa_invite_sync_${instanceId}`) || '';
  } catch {
    return '';
  }
}

function setInviteSyncStatus(instanceId, status) {
  try {
    sessionStorage.setItem(`oa_invite_sync_${instanceId}`, status);
  } catch {}
}

/**
 * Save locally + Firestore so invite links work for other users/devices.
 * @returns {{ ok: boolean, error?: string, code?: string }}
 */
export async function persistInvitePayload(instanceId, payload) {
  if (!instanceId || !payload) {
    return { ok: false, error: 'Missing app id or payload' };
  }

  await ensureFirebase();
  saveInvitePayload(instanceId, payload);

  const docData = forFirestore({
    intent: payload.intent || null,
    appSpec: payload.appSpec || null,
    schema: payload.schema || null,
    appName: payload.appName || payload.intent?.appName || 'App',
    ownerUid: payload.ownerUid || '',
    updatedAt: new Date().toISOString(),
  });

  if (!docData?.intent || !docData?.appSpec) {
    setInviteSyncStatus(instanceId, 'error:App data incomplete');
    return { ok: false, error: 'Intent or AppSpec missing' };
  }

  try {
    await setDoc(doc(db, 'appInvites', instanceId), docData, { merge: true });
    setInviteSyncStatus(instanceId, 'ok');
    return { ok: true };
  } catch (err) {
    const code = err?.code || '';
    const message = err?.message || String(err);
    console.error('[invite] Cloud persist failed:', code, message);
    setInviteSyncStatus(instanceId, `error:${code || message}`);
    if (code === 'permission-denied') {
      return {
        ok: false,
        code,
        error: 'Firestore blocked saving the invite. Paste the rules from firestore.rules in this repo into Firebase Console → Firestore → Rules, then Publish.',
      };
    }
    return { ok: false, code, error: message };
  }
}

/**
 * Load from cache first, then Firestore (for invite recipients).
 * @returns {Promise<{ payload: object|null, error?: string, code?: string }>}
 */
export async function fetchInvitePayload(instanceId) {
  if (!instanceId) return { payload: null };

  await ensureFirebase();
  const local = loadInvitePayload(instanceId);
  if (local?.intent && local?.appSpec) {
    return { payload: local };
  }

  try {
    const snap = await getDoc(doc(db, 'appInvites', instanceId));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.intent && data?.appSpec) {
        saveInvitePayload(instanceId, data);
        return { payload: data };
      }
      return { payload: null, error: 'Invite document exists but is missing app data. Sender should open the app and copy the link again.' };
    }
    return { payload: null, error: 'No invite found for this link.' };
  } catch (err) {
    const code = err?.code || '';
    const message = err?.message || String(err);
    console.error('[invite] Cloud fetch failed:', code, message);
    if (code === 'permission-denied') {
      return {
        payload: local,
        code,
        error: 'Firestore blocked reading the invite. Fix Rules: appInvites must allow read: if true (see firestore.rules in the repo).',
      };
    }
    return { payload: local, code, error: message };
  }
}

export const PENDING_INVITE_KEY = 'oa_pending_app_invite';
export const LOGIN_REDIRECT_KEY = 'oa_login_redirect';

export function setPendingAppInvite(instanceId) {
  try {
    sessionStorage.setItem(PENDING_INVITE_KEY, instanceId);
  } catch {}
}

export function consumePendingAppInvite() {
  try {
    const id = sessionStorage.getItem(PENDING_INVITE_KEY);
    sessionStorage.removeItem(PENDING_INVITE_KEY);
    return id;
  } catch {
    return null;
  }
}

export function setLoginRedirect(path) {
  try {
    if (path?.startsWith('/')) sessionStorage.setItem(LOGIN_REDIRECT_KEY, path);
  } catch {}
}

export function consumeLoginRedirect() {
  try {
    const path = sessionStorage.getItem(LOGIN_REDIRECT_KEY);
    sessionStorage.removeItem(LOGIN_REDIRECT_KEY);
    return path?.startsWith('/') ? path : null;
  } catch {
    return null;
  }
}
