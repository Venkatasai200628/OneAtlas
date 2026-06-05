import { NextResponse } from 'next/server';

/** Public Firebase web config — safe to expose; restricted by Firebase authorized domains. */
export function GET() {
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  };

  if (!config.apiKey || !config.authDomain || !config.projectId) {
    return NextResponse.json(
      { error: 'Firebase is not configured on the server. Add VITE_FIREBASE_* variables in Vercel.' },
      { status: 503 },
    );
  }

  return NextResponse.json(config, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
