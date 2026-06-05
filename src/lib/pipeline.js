
import { gatewayCall, safeJSON } from './aiGateway.js';
import { validateIntent, validateSchema, validateAppSpec } from './validation.js';
import { repairOutput } from './repairEngine.js';
import { INTEGRATION_REGISTRY } from './integrationRegistry.js';
import { generateAllSampleData } from './sampleDataGenerator.js';
import { normalizeDataSchemaShape, normalizeAppSpecShape } from './schemaNormalize.js';

const INTENT_SYSTEM = `You extract structured app intent from natural language descriptions.
Return ONLY valid JSON — no markdown fences, no explanation.

{
  "appName": "RealEstateCRM",
  "appType": "crm",
  "tagline": "Manage leads, properties and deals for real estate agents",
  "features": ["lead management", "property listings", "deal tracking", "analytics dashboard", "agent management"],
  "entities": ["Agent", "Lead", "Property", "Deal"],
  "integrations_requested": ["whatsapp"],
  "assumptions": ["Single office, multi-agent", "Deals linked to leads and properties"]
}

Rules:
- appType: exactly one of: crm | project_management | ecommerce | hr_tool | inventory | content_platform | analytics | custom
- entities: PascalCase singular nouns, 3-6 entities
- features: 4-8 specific features, not generic
- integrations_requested: ONLY extract integrations explicitly mentioned. From: slack, stripe, hubspot, salesforce, whatsapp, gmail, notion, twilio_sms, webhook, google_sheets. If none mentioned, return []
- If fewer than 8 meaningful words, set clarificationRequired:true with ONE specific question
- Return ONLY the JSON object.`;

function buildSchemaSystem() {
  return `You are a database architect. Generate a DataSchema from an AppIntent.
Return ONLY valid JSON — no markdown fences, no explanation.

{
  "entities": [
    {
      "name": "Lead",
      "tableName": "leads",
      "fields": [
        {"name": "id",        "type": "uuid",      "nullable": false, "isPrimary": true,  "isUnique": true,  "isRelation": false},
        {"name": "tenantId",  "type": "uuid",      "nullable": false, "isPrimary": false, "isUnique": false, "isRelation": false},
        {"name": "createdAt", "type": "timestamp", "nullable": false, "isPrimary": false, "isUnique": false, "isRelation": false},
        {"name": "updatedAt", "type": "timestamp", "nullable": true,  "isPrimary": false, "isUnique": false, "isRelation": false},
        {"name": "name",      "type": "string",    "nullable": false, "isPrimary": false, "isUnique": false, "isRelation": false},
        {"name": "email",     "type": "string",    "nullable": false, "isPrimary": false, "isUnique": true,  "isRelation": false},
        {"name": "phone",     "type": "string",    "nullable": true,  "isPrimary": false, "isUnique": false, "isRelation": false},
        {"name": "status",    "type": "enum",      "nullable": false, "isPrimary": false, "isUnique": false, "isRelation": false, "enumValues": ["new","contacted","qualified","lost"]}
      ],
      "relations": [
        {"type": "belongsTo", "target": "Agent", "foreignKey": "agentId", "onDelete": "SET_NULL"}
      ]
    }
  ]
}

CRITICAL RULES:
1. EVERY entity MUST have: id (uuid, isPrimary:true), tenantId (uuid, nullable:false), createdAt (timestamp)
2. tableName: snake_case version of entity name (Lead→leads, DealStage→deal_stages)
3. Relations MUST be bidirectional: if A hasMany B, then B must have belongsTo A
4. Status/state fields: type "enum" with realistic enumValues array
5. Include 5-10 realistic, domain-specific fields per entity — NOT just id and name
6. Return ONLY the JSON object.`;
}

