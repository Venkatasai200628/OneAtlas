import crypto from 'crypto';

const FIREBASE_ACCOUNTS_LOOKUP = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

function getFirebaseApiKey() {
  return process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';
}

function getFirebaseProjectId() {
  return process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
}

function getEncryptionSecret() {
  const secret = process.env.KEY_ENCRYPTION_SECRET || '';
  if (!secret) {
    throw new Error('KEY_ENCRYPTION_SECRET is not configured');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptJson(value) {
  const key = getEncryptionSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
}

function decryptJson(payload) {
  const key = getEncryptionSecret();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const encrypted = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  return JSON.parse(plaintext);
}

function firestoreDocUrl(uid) {
  const projectId = getFirebaseProjectId();
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID (or VITE_FIREBASE_PROJECT_ID) is not configured');
  }
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userServerKeys/${uid}`;
}

function toFirestoreBody(encryptedPayload) {
  return {
    fields: {
      encrypted: { mapValue: { fields: {
        iv: { stringValue: encryptedPayload.iv },
        tag: { stringValue: encryptedPayload.tag },
        data: { stringValue: encryptedPayload.data },
      } } },
      updatedAt: { stringValue: new Date().toISOString() },
    },
  };
}

function fromFirestoreDoc(doc) {
  const encrypted = doc?.fields?.encrypted?.mapValue?.fields;
  if (!encrypted?.iv?.stringValue || !encrypted?.tag?.stringValue || !encrypted?.data?.stringValue) {
    return null;
  }
  return {
    iv: encrypted.iv.stringValue,
    tag: encrypted.tag.stringValue,
    data: encrypted.data.stringValue,
  };
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getUidFromAuthHeader(req) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const idToken = auth.slice('Bearer '.length).trim();
  if (!idToken) return null;
  const apiKey = getFirebaseApiKey();
  if (!apiKey) {
    throw new Error('FIREBASE_API_KEY (or VITE_FIREBASE_API_KEY) is not configured');
  }

  const res = await fetch(`${FIREBASE_ACCOUNTS_LOOKUP}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  const body = await parseJsonSafe(res);
  const uid = body?.users?.[0]?.localId;
  return uid || null;
}

export async function saveEncryptedUserKeys(uid, keys, idToken) {
  const encryptedPayload = encryptJson(keys);
  const res = await fetch(firestoreDocUrl(uid), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(toFirestoreBody(encryptedPayload)),
  });

  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(body?.error?.message || 'Failed to save user keys');
  }
}

export async function getEncryptedUserKeys(uid, idToken) {
  const res = await fetch(firestoreDocUrl(uid), {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await parseJsonSafe(res);
    throw new Error(body?.error?.message || 'Failed to read user keys');
  }
  const doc = await parseJsonSafe(res);
  const encrypted = fromFirestoreDoc(doc);
  if (!encrypted) return null;
  return decryptJson(encrypted);
}
