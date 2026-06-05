
import { gatewayCall, safeJSON } from './gateway.js';
import { INTEGRATION_REGISTRY } from './integrations.js';
import { generateAllSampleData } from './sampleDataGenerator.js';
import { normalizeDataSchemaShape, normalizeAppSpecShape } from './schemaNormalize.js';
import { buildIntentFromPrompt, buildSchema, buildAppSpec } from './localPipeline.js';
import { shouldUseBlueprintEngine } from './blueprintRouter.js';

function bootstrapVagueIntentServer(prompt) {
  const trimmed = (prompt || '').trim();
  if (!trimmed) {
    return {
      appName: 'Starter Application', appType: 'custom',
      features: ['accounts', 'dashboard', 'records', 'settings'],
      entities: ['User', 'Record', 'Activity'],
      integrations_requested: [],
      assumptions: ['Empty prompt — minimal MVP'],
      clarification_required: false,
    };
  }
  const words = trimmed.split(/\s+/).filter(w => w.replace(/[^a-z0-9]/gi, '').length > 2).length;
  if (words >= 6) return null;
  const p = trimmed.toLowerCase();
  if (/hospital|patient|doctor|medical/i.test(p)) {
    return {
      appName: 'Hospital Management', appType: 'custom',
      features: ['patient records', 'appointments', 'billing', 'departments'],
      entities: ['Patient', 'Doctor', 'Appointment', 'Department', 'MedicalRecord', 'Prescription', 'Bill'],
      integrations_requested: p.includes('whatsapp') ? ['whatsapp'] : [],
      assumptions: [`Short prompt (${words} words) — assumed hospital management MVP`],
      clarification_required: false,
    };
  }
  if (/astrology|zodiac|matchmaking/i.test(p)) {
    return {
      appName: 'Zodiac Match', appType: 'custom',
      features: ['profiles', 'compatibility scoring', 'connections', 'community'],
      entities: ['User', 'ZodiacProfile', 'CompatibilityScore', 'ConnectionRequest'],
      integrations_requested: p.includes('slack') ? ['slack'] : [],
      assumptions: [`Short prompt (${words} words) — assumed matchmaking MVP`],
      clarification_required: false,
    };
  }
  if (/saas/i.test(p)) {
    return {
      appName: 'SaaS Platform', appType: 'custom',
      features: ['authentication', 'teams', 'billing', 'dashboard'],
      entities: ['User', 'Organization', 'Subscription'],
      integrations_requested: ['stripe'],
      assumptions: [`Minimal prompt (${words} words) — assumed SaaS MVP`],
      clarification_required: false,
    };
  }
  return {
    appName: 'Starter Application', appType: 'custom',
    features: ['accounts', 'dashboard', 'records', 'settings'],
    entities: ['User', 'Record', 'Activity'],
    integrations_requested: [],
    assumptions: [`Vague prompt (${words} words) — minimal MVP`],
    clarification_required: false,
  };
}