function buildAppSpecSystem(validIntegrations) {
  const registeredIds = Object.keys(INTEGRATION_REGISTRY).join(', ');
  const hasIntegrations = validIntegrations.length > 0;

  return `You are an application architect. Generate a complete AppSpec from a DataSchema.
Return ONLY valid JSON — no markdown fences, no explanation.

CRITICAL INTEGRATION RULE:
${hasIntegrations
  ? `Only use these integrations (from user request): ${validIntegrations.join(', ')}. Do NOT add any others.`
  : `NO integrations were requested. Set integrationHooks: [] and workflowStubs: []. Do NOT add any integrations.`
}

{
  "pages": [
    {"name": "Dashboard",   "route": "/dashboard",   "layout": "dashboard", "boundEntity": null,   "components": ["card","chart","table"], "title": "Dashboard",   "description": "Overview of your application"},
    {"name": "Leads",       "route": "/leads",       "layout": "list",      "boundEntity": "Lead", "components": ["table","form"],         "title": "Leads",       "description": "Manage and track your leads"},
    {"name": "Lead Detail", "route": "/leads/:id",   "layout": "detail",    "boundEntity": "Lead", "components": ["form","card"],          "title": "Lead Detail", "description": "View and edit lead information"}
  ],
  "apiEndpoints": [
    {"path": "/api/leads",     "method": "GET",    "handler": "List all leads with search, filter, and pagination", "boundEntity": "Lead", "authRequired": true,  "rateLimit": false},
    {"path": "/api/leads",     "method": "POST",   "handler": "Create a new lead",   "boundEntity": "Lead", "authRequired": true,  "rateLimit": true},
    {"path": "/api/leads/:id", "method": "GET",    "handler": "Get lead by ID",      "boundEntity": "Lead", "authRequired": true,  "rateLimit": false},
    {"path": "/api/leads/:id", "method": "PUT",    "handler": "Update lead by ID",   "boundEntity": "Lead", "authRequired": true,  "rateLimit": false},
    {"path": "/api/leads/:id", "method": "DELETE", "handler": "Delete lead by ID",   "boundEntity": "Lead", "authRequired": true,  "rateLimit": false}
  ],
  "authRules": {
    "roles": [{"name": "admin"}, {"name": "agent"}, {"name": "viewer"}],
    "permissions": {
      "Lead": {"admin": ["read","write","delete"], "agent": ["read","write"], "viewer": ["read"]}
    }
  },
  "integrationHooks": [],
  "workflowStubs": [],
  "appPreview": {
    "primaryColor": "#6366f1",
    "sidebar": [
      {"label": "Dashboard", "route": "/dashboard", "icon": "dashboard"},
      {"label": "Leads",     "route": "/leads",     "icon": "users"}
    ],
    "dashboardStats": [
      {"label": "LEADS",   "valueKey": "Lead", "icon": "users",    "format": "count"},
      {"label": "REVENUE", "valueKey": "Deal", "field": "amount",  "icon": "dollar",   "format": "currency", "filter": "stage=closed_won"},
      {"label": "DEALS",   "valueKey": "Deal", "icon": "deal",     "format": "count"},
      {"label": "PIPELINE","valueKey": "Deal", "field": "amount",  "icon": "trending", "format": "currency"}
    ]
  }
}

CRITICAL RULES:
1. EVERY page MUST have matching API endpoints (path prefix matches route base)
2. All boundEntity values MUST be entity names from the schema
3. ${hasIntegrations ? `integrationHooks[].integration MUST be one of: ${validIntegrations.join(', ')}` : 'integrationHooks MUST be an empty array []'}
4. ${hasIntegrations ? `workflowStubs[].integration MUST be one of: ${validIntegrations.join(', ')}` : 'workflowStubs MUST be an empty array []'}
5. workflowStubs[].trigger.entity MUST be in schema
6. sidebar MUST NOT be empty — include one entry per main page (exclude :id detail pages)
7. dashboardStats: always exactly 4 cards
8. Generate CRUD endpoints for EVERY entity (at minimum GET list + GET by ID + POST + PUT + DELETE)
9. Integrations requested: ${hasIntegrations ? validIntegrations.join(', ') : 'NONE'}
10. Page component types MUST be: table, form, chart, card, stats, kanban, calendar — never stripe_checkout or other invented names
11. Use only registered integration actions (e.g. stripe: create_payment_intent or create_charge; gmail: send_email)
12. Return ONLY the JSON object.`;
}

