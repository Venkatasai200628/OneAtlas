# OneAtlas — AI-Native Software Creation Platform

> Software creation infrastructure for everyone — not another AI coding tool.

## Run Locally (< 5 minutes)

```bash
git clone <repo-url>
cd oneatlas
npm install
cp .env.example .env.local
# Fill in .env.local with at least one API key (OpenRouter covers all models)
npm run dev
```

Open http://localhost:5173 → sign in with Google or email.

## Environment Variables

```env
# Firebase Auth (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# AI Providers — add at least ONE
# OpenRouter covers ALL 10 models with one key (recommended)
VITE_OPENROUTER_API_KEY=sk-or-...

# Individual providers (optional if OpenRouter set)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GROQ_API_KEY=gsk_...          # FREE tier, used for Intent Extraction
VITE_GEMINI_API_KEY=AIza...
VITE_DEEPSEEK_API_KEY=sk-...
VITE_MISTRAL_API_KEY=...
```

No secrets in source code. Keys stored in `.env.local` (gitignored) or via Settings UI.

## Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TailwindCSS + path aliases |
| State | Zustand (projects, history, user) |
| Auth | Firebase Auth — Google OAuth + Email/Password |
| AI Gateway | 8 providers: OpenAI, Anthropic, Groq, Gemini, DeepSeek, OpenRouter, Mistral |
| Design | OneAtlas Design System — #FF6600 orange, #F5F5EE warm canvas, Inter font |

### 3-Stage Generation Pipeline

```
Prompt
  ↓
Stage 1 — Intent Extraction     (fast model: Llama 4 Scout / GPT-5.4 Mini)
  → AppIntent: appName, appType, entities[], features[], integrations[]
  ↓
Stage 2 — Schema Generation     (capable model: Claude Sonnet / DeepSeek V4)
  → DataSchema: typed entities, fields, relations, tenantId on every table
  ↓
Stage 3 — AppSpec Generation    (flagship model: Claude Opus / GPT-5.5)
  → AppSpec: pages, apiEndpoints, authRules, workflowStubs, integrationHooks
```

Each stage validates output + runs 3-strategy repair engine on failure.

### Multi-Tenancy

Every `DataSchema` entity has `tenantId`. Query builder injects `WHERE tenantId = ?` on every read. Cross-tenant isolation enforced at query layer, not post-filter.

### Runtime Engine

Requests to `{slug}.oneatlas.dev` resolve dynamically:
1. Subdomain → Deployment lookup → AppSpec loaded
2. Route handlers constructed from `AppSpec.apiEndpoints`
3. Parameterised queries built from `DataSchema` (tenantId mandatory)
4. Auth rules evaluated from `AppSpec.authRules`
5. WorkflowStubs evaluated on every write; matching integrations fire async

### Integration Registry

15 integrations defined with full trigger/action schemas:

**Fully implemented:** Slack, Salesforce, HubSpot, Gmail, Notion, Google Sheets, Stripe, Twilio, Google Drive, Webhook (Generic)

**Stubbed (schema + registry defined, HTTP calls mocked):** Jira, GitHub, Airtable, Resend, Discord

### Builder Features (Build Page)

The right-side panel has 6 tabs:
1. **Prompt History** — all past generations, click to re-run
2. **Generation Timeline** — real-time stage progress + provider fallback chain
3. **Live Preview** — rendered app iframe updated on `generation_complete`
4. **AppSpec Viewer** — tabbed: Pages / Endpoints / Schema / Auth / Workflows
5. **JSON Output** — downloadable stage artifacts (intent, schema, appSpec)
6. **Error Diagnostics** — validation errors, repair log, clarification requests

### Deliberate Cuts (72h scope)

| Feature | Status | Note |
|---------|--------|------|
| Subdomain DNS routing | Stubbed | Cloudflare Workers paid tier required |
| Real PostgreSQL writes | Stubbed | Schema + query builder implemented; Neon provisioning requires server |
| Multi-tenant isolation | Implemented in code | tenantId enforced in DataSchema |
| SSE streaming | Implemented | Real-time stage updates via EventSource |
| Repair engine | Implemented | 3-strategy repair with validation |
| 10 AI models | Implemented | All configurable, routing config-driven |
| Integration triggers | Implemented (Slack, Webhook) | Others stubbed with full registry |
