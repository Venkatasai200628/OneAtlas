
/** Client pipeline — same normalization rules as lib/schemaNormalize.js */

import { INTEGRATION_REGISTRY } from './integrationRegistry.js';

function toPascalCase(str) {
  return String(str || '')
    .replace(/[_\s]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, c => c.toUpperCase());
}

function toSnakeCase(str) {
  return String(str || '')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/\s+/g, '_');
}

const VALID_COMPONENT_TYPES = new Set(['table', 'form', 'chart', 'card', 'stats', 'kanban', 'calendar']);

const COMPONENT_TYPE_ALIASES = {
  stripe_checkout: 'card',
  checkout: 'card',
  payment: 'card',
  payment_form: 'form',
  checkout_form: 'form',
  grid: 'table',
  list: 'table',
  data_grid: 'table',
  stats_card: 'stats',
  stat: 'stats',
  bar_chart: 'chart',
  line_chart: 'chart',
  pie_chart: 'chart',
};

const INTEGRATION_ACTION_ALIASES = {
  stripe: {
    payment_intent: 'create_payment_intent',
    process_payment: 'create_charge',
    charge: 'create_charge',
  },
  gmail: {
    send_order_confirmation: 'send_email',
    order_confirmation: 'send_email',
    send_confirmation_email: 'send_email',
  },
  slack: {
    post_message: 'send_channel_message',
    notify_channel: 'send_channel_message',
  },
};

export function coerceComponentType(type) {
  const raw = String(type || 'table').trim().toLowerCase().replace(/\s+/g, '_');
  if (VALID_COMPONENT_TYPES.has(raw)) return raw;
  return COMPONENT_TYPE_ALIASES[raw] || 'card';
}

export function resolveIntegrationAction(integrationId, actionId) {
  if (!integrationId || !actionId) return actionId;
  const key = String(actionId).trim();
  const mapped = INTEGRATION_ACTION_ALIASES[integrationId]?.[key];
  if (mapped) return mapped;
  const integration = INTEGRATION_REGISTRY[integrationId];
  if (integration?.actions?.some(a => a.id === key)) return key;
  return key;
}

function normalizePageComponents(page) {
  const pageName = (page?.name || 'page').toLowerCase().replace(/\s+/g, '_');
  const bound = page?.boundEntity || null;
  if (!Array.isArray(page?.components) || page.components.length === 0) {
    return [{ type: 'table', id: `${pageName}_table`, boundEntity: bound, props: {} }];
  }
  return page.components.map((c, i) => {
    if (typeof c === 'string') {
      const type = coerceComponentType(c);
      return { type, id: `${pageName}_${type}_${i}`, boundEntity: bound, props: {} };
    }
    const type = coerceComponentType(c?.type);
    return {
      ...c,
      type,
      id: c?.id || `${pageName}_${type}_${i}`,
      boundEntity: c?.boundEntity ?? bound,
      props: c?.props || {},
    };
  });
}

function normalizeIntegrationHooks(hooks) {
  return (hooks || []).map(h => {
    const integrationId = h?.integrationId || h?.integration || '';
    return {
      ...h,
      integration: integrationId,
      action: h?.action ? resolveIntegrationAction(integrationId, h.action) : h.action,
    };
  });
}

function defaultEntity(name) {
  const pascal = toPascalCase(name);
  let tableName = toSnakeCase(pascal);
  if (!tableName.endsWith('s')) tableName += 's';
  return {
    name: pascal,
    tableName,
    fields: [
      { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isUnique: true, isRelation: false },
      { name: 'tenantId', type: 'uuid', nullable: false, isPrimary: false, isUnique: false, isRelation: false },
      { name: 'name', type: 'string', nullable: false, isPrimary: false, isUnique: false, isRelation: false },
      { name: 'createdAt', type: 'datetime', nullable: false, isPrimary: false, isUnique: false, isRelation: false },
      { name: 'updatedAt', type: 'datetime', nullable: false, isPrimary: false, isUnique: false, isRelation: false },
    ],
    relations: [],
  };
}

export function normalizeDataSchemaShape(parsed, intent = null) {
  let schema = parsed;

  if (Array.isArray(schema)) {
    schema = { entities: schema };
  } else if (schema && typeof schema === 'object') {
    if (!Array.isArray(schema.entities) && Array.isArray(schema.data?.entities)) {
      schema = { entities: schema.data.entities };
    }
  }

  if (!schema || typeof schema !== 'object') schema = { entities: [] };
  if (!Array.isArray(schema.entities)) schema.entities = [];

  if (schema.entities.length === 0 && intent?.entities?.length) {
    schema.entities = intent.entities.map(e => defaultEntity(e));
  } else if (intent?.entities?.length) {
    const names = new Set(schema.entities.map(e => e?.name).filter(Boolean));
    for (const raw of intent.entities) {
      const name = toPascalCase(raw);
      if (!name || names.has(name)) continue;
      schema.entities.push(defaultEntity(name));
      names.add(name);
    }
  }

  return schema;
}

export function normalizeAppSpecShape(parsed, intent = null, schema = null) {
  let spec = parsed;

  if (Array.isArray(spec)) {
    const looksLikePages = spec.some(p => p?.route || p?.name);
    spec = looksLikePages
      ? { pages: spec, apiEndpoints: [], authRules: { roles: [{ name: 'admin' }, { name: 'user' }], permissions: {} }, integrationHooks: [], workflowStubs: [] }
      : { pages: [], apiEndpoints: [], authRules: { roles: [{ name: 'admin' }, { name: 'user' }], permissions: {} }, integrationHooks: [], workflowStubs: [] };
  }

  if (!spec || typeof spec !== 'object') spec = {};

  if (!Array.isArray(spec.pages)) spec.pages = [];
  if (!Array.isArray(spec.apiEndpoints)) spec.apiEndpoints = [];
  if (!spec.authRules) {
    spec.authRules = { roles: [{ name: 'admin' }, { name: 'user' }], permissions: {} };
  }
  if (!Array.isArray(spec.integrationHooks)) spec.integrationHooks = [];
  if (!Array.isArray(spec.workflowStubs)) spec.workflowStubs = [];

  const entityNames = (schema?.entities || []).map(e => e.name);
  if (spec.authRules && !spec.authRules.roles) {
    spec.authRules = { roles: [{ name: 'admin' }, { name: 'user' }], permissions: {} };
  }
  if (entityNames.length && spec.authRules?.permissions) {
    for (const en of entityNames) {
      if (!spec.authRules.permissions[en]) {
        spec.authRules.permissions[en] = { admin: ['read', 'write', 'delete'], user: ['read', 'write'] };
      }
    }
  }

  spec.integrationHooks = normalizeIntegrationHooks(spec.integrationHooks);
  spec.workflowStubs = (spec.workflowStubs || []).map(s => ({
    ...s,
    action: s?.action && s?.integration
      ? resolveIntegrationAction(s.integration, s.action)
      : s?.action,
  }));

  spec.pages = spec.pages.map(p => ({
    ...p,
    components: normalizePageComponents(p),
  }));

  return spec;
}

export function normalizeParsedByStage(data, stage, intent = null, schema = null) {
  if (stage === 'schema_generation') return normalizeDataSchemaShape(data, intent);
  if (stage === 'appspec_generation') return normalizeAppSpecShape(data, intent, schema);
  return data;
}