function countMeaningfulWords(prompt) {
  return (prompt || '').trim().split(/\s+/).filter(w => w.replace(/[^a-z0-9]/gi, '').length > 2).length;
}

function inferSampleRecordCount(prompt) {
  const text = String(prompt || '').toLowerCase();
  const patterns = [
    /(?:generate|create|add|seed)\s+(\d+)\s+(?:random\s+)?(?:users?|records?|entries|rows|items?)/,
    /(\d+)\s+(?:random\s+)?(?:users?|records?|entries|rows|items?)\b/,
  ];
  for (const rx of patterns) {
    const match = text.match(rx);
    if (match?.[1]) {
      const n = Number(match[1]);
      if (Number.isFinite(n)) return Math.max(1, Math.min(50, n));
    }
  }
  return 5;
}

export function bootstrapVagueIntent(prompt) {
  const trimmed = (prompt || '').trim();
  if (!trimmed) {
    return {
      appName: 'Starter Application',
      appType: 'custom',
      tagline: 'Empty prompt — default starter app',
      features: ['user accounts', 'dashboard', 'records', 'settings'],
      entities: ['User', 'Record', 'Activity'],
      integrations_requested: [],
      assumptions: ['No prompt text — generated a minimal starter MVP'],
      clarificationRequired: false,
    };
  }

  const words = countMeaningfulWords(prompt);
  if (words >= 6) return null;

  const p = trimmed.toLowerCase();

  if (/hospital|patient|doctor|medical/i.test(p)) {
    return {
      appName: 'Hospital Management',
      appType: 'custom',
      tagline: 'Patients, appointments, and clinical operations',
      features: ['patient records', 'appointments', 'billing', 'departments'],
      entities: ['Patient', 'Doctor', 'Appointment', 'Department', 'MedicalRecord', 'Prescription', 'Bill'],
      integrations_requested: p.includes('whatsapp') ? ['whatsapp'] : [],
      assumptions: [`Prompt was minimal (${words} words) — assumed hospital management MVP`],
      clarificationRequired: false,
    };
  }
  if (/astrology|zodiac|matchmaking/i.test(p)) {
    return {
      appName: 'Zodiac Match',
      appType: 'custom',
      tagline: 'Astrology-based professional matchmaking',
      features: ['zodiac profiles', 'compatibility scoring', 'connection requests', 'community'],
      entities: ['User', 'ZodiacProfile', 'CompatibilityScore', 'ConnectionRequest'],
      integrations_requested: p.includes('slack') ? ['slack'] : [],
      assumptions: [`Prompt was minimal (${words} words) — assumed matchmaking MVP`],
      clarificationRequired: false,
    };
  }
  if (/saas/i.test(p)) {
    return {
      appName: 'SaaS Platform',
      appType: 'custom',
      tagline: 'Team-based subscription software',
      features: ['user authentication', 'team workspaces', 'subscription billing', 'admin dashboard', 'usage metrics'],
      entities: ['User', 'Organization', 'Subscription', 'Invoice'],
      integrations_requested: ['stripe'],
      assumptions: [`Prompt was minimal (${words} words) — assumed B2B SaaS with Stripe billing`],
      clarificationRequired: false,
    };
  }

  return {
    appName: p.includes('app') ? 'Starter Application' : 'Custom Application',
    appType: 'custom',
    tagline: 'General-purpose application from a short description',
    features: ['user accounts', 'dashboard', 'record management', 'search and filters', 'settings'],
    entities: ['User', 'Record', 'Activity'],
    integrations_requested: [],
    assumptions: [`Prompt was very vague (${words} meaningful words) — generated a minimal 3-entity MVP`],
    clarificationRequired: false,
  };
}

