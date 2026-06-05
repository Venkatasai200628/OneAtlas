
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ensureFirebase } from './lib/firebase';

function showBootstrapError(message) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:48px auto;padding:24px;border:1px solid #FCA5A5;border-radius:16px;background:#FFF0F0;color:#111">
      <h1 style="font-size:18px;margin:0 0 12px">Firebase not configured</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#374151">${message}</p>
      <p style="font-size:13px;line-height:1.6;margin:0;color:#6B7280">
        In Vercel → Settings → Environment Variables, add all <code>VITE_FIREBASE_*</code> keys from your local <code>.env.local</code>, then redeploy.
      </p>
    </div>
  `;
}

ensureFirebase()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  })
  .catch((err) => {
    console.error('[firebase] init failed:', err);
    showBootstrapError(err?.message || 'Could not load Firebase configuration.');
  });
