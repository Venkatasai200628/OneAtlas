# Deploy One Atlas to Vercel (production)

One Atlas is a **Vite React frontend** plus **Next.js API routes** (`/api/generate`, `/api/settings`, etc.). Vercel runs both: static SPA from `public/` and serverless API from `app/api/`.

---

## Prerequisites

1. [GitHub](https://github.com) account with this repo pushed
2. [Vercel](https://vercel.com) account (free tier works)
3. [Firebase](https://console.firebase.google.com) project (Auth + Firestore)
4. At least one **AI provider API key** (recommended: **OpenRouter** or **Groq** + **Anthropic**)

---

## Step 1 — Prepare Firebase

1. Create a Firebase project → **Authentication** → enable **Email/Password** and **Google**.
2. **Firestore** → create database (test mode is fine for hackathon; lock rules before real users).
3. **Project settings** → Your apps → **Web app** → copy config values.

4. **Authorized domains**: add your Vercel domain, e.g. `your-project.vercel.app` (and `localhost` for local dev). Required for Google sign-in redirect.

5. **Firestore rules** — copy the entire file [`firestore.rules`](firestore.rules) into Firebase Console → Firestore → **Rules** → **Publish**.

   Common mistake (will break invites):

   - Putting `match /appInvites/...` **outside** `match /databases/{database}/documents { ... }`
   - A global `match /{document=**} { allow read, write: if false; }` **before** `appInvites` (put deny-all **last**)

   After publishing, in the app: **Admin → Invitations → Sync to cloud** until you see “Synced to cloud”.

---

## Step 2 — Push code to GitHub

```bash
git add .
git commit -m "Prepare production Vercel deployment"
git push origin main
```

---

## Step 3 — Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository.
3. **Framework Preset**: Vercel should detect **Next.js** (because of `app/` and `vercel.json`).
4. **Build Command**: `node scripts/vercel-build.mjs` (already in `vercel.json`).
5. **Output Directory**: leave default (Next.js handles it; SPA is in `public/`).
6. **Install Command**: `npm install`.

Do **not** deploy yet — add environment variables first.

---

## Step 4 — Environment variables (Vercel dashboard)

In **Project → Settings → Environment Variables**, add:

### Required

| Variable | Example | Notes |
|----------|---------|--------|
| `VITE_APP_URL` | `https://your-project.vercel.app` | Public site URL (invite links) |
| `VITE_FIREBASE_API_KEY` | from Firebase | Client |
| `VITE_FIREBASE_AUTH_DOMAIN` | `xxx.firebaseapp.com` | Client |
| `VITE_FIREBASE_PROJECT_ID` | `xxx` | Client |
| `VITE_FIREBASE_STORAGE_BUCKET` | `xxx.appspot.com` | Client |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | numeric | Client |
| `VITE_FIREBASE_APP_ID` | `1:...:web:...` | Client |

### AI — server (recommended for `/api/generate`)

Set at least **one**; best coverage:

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Universal fallback (one key for all stages) |
| `GROQ_API_KEY` | Fast intent extraction |
| `ANTHROPIC_API_KEY` | Schema / repair quality |
| `OPENAI_API_KEY` | AppSpec generation |
| `KEY_ENCRYPTION_SECRET` | Required to encrypt/decrypt per-user server key vault |

Apply to **Production**, **Preview**, and **Development**.

### AI — client (optional)

Users can add keys in **Settings** in the UI. To pre-seed:

`VITE_OPENROUTER_API_KEY`, `VITE_GROQ_API_KEY`, etc.

---

## Step 5 — Deploy

1. Click **Deploy**.
2. Wait for build: `vite build` → copy to `public/` → `next build`.
3. Open the deployment URL.

---

## Step 6 — Verify production

Checklist:

- [ ] Landing page loads
- [ ] Login (Google / email) works
- [ ] **Settings** → add OpenRouter or Groq key → save
- [ ] **Generate** → run a prompt → pipeline completes (or client fallback with keys)
- [ ] **Evaluation** → run test #7 and #11 (vague prompts) — should pass with bootstrap
- [ ] **Projects** → saved app opens preview + admin
- [ ] **Admin → Invitations** → copy invite link → open in incognito → login → app opens

---

## Step 7 — Custom domain (optional)

1. Vercel → **Domains** → add `app.yourdomain.com`.
2. Update DNS CNAME to Vercel.
3. Set `VITE_APP_URL` to `https://app.yourdomain.com` and redeploy.

---

## Local production-like test

```bash
npm run build:vercel
npm run start:api
# Serve public/ with a static server on :5173, or use:
npx serve public -p 5173
```

API must be on port 3000; configure proxy or run full stack:

```bash
npm run dev
```

---

## Edge-case tests (offline)

```bash
npm run test:edge
```

Runs bootstrap, validation, and repair tests without API keys.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page after deploy | Check `public/index.html` exists post-build; verify SPA rewrite in `vercel.json` |
| `/api/generate` 404 | Ensure Next.js build succeeded; check Functions tab in Vercel |
| `No API keys configured` | Add server env vars (`GROQ_API_KEY`, etc.) on Vercel |
| Firebase auth error | Add Vercel domain to Firebase authorized domains |
| CORS / API fails | Same origin: frontend and `/api` on one Vercel domain — no proxy needed |
| Invite link wrong host | Set `VITE_APP_URL` to production URL and redeploy |
| Invite opens but no app | Add `appInvites` Firestore rules (see Step 1); sender must open app once while logged in so payload syncs to cloud |
| Google login COOP / `window.closed` errors | Redeploy with latest code (uses redirect sign-in + `same-origin-allow-popups` header); verify domain in Firebase **Authorized domains** |

---

## Security notes for production

- Do not commit `.env.local` or API keys.
- Prefer **server-side** keys on Vercel for generation; limit client keys if possible.
- Tighten Firestore rules before public launch.
- Rotate keys if exposed in client bundle (any `VITE_*` is public).