export async function extractIntent(prompt, userKeys = {}, onProgress = null, repairLogs = []) {
  const t0 = Date.now();
  onProgress?.({ stage: 'intent_extraction', status: 'running', message: 'Analyzing your prompt…', provider: null });

  const boot = bootstrapVagueIntent(prompt);
  if (boot) {
    repairLogs.push({
      strategy: 'field',
      outcome: 'repaired',
      fixes: ['Vague prompt: applied bootstrap AppIntent with documented assumptions (no clarification stop)'],
    });
    const validation = validateIntent(boot);
    onProgress?.({
      stage: 'intent_extraction',
      status: 'complete',
      data: boot,
      latency: Date.now() - t0,
      validation,
      message: 'Vague prompt — proceeded with assumptions',
    });
    return { intent: boot, costLog: [], validation };
  }

  const raw = await gatewayCall('intent_extraction', INTENT_SYSTEM,
    `Extract the app intent from this description:\n\n"${prompt}"`,
    userKeys, { maxTokens: 1000 });

  const providerName = raw.attempted?.find(a => a.success)?.provider || 'AI';
  onProgress?.({ stage: 'intent_extraction', status: 'running', message: `Parsed via ${providerName}…`, attempted: raw.attempted, provider: raw.attempted?.find(a => a.success) });

  let parsed = safeJSON(raw.text);
  let validation = validateIntent(parsed);

  if (!validation.isValid) {
    onProgress?.({ stage: 'intent_extraction', status: 'repairing', message: `Auto-repairing ${validation.errors.length} issue(s)…` });
    const { result, repairLog: rl, escalated } = await repairOutput(raw.text, parsed, validation, 'intent_extraction', userKeys);
    repairLogs.push(...rl);
    parsed = result || parsed;
    if (escalated) {
      onProgress?.({ stage: 'intent_extraction', status: 'repairing', message: 'Re-prompting AI to fix intent…' });
      const retry = await gatewayCall('intent_extraction', INTENT_SYSTEM,
        `Fix issues: ${validation.errors.map(e => e.message).join('; ')}\nOriginal: "${prompt}"`,
        userKeys, { maxTokens: 1000 });
      parsed = safeJSON(retry.text, parsed);
      raw.costLog.push(...(retry.costLog || []));
    }
    validation = validateIntent(parsed);
  }

  parsed.appName               = parsed.appName   || 'MyApp';
  parsed.appType               = parsed.appType   || 'custom';
  parsed.tagline               = parsed.tagline   || '';
  parsed.features              = Array.isArray(parsed.features)  ? parsed.features  : [];
  parsed.entities              = Array.isArray(parsed.entities)  ? parsed.entities  : [];
  parsed.integrations_requested = Array.isArray(parsed.integrations_requested) ? parsed.integrations_requested
    : Array.isArray(parsed.integrationsRequested) ? parsed.integrationsRequested : [];
  parsed.assumptions           = Array.isArray(parsed.assumptions) ? parsed.assumptions : [];

  onProgress?.({ stage: 'intent_extraction', status: 'complete', data: parsed, latency: Date.now() - t0, validation });
  return { intent: parsed, costLog: raw.costLog, validation };
}