export async function extractIntent(prompt, options = {}) {
  const boot = bootstrapVagueIntentServer(prompt);
  if (boot) {
    return { result: boot, cost: null, raw: JSON.stringify(boot), provider: 'bootstrap', model: 'vague-prompt-policy' };
  }

  const localIntent = buildIntentFromPrompt(prompt, options);
  if (shouldUseBlueprintEngine(prompt, localIntent)) {
    return {
      result: localIntent,
      cost: null,
      raw: JSON.stringify(localIntent),
      provider: 'oneatlas',
      model: 'structured-blueprint',
    };
  }

  const systemPrompt = `You are an expert app intent extractor for OneAtlas, an AI-native app generation platform.
Analyze the user's prompt and extract a structured AppIntent.

Return ONLY a valid JSON object with exactly these keys:
{
  "appName": "short descriptive name",
  "appType": "one of: crm | project_management | ecommerce | hr_tool | inventory | content_platform | analytics | custom",
  "features": ["feature descriptions as strings"],
  "entities": ["entity names as singular nouns in PascalCase, e.g. User, Product, Order"],
  "integrations_requested": ["integration ids from: slack, salesforce, hubspot, whatsapp, gmail, stripe, notion, webhook, twilio_sms, jira, github, airtable, zapier, google_sheets"],
  "assumptions": ["documented assumption if prompt was vague"],
  "clarification_required": false
}

Rules:
- appType must be exactly one of the enum values
- entities must be singular PascalCase nouns
- integrations_requested must only contain IDs from the known list
- If the prompt mentions notifications → include slack or whatsapp
- If it mentions payments → include stripe
- Return ONLY JSON, no markdown, no explanation`;

  const userMessage = `Extract app intent from this prompt: "${prompt}"`;

  const callResult = await gatewayCall('intent_extraction', systemPrompt, userMessage, 1000, 0.1);
  let parsed = safeJSON(callResult.content);

  parsed.appName = parsed.appName || inferAppName(prompt);
  parsed.appType = normalizeAppType(parsed.appType);
  parsed.features = Array.isArray(parsed.features) ? parsed.features : [];
  parsed.entities = Array.isArray(parsed.entities) ? parsed.entities.map(e => toPascalCase(e)) : [];
  parsed.integrations_requested = Array.isArray(parsed.integrations_requested)
    ? parsed.integrations_requested.filter(id => id in INTEGRATION_REGISTRY)
    : [];
  parsed.assumptions = Array.isArray(parsed.assumptions) ? parsed.assumptions : [];
  parsed.clarification_required = false;

  return { result: parsed, cost: callResult.usage, raw: callResult.content };
}

function inferAppName(prompt) {
  const words = prompt.trim().split(/\s+/).slice(0, 4).join(' ');
  return words.length > 30 ? words.slice(0, 30) + '...' : words;
}

function normalizeAppType(type) {
  const map = {
    'crm': 'crm', 'customer': 'crm',
    'project': 'project_management', 'project_management': 'project_management', 'task': 'project_management',
    'ecommerce': 'ecommerce', 'e-commerce': 'ecommerce', 'shop': 'ecommerce', 'store': 'ecommerce',
    'hr': 'hr_tool', 'hr_tool': 'hr_tool', 'human_resources': 'hr_tool',
    'inventory': 'inventory', 'warehouse': 'inventory',
    'content': 'content_platform', 'blog': 'content_platform', 'cms': 'content_platform',
    'analytics': 'analytics', 'dashboard': 'analytics',
    'custom': 'custom',
  };
  const key = (type || '').toLowerCase().replace(/[\s-]/g, '_');
  return map[key] || 'custom';
}

function toPascalCase(str) {
  return str.replace(/[_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toUpperCase());
}

function toSnakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/\s+/g, '_');
}

function inferSampleRecordCount(prompt) {
  const text = String(prompt || '').toLowerCase();
  const patterns = [
    /(?:generate|create|add|seed)\s+(\d+)\s+(?:random\s+)?(?:users?|records?|entries|rows|items?)/,
    /(\d+)\s+(?:random\s+)?(?:users?|records?|entries|rows|items?)\b/,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return Math.max(1, Math.min(50, n));
    }
  }
  return 5;
}

