import * as admin from 'firebase-admin';

/**
 * Parses the Firebase service account from the FIREBASE_SERVICE_ACCOUNT_KEY
 * environment variable. Accepts either a raw JSON string or a base64-encoded
 * JSON string, so deployments are not sensitive to how the value was stored.
 */
export function getFirebaseServiceAccount(): admin.ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Provide the full service account JSON (raw or base64-encoded).',
    );
  }

  const parsed = tryParseJson(raw) ?? tryParseBase64Json(raw);

  if (!parsed) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY could not be parsed as JSON or base64-encoded JSON.',
    );
  }

  return parsed as admin.ServiceAccount;
}

function tryParseJson(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function tryParseBase64Json(value: string): Record<string, unknown> | null {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Ensures the Firebase Admin SDK is initialized exactly once with the
 * shared service account credential and storage bucket.
 */
export function ensureFirebaseInitialized(): void {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(getFirebaseServiceAccount()),
      storageBucket: 'hr-dashboard-18e9e.appspot.com',
    });
  }
}