export async function generateSchema(intent, userKeys = {}, onProgress = null, repairLogs = []) {
  const t0 = Date.now();
  onProgress?.({ stage: 'schema_generation', status: 'running', message: 'Generating data schema…' });

  const userMsg = `Generate the DataSchema for:
App: ${intent.appName} (${intent.appType}) — ${intent.tagline}
Features: ${intent.features.join(', ')}
Entities needed: ${intent.entities.join(', ')}
Integrations: ${intent.integrations_requested.join(', ') || 'none'}

Generate COMPLETE, realistic field sets for every entity.`;

  const raw = await gatewayCall('schema_generation', buildSchemaSystem(), userMsg, userKeys, { maxTokens: 3500 });
  const providerName = raw.attempted?.find(a => a.success)?.provider || 'AI';
  onProgress?.({ stage: 'schema_generation', status: 'running', message: `Built schema via ${providerName}…`, attempted: raw.attempted });

  let parsed = normalizeDataSchemaShape(safeJSON(raw.text), intent);
  let validation = validateSchema(parsed);

  if (!validation.isValid) {
    onProgress?.({ stage: 'schema_generation', status: 'repairing', message: `Repairing schema — ${validation.errors.length} issue(s)…` });
    const { result, repairLog: rl, escalated } = await repairOutput(raw.text, parsed, validation, 'schema_generation', userKeys, { intent });
    repairLogs.push(...rl);
    parsed = result || parsed;
    if (escalated) {
      onProgress?.({ stage: 'schema_generation', status: 'repairing', message: 'AI re-prompt for schema repair…' });
      const retry = await gatewayCall('repair_capable', buildSchemaSystem(),
        `Fix: ${validation.errors.map(e => e.message).join('; ')}\nEntities: ${intent.entities.join(', ')}`,
        userKeys, { maxTokens: 3500 });
      parsed = normalizeDataSchemaShape(safeJSON(retry.text, parsed), intent);
      raw.costLog.push(...(retry.costLog || []));
    }
    validation = validateSchema(parsed);
  }

  parsed = normalizeDataSchemaShape(parsed, intent);

  (parsed.entities || []).forEach(entity => {
    entity.fields = entity.fields || [];
    if (!entity.fields.some(f => f.name === 'id')) {
      entity.fields.unshift({ name: 'id', type: 'uuid', nullable: false, isPrimary: true, isUnique: true, isRelation: false });
    }
    if (!entity.fields.some(f => f.name === 'tenantId')) {
      const idx = entity.fields.findIndex(f => f.name === 'id');
      entity.fields.splice(idx + 1, 0, { name: 'tenantId', type: 'uuid', nullable: false, isPrimary: false, isUnique: false, isRelation: false });
    }
    if (!entity.tableName) {
      entity.tableName = entity.name.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();
    }
  });

  onProgress?.({ stage: 'schema_generation', status: 'complete', data: parsed, latency: Date.now() - t0, validation });
  return { schema: parsed, costLog: raw.costLog, validation };
}