export async function generateDataSchema(intent, options = {}) {
  if (shouldUseBlueprintEngine(options.prompt || '', intent)) {
    const schema = buildSchema(intent);
    return {
      result: schema,
      cost: null,
      raw: JSON.stringify(schema),
      provider: 'oneatlas',
      model: 'structured-blueprint',
    };
  }

  const systemPrompt = `You are a senior database architect generating a DataSchema for OneAtlas.
Generate a comprehensive DataSchema from the AppIntent.

Output ONLY a valid JSON object:
{
  "entities": [
    {
      "name": "EntityName",
      "tableName": "entity_name_snake_case",
      "fields": [
        {"name": "id", "type": "uuid", "nullable": false, "isRelation": false, "isPrimary": true, "isUnique": true},
        {"name": "tenantId", "type": "uuid", "nullable": false, "isRelation": false, "isPrimary": false, "isUnique": false},
        {"name": "createdAt", "type": "datetime", "nullable": false, "isRelation": false, "isPrimary": false, "isUnique": false},
        {"name": "updatedAt", "type": "datetime", "nullable": false, "isRelation": false, "isPrimary": false, "isUnique": false}
      ],
      "relations": [
        {"type": "hasMany", "target": "OtherEntity", "foreignKey": "entity_id", "onDelete": "CASCADE"}
      ]
    }
  ]
}

CRITICAL RULES:
1. Every entity MUST have: id (uuid, isPrimary), tenantId (uuid), createdAt (datetime), updatedAt (datetime)
2. tableName must be plural snake_case (e.g. "users", "deal_stages", "project_tasks")
3. Field types must be one of: string | text | integer | float | boolean | date | datetime | uuid | json | enum
4. Relations MUST be bidirectional — if A hasMany B, then B belongsTo A
5. Foreign key fields on the "belongsTo" side must also appear in the fields array
6. Include domain-specific fields beyond just the required ones
7. Return ONLY JSON, no explanation`;

  const userMessage = `Generate DataSchema for:
App Name: ${intent.appName}
App Type: ${intent.appType}
Features: ${intent.features.join(', ')}
Entities needed: ${intent.entities.join(', ')}
Integrations: ${intent.integrations_requested.join(', ')}`;

  const callResult = await gatewayCall('schema_generation', systemPrompt, userMessage, 3000, 0.1);
  let parsed = normalizeDataSchemaShape(safeJSON(callResult.content), intent);

  if (!parsed.entities?.length) {
    parsed = { entities: buildDefaultEntities(intent) };
  }
  parsed.entities = parsed.entities.map(entity => normalizeEntity(entity));

  return { result: parsed, cost: callResult.usage, raw: callResult.content };
}