export async function generateAppSpec(intent, schema, userKeys = {}, onProgress = null, repairLogs = [], prompt = '') {
  const t0 = Date.now();
  onProgress?.({ stage: 'appspec_generation', status: 'running', message: 'Building AppSpec…' });

  schema = normalizeDataSchemaShape(schema, intent);

  const validIntegrations = (intent.integrations_requested || []).filter(id => INTEGRATION_REGISTRY[id]);
  const entityList = (schema.entities || []).map(e =>
    `  ${e.name} (${e.tableName}): fields=[${e.fields.map(f => f.name).join(', ')}]`
  ).join('\n');

  const userMsg = `Generate the AppSpec for:
App: ${intent.appName} (${intent.appType}) — ${intent.tagline}
Features: ${intent.features.join(', ')}
Integrations requested: ${validIntegrations.join(', ') || 'NONE — do not add any integrations'}

Schema entities:
${entityList}

Remember:
- sidebar must NOT be empty
- Generate CRUD endpoints for every entity
- ${validIntegrations.length === 0 ? 'integrationHooks and workflowStubs MUST be empty arrays []' : `Only use integrations: ${validIntegrations.join(', ')}`}`;

  const raw = await gatewayCall('appspec_generation', buildAppSpecSystem(validIntegrations), userMsg, userKeys, { maxTokens: 4500 });
  const providerName = raw.attempted?.find(a => a.success)?.provider || 'AI';
  onProgress?.({ stage: 'appspec_generation', status: 'running', message: `Generated spec via ${providerName}…`, attempted: raw.attempted });

  let parsed = normalizeAppSpecShape(safeJSON(raw.text), intent, schema);

  const validSet = new Set(validIntegrations);
  if (Array.isArray(parsed.integrationHooks)) {
    const before = parsed.integrationHooks.length;
    parsed.integrationHooks = parsed.integrationHooks.filter(h => validSet.has(h.integration));
    const removed = before - parsed.integrationHooks.length;
    if (removed > 0) {
      repairLogs.push({ strategy: 'consistency', outcome: 'repaired',
        fixes: [`Removed ${removed} integrationHook(s) for unrequested integrations`] });
    }
  }
  if (Array.isArray(parsed.workflowStubs)) {
    const before = parsed.workflowStubs.length;
    parsed.workflowStubs = parsed.workflowStubs.filter(s => !s.integration || validSet.has(s.integration));
    const removed = before - parsed.workflowStubs.length;
    if (removed > 0) {
      repairLogs.push({ strategy: 'consistency', outcome: 'repaired',
        fixes: [`Removed ${removed} workflowStub(s) for unrequested integrations`] });
    }
  }

  let validation = validateAppSpec(parsed, schema);

  if (!validation.isValid) {
    onProgress?.({ stage: 'appspec_generation', status: 'repairing', message: `Repairing AppSpec — ${validation.errors.length} issue(s)…` });
    const { result, repairLog: rl, escalated } = await repairOutput(raw.text, parsed, validation, 'appspec_generation', userKeys, { schema, intent });
    repairLogs.push(...rl);
    parsed = result || parsed;
    if (escalated) {
      onProgress?.({ stage: 'appspec_generation', status: 'repairing', message: 'AI re-prompt for AppSpec repair…' });
      const retry = await gatewayCall('repair_capable', buildAppSpecSystem(validIntegrations),
        `Fix: ${validation.errors.map(e => `[${e.type}] ${e.message}`).join('; ')}\nValid entities: ${schema.entities?.map(e => e.name).join(', ')}`,
        userKeys, { maxTokens: 4500 });
      parsed = normalizeAppSpecShape(safeJSON(retry.text, parsed), intent, schema);
      raw.costLog.push(...(retry.costLog || []));
    }
    validation = validateAppSpec(parsed, schema);

    if (Array.isArray(parsed.integrationHooks)) {
      parsed.integrationHooks = parsed.integrationHooks.filter(h => validSet.has(h.integration));
    }
    if (Array.isArray(parsed.workflowStubs)) {
      parsed.workflowStubs = parsed.workflowStubs.filter(s => !s.integration || validSet.has(s.integration));
    }
  }

  parsed.pages            = parsed.pages            || [];
  parsed.apiEndpoints     = parsed.apiEndpoints     || [];
  parsed.authRules        = parsed.authRules        || { roles: [{ name: 'admin' }, { name: 'user' }], permissions: {} };
  parsed.integrationHooks = Array.isArray(parsed.integrationHooks) ? parsed.integrationHooks.filter(h => validSet.has(h.integration)) : [];
  parsed.workflowStubs    = Array.isArray(parsed.workflowStubs) ? parsed.workflowStubs.filter(s => !s.integration || validSet.has(s.integration)) : [];

  if (!parsed.appPreview) parsed.appPreview = {};
  if (!Array.isArray(parsed.appPreview.sidebar) || parsed.appPreview.sidebar.length === 0) {
    parsed.appPreview.sidebar = (parsed.pages || [])
      .filter(p => !p.route?.includes(':'))
      .slice(0, 6)
      .map(p => ({ label: p.name, route: p.route, icon: (p.boundEntity || p.name).toLowerCase() }));
  }

  const hasDashboard = parsed.appPreview.sidebar.some(s => s.route?.includes('dashboard') || s.label?.toLowerCase() === 'dashboard');
  if (!hasDashboard && parsed.pages.some(p => p.layout === 'dashboard')) {
    const dashPage = parsed.pages.find(p => p.layout === 'dashboard');
    parsed.appPreview.sidebar.unshift({ label: dashPage.name, route: dashPage.route, icon: 'dashboard' });
  }

  if (!Array.isArray(parsed.appPreview.dashboardStats) || parsed.appPreview.dashboardStats.length === 0) {
    parsed.appPreview.dashboardStats = buildFallbackStats(schema);
  }
  parsed.appPreview.primaryColor = parsed.appPreview.primaryColor || '#6366f1';

  const firstEntity = schema.entities?.[0]?.name || 'Record';
  for (const integId of validIntegrations) {
    if (!parsed.workflowStubs.some(s => s.integration === integId)) {
      const integ = INTEGRATION_REGISTRY[integId];
      if (integ) {
        parsed.workflowStubs.push({
          name: `${integ.displayName} — notify on ${firstEntity} change`,
          trigger: { entity: firstEntity, event: 'status_changed', condition: null },
          integration: integId, action: integ.actions[0]?.id,
          payload: { fieldMapping: `Map ${firstEntity} fields to ${integ.displayName} action input` },
        });
      }
    }
  }

  onProgress?.({ stage: 'appspec_generation', status: 'running', message: 'Generating sample data…' });
  parsed.sampleData = generateAllSampleData(schema, inferSampleRecordCount(prompt));

  onProgress?.({ stage: 'appspec_generation', status: 'complete', data: parsed, latency: Date.now() - t0, validation });
  return { appSpec: parsed, costLog: raw.costLog, validation };
}

function buildFallbackStats(schema) {
  const entities = (schema.entities || []).filter(e => !['User','Tenant','Role'].includes(e.name));
  const stats = entities.slice(0, 4).map(e => ({
    label: (e.name + 'S').toUpperCase(), valueKey: e.name, icon: e.name.toLowerCase(), format: 'count'
  }));
  const hasAmount = entities.find(e => e.fields?.some(f => /amount|value|revenue|price/i.test(f.name)));
  if (hasAmount && stats.length >= 2) {
    const amountField = hasAmount.fields.find(f => /amount|value|revenue|price/i.test(f.name));
    stats[stats.length - 1] = { label: 'REVENUE', valueKey: hasAmount.name, field: amountField?.name || 'amount', icon: 'dollar', format: 'currency' };
  }
  return stats;
}

export async function runPipeline(prompt, userKeys = {}, onProgress = null) {
  const costLog    = [];
  const repairLogs = [];
  const t0         = Date.now();

  const trimmedPrompt = (prompt || '').trim();
  if (!trimmedPrompt) {
    return {
      status: 'error',
      error: 'Please describe your app (prompt cannot be empty).',
      costLog: [],
      repairLogs: [],
      latency: 0,
    };
  }
  prompt = trimmedPrompt;

  try {
    const r1 = await extractIntent(prompt, userKeys, onProgress, repairLogs);
    costLog.push(...r1.costLog);

    if (r1.intent.clarificationRequired || r1.intent.clarification_required) {
      const boot = bootstrapVagueIntent(prompt);
      if (boot) {
        repairLogs.push({
          strategy: 'field',
          outcome: 'repaired',
          fixes: ['AI requested clarification — replaced with bootstrap intent and assumptions'],
        });
        r1.intent = boot;
      } else {
        return {
          status: 'clarification_required',
          clarificationQuestion: r1.intent.clarificationQuestion || r1.intent.clarification_question,
          intent: r1.intent,
          costLog,
          repairLogs,
          latency: Date.now() - t0,
        };
      }
    }

    const r2 = await generateSchema(r1.intent, userKeys, onProgress, repairLogs);
    costLog.push(...r2.costLog);

    const r3 = await generateAppSpec(r1.intent, r2.schema, userKeys, onProgress, repairLogs, prompt);
    costLog.push(...r3.costLog);

    const totalCostUSD = costLog.reduce((s, c) => s + (c.totalCost || 0), 0);
    onProgress?.({ stage: 'complete', status: 'complete', message: 'Generation complete!' });

    return {
      status: 'complete',
      intent:  r1.intent,
      schema:  r2.schema,
      appSpec: r3.appSpec,
      validations: { intent: r1.validation, schema: r2.validation, appSpec: r3.validation },
      costLog, repairLogs, totalCostUSD, latency: Date.now() - t0,
    };
  } catch (error) {
    console.error('[Pipeline]', error);
    onProgress?.({ stage: 'error', status: 'error', message: error.message });
    return { status: 'error', error: error.message, costLog, repairLogs, latency: Date.now() - t0 };
  }
}