function normalizeEntity(entity) {
  const name = entity.name || 'Unknown';
  const tableName = entity.tableName || toSnakeCase(name) + 's';
  let fields = Array.isArray(entity.fields) ? entity.fields : [];

  const requiredFields = [
    { name: 'id',        type: 'uuid',     nullable: false, isRelation: false, isPrimary: true,  isUnique: true  },
    { name: 'tenantId',  type: 'uuid',     nullable: false, isRelation: false, isPrimary: false, isUnique: false },
    { name: 'createdAt', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
    { name: 'updatedAt', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
  ];

  for (const req of requiredFields) {
    if (!fields.some(f => f.name === req.name)) {
      fields.unshift(req);
    }
  }

  const validTypes = new Set(['string', 'text', 'integer', 'float', 'boolean', 'date', 'datetime', 'uuid', 'json', 'enum']);
  const typeAliases = {
    'varchar': 'string', 'char': 'string', 'nvarchar': 'string', 'text': 'text',
    'int': 'integer', 'bigint': 'integer', 'smallint': 'integer', 'number': 'integer',
    'decimal': 'float', 'double': 'float', 'numeric': 'float',
    'bool': 'boolean',
    'timestamp': 'datetime', 'timestamptz': 'datetime',
  };
  fields = fields.map(f => ({
    ...f,
    type: validTypes.has(f.type) ? f.type : (typeAliases[f.type] || 'string'),
  }));

  const relations = Array.isArray(entity.relations) ? entity.relations.map(r => ({
    type: r.type || 'hasMany',
    target: r.target || '',
    foreignKey: r.foreignKey || `${toSnakeCase(entity.name)}_id`,
    onDelete: r.onDelete || 'CASCADE',
  })) : [];

  return { name, tableName, fields, relations };
}

function buildDefaultEntities(intent) {
  const entities = intent.entities.length > 0 ? intent.entities : ['User', 'Record'];
  return entities.map(name => ({
    name,
    tableName: toSnakeCase(name) + 's',
    fields: [
      { name: 'id',        type: 'uuid',     nullable: false, isRelation: false, isPrimary: true,  isUnique: true  },
      { name: 'tenantId',  type: 'uuid',     nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'name',      type: 'string',   nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'createdAt', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'updatedAt', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
    ],
    relations: [],
  }));
}

export async function generateAppSpec(intent, dataSchema, options = {}) {
  if (shouldUseBlueprintEngine(options.prompt || '', intent)) {
    const spec = buildAppSpec(intent, dataSchema, {
      prompt: options.prompt || '',
      templateName: options.templateName || null,
      templateCategory: options.templateCategory || null,
    });
    spec.sampleData = generateAllSampleData(dataSchema, 8);
    return {
      result: spec,
      cost: null,
      raw: JSON.stringify(spec),
      provider: 'oneatlas',
      model: 'structured-blueprint',
    };
  }

  const entityNames = dataSchema.entities.map(e => e.name);
  const integrationList = intent.integrations_requested.join(', ') || 'none';

  const systemPrompt = `You are a senior full-stack architect generating an AppSpec for OneAtlas.
Generate a complete AppSpec from the DataSchema and AppIntent.

Output ONLY valid JSON:
{
  "pages": [
    {
      "name": "PageName",
      "route": "/route",
      "layout": "list | detail | dashboard | settings",
      "boundEntity": "EntityName or null",
      "components": [
        {"type": "table | form | chart | card | stats | kanban | calendar", "id": "unique_id", "boundEntity": "EntityName", "props": {}}
      ]
    }
  ],
  "apiEndpoints": [
    {
      "path": "/api/entity",
      "method": "GET | POST | PUT | PATCH | DELETE",
      "description": "Describe what this endpoint does",
      "boundEntity": "EntityName or null",
      "authRequired": true,
      "rateLimit": false
    }
  ],
  "authRules": [
    {
      "role": "admin",
      "permissions": {
        "EntityName": {"read": true, "write": true, "delete": true}
      }
    }
  ],
  "integrationHooks": [
    {
      "integrationId": "slack",
      "trigger": {"entity": "EntityName", "event": "created | updated | deleted | status_changed", "condition": "optional filter"},
      "action": "send_channel_message"
    }
  ],
  "workflowStubs": [
    {
      "name": "Human readable workflow description",
      "trigger": {"entity": "EntityName", "event": "status_changed", "condition": "status === 'closed'"},
      "integration": "slack",
      "action": "send_channel_message",
      "payload": {"channel": "{{entity.team_channel}}", "text": "Deal {{entity.name}} closed for {{entity.amount}}"}
    }
  ]
}

CRITICAL RULES:
1. Every page with a boundEntity MUST have at least one API endpoint for that entity
2. Layouts: use "dashboard" for overview pages, "list" for entity lists, "detail" for single-entity views, "settings" for settings
3. Create standard CRUD endpoints for every entity: GET (list), GET/:id (detail), POST (create), PUT/:id (update), DELETE/:id (delete)
4. Create authRules for at minimum: admin (full access) and user (read + write, no delete)
5. For each requested integration, create at least one integrationHook and workflowStub
6. workflowStubs payload must map entity fields to integration action inputs
7. Only use entity names from the schema: ${entityNames.join(', ')}
8. Only use integration IDs from: slack, salesforce, hubspot, whatsapp, gmail, stripe, notion, webhook, twilio_sms, jira, github, airtable, zapier, google_sheets
9. Component type MUST be exactly one of: table, form, chart, card, stats, kanban, calendar — NEVER invent types like stripe_checkout
10. Stripe actions: create_customer, create_payment_intent, create_charge, cancel_subscription. Gmail: send_email. Slack: send_channel_message
11. Return ONLY JSON`;

  const userMessage = `Generate AppSpec for:
App: ${intent.appName} (${intent.appType})
Features: ${intent.features.join(', ')}
Integrations requested: ${integrationList}
Entities and their fields:
${dataSchema.entities.map(e =>
  `${e.name}: ${e.fields.map(f => f.name).join(', ')}`
).join('\n')}`;

  const callResult = await gatewayCall('appspec_generation', systemPrompt, userMessage, 4000, 0.1);
  let parsed = normalizeAppSpecShape(safeJSON(callResult.content), intent, dataSchema);

  parsed = normalizeAppSpec(parsed, intent, dataSchema);

  return { result: parsed, cost: callResult.usage, raw: callResult.content };
}

function normalizeAppSpec(spec, intent, dataSchema) {
  const entityNames = dataSchema.entities.map(e => e.name);

  let pages = Array.isArray(spec?.pages) ? spec.pages : [];
  let endpoints = Array.isArray(spec?.apiEndpoints) ? spec.apiEndpoints : [];
  let authRules = Array.isArray(spec?.authRules) ? spec.authRules : [];
  let integrationHooks = Array.isArray(spec?.integrationHooks) ? spec.integrationHooks : [];
  let workflowStubs = Array.isArray(spec?.workflowStubs) ? spec.workflowStubs : [];

  if (!pages.some(p => p.layout === 'dashboard' || p.route === '/')) {
    pages.unshift({
      name: 'Dashboard',
      route: '/',
      layout: 'dashboard',
      boundEntity: null,
      components: [
        { type: 'stats', id: 'dashboard_stats', boundEntity: entityNames[0] || null, props: {} },
        { type: 'chart', id: 'dashboard_chart', boundEntity: entityNames[0] || null, props: {} },
      ],
    });
  }

  if (!pages.some(p => p.route === '/settings' || /setting/i.test(p.name))) {
    pages.push({
      name: 'Settings',
      route: '/settings',
      layout: 'settings',
      boundEntity: null,
      components: [{ type: 'form', id: 'settings_form', boundEntity: null, props: { sections: ['Profile', 'Notifications', 'Security'] } }],
    });
  }

  for (const entity of dataSchema.entities) {
    const entityRoute = `/${entity.tableName}`;
    if (!pages.some(p => p.route === entityRoute || p.boundEntity === entity.name)) {
      pages.push({
        name: entity.name + 's',
        route: entityRoute,
        layout: 'list',
        boundEntity: entity.name,
        components: [
          { type: 'table', id: `${entity.tableName}_table`, boundEntity: entity.name, props: {} },
        ],
      });
    }
  }

  for (const entity of dataSchema.entities) {
    const base = `/${entity.tableName}`;
    const existing = endpoints.filter(ep => ep.boundEntity === entity.name || ep.path.startsWith(base));
    if (existing.length === 0) {
      endpoints.push(
        { path: base,         method: 'GET',    description: `List ${entity.name} records with pagination and filters`, boundEntity: entity.name, authRequired: true,  rateLimit: false },
        { path: `${base}/:id`,method: 'GET',    description: `Get single ${entity.name} by ID`,                         boundEntity: entity.name, authRequired: true,  rateLimit: false },
        { path: base,         method: 'POST',   description: `Create a new ${entity.name}`,                             boundEntity: entity.name, authRequired: true,  rateLimit: true  },
        { path: `${base}/:id`,method: 'PUT',    description: `Update ${entity.name} by ID`,                             boundEntity: entity.name, authRequired: true,  rateLimit: false },
        { path: `${base}/:id`,method: 'DELETE', description: `Delete ${entity.name} by ID`,                             boundEntity: entity.name, authRequired: true,  rateLimit: false },
      );
    }
  }

  if (!authRules.some(r => r.role === 'admin')) {
    authRules.push({
      role: 'admin',
      permissions: entityNames.reduce((acc, e) => { acc[e] = { read: true, write: true, delete: true }; return acc; }, {}),
    });
  }
  if (!authRules.some(r => r.role === 'user')) {
    authRules.push({
      role: 'user',
      permissions: entityNames.reduce((acc, e) => { acc[e] = { read: true, write: true, delete: false }; return acc; }, {}),
    });
  }

  for (const integrationId of intent.integrations_requested) {
    const alreadyHasStub = workflowStubs.some(s => s.integration === integrationId);
    if (!alreadyHasStub && entityNames.length > 0) {
      const entity = entityNames[0];
      workflowStubs.push(buildDefaultWorkflowStub(integrationId, entity, intent.appName));
    }
  }

  const validIds = new Set(Object.keys(INTEGRATION_REGISTRY));
  integrationHooks = integrationHooks
    .map(h => ({
      ...h,
      integrationId: h.integrationId || h.integration,
      integration: h.integrationId || h.integration,
    }))
    .filter(h => validIds.has(h.integrationId || h.integration));
  workflowStubs = workflowStubs.filter(s => s.integration && validIds.has(s.integration));

  return { pages, apiEndpoints: endpoints, authRules, integrationHooks, workflowStubs };
}

/** Ensure pages, CRUD endpoints, auth, and valid integrations — call before final validation. */
export function finalizeAppSpec(spec, intent, dataSchema) {
  return normalizeAppSpec(spec || {}, intent || { integrations_requested: [] }, dataSchema || { entities: [] });
}

function buildDefaultWorkflowStub(integrationId, entityName, appName) {
  const stubs = {
    slack: {
      name: `Notify Slack when ${entityName} status changes`,
      trigger: { entity: entityName, event: 'status_changed', condition: '' },
      integration: 'slack',
      action: 'send_channel_message',
      payload: { channel: '#notifications', text: `{{entity.name}} status changed to {{entity.status}} in ${appName}` },
    },
    stripe: {
      name: `Create Stripe customer when ${entityName} is created`,
      trigger: { entity: entityName, event: 'created', condition: '' },
      integration: 'stripe',
      action: 'create_customer',
      payload: { email: '{{entity.email}}', name: '{{entity.name}}' },
    },
    hubspot: {
      name: `Sync ${entityName} to HubSpot on update`,
      trigger: { entity: entityName, event: 'updated', condition: '' },
      integration: 'hubspot',
      action: 'upsert_contact',
      payload: { email: '{{entity.email}}', firstname: '{{entity.firstName}}', lastname: '{{entity.lastName}}' },
    },
    whatsapp: {
      name: `Send WhatsApp notification when ${entityName} status changes`,
      trigger: { entity: entityName, event: 'status_changed', condition: '' },
      integration: 'whatsapp',
      action: 'send_template_message',
      payload: { to: '{{entity.phone}}', template_sid: 'your_template_sid', template_vars: { name: '{{entity.name}}', status: '{{entity.status}}' } },
    },
    gmail: {
      name: `Send confirmation email when ${entityName} is created`,
      trigger: { entity: entityName, event: 'created', condition: '' },
      integration: 'gmail',
      action: 'send_email',
      payload: { to: '{{entity.email}}', subject: `Your ${entityName} has been created`, body: `Hello {{entity.name}}, your ${entityName} is confirmed.` },
    },
    salesforce: {
      name: `Create Salesforce Lead when ${entityName} is created`,
      trigger: { entity: entityName, event: 'created', condition: '' },
      integration: 'salesforce',
      action: 'create_lead',
      payload: { FirstName: '{{entity.firstName}}', LastName: '{{entity.lastName}}', Company: '{{entity.company}}', Email: '{{entity.email}}' },
    },
    notion: {
      name: `Create Notion page when ${entityName} is created`,
      trigger: { entity: entityName, event: 'created', condition: '' },
      integration: 'notion',
      action: 'create_page',
      payload: { database_id: 'your_database_id', title: '{{entity.name}}', properties: { status: '{{entity.status}}' } },
    },
    webhook: {
      name: `POST to webhook when ${entityName} is updated`,
      trigger: { entity: entityName, event: 'updated', condition: '' },
      integration: 'webhook',
      action: 'post_payload',
      payload: { url: 'https://your-endpoint.com/hook', payload: { entity: '{{entity}}', event: 'updated' } },
    },
    twilio_sms: {
      name: `Send SMS when ${entityName} status changes`,
      trigger: { entity: entityName, event: 'status_changed', condition: '' },
      integration: 'twilio_sms',
      action: 'send_sms',
      payload: { to: '{{entity.phone}}', body: `{{entity.name}} status updated to {{entity.status}}` },
    },
    jira: {
      name: `Create Jira issue when ${entityName} is created`,
      trigger: { entity: entityName, event: 'created', condition: '' },
      integration: 'jira',
      action: 'create_issue',
      payload: { project_key: 'PROJ', summary: 'New {{entity.name}} created', description: '{{entity.description}}' },
    },
  };

  return stubs[integrationId] || {
    name: `${integrationId} automation for ${entityName}`,
    trigger: { entity: entityName, event: 'created', condition: '' },
    integration: integrationId,
    action: 'post_payload',
    payload: { entity: '{{entity}}' },
  };
}

export function attachSampleData(appSpec, dataSchema, prompt = '') {
  const count = inferSampleRecordCount(prompt);
  return {
    ...appSpec,
    sampleData: generateAllSampleData(dataSchema, count),
  };
}
