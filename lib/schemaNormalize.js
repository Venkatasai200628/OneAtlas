import { INTEGRATION_REGISTRY } from './integrations.js';

/** Normalize LLM JSON into shapes our validators expect (server pipeline). */

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

function defaultEntity(name) {
  const pascal = toPascalCase(name);
  const tableName = toSnakeCase(pascal).replace(/^_/, '') + (toSnakeCase(pascal).endsWith('s') ? '' : 's');
  return {
    name: pascal,
    tableName: tableName.includes('s') ? tableName : `${toSnakeCase(pascal)}s`,
    fields: [
      { name: 'id', type: 'uuid', nullable: false, isRelation: false, isPrimary: true, isUnique: true },
      { name: 'tenantId', type: 'uuid', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'name', type: 'string', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'createdAt', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
      { name: 'updatedAt', type: 'datetime', nullable: false, isRelation: false, isPrimary: false, isUnique: false },
    ],
    relations: [],
  };
}

export function ensureEntitiesFromIntent(schema, intent) {
  const entities = Array.isArray(schema?.entities) ? [...schema.entities] : [];
  const names = new Set(entities.map(e => e?.name).filter(Boolean));
  for (const raw of intent?.entities || []) {
    const name = toPascalCase(raw);
    if (!name || names.has(name)) continue;
    entities.push(defaultEntity(name));
    names.add(name);
  }
  return { ...schema, entities };
}

/**
 * Coerce DataSchema — handles bare entity arrays and nested wrappers.
 */
export function normalizeDataSchemaShape(parsed, intent = null) {
  let schema = parsed;

  if (Array.isArray(schema)) {
    schema = { entities: schema };
  } else if (schema && typeof schema === 'object') {
    if (!Array.isArray(schema.entities) && Array.isArray(schema.data?.entities)) {
      schema = { entities: schema.data.entities };
    } else if (!Array.isArray(schema.entities) && Array.isArray(schema.schema?.entities)) {
      schema = { entities: schema.schema.entities };
    }
  }

  if (!schema || typeof schema !== 'object') {
    schema = { entities: [] };
  }
  if (!Array.isArray(schema.entities)) {
    schema.entities = [];
  }

  if (schema.entities.length === 0 && intent?.entities?.length) {
    schema.entities = intent.entities.map(e => defaultEntity(e));
  } else if (intent?.entities?.length) {
    schema = ensureEntitiesFromIntent(schema, intent);
  }

  return schema;
}

function permissionsForRoles(roles, entityNames) {
  return roles.reduce((acc, role) => {
    const roleName = role.name || role.role || 'user';
    acc[roleName] = entityNames.reduce((p, e) => {
      p[e] = {
        read: true,
        write: roleName !== 'viewer',
        delete: roleName === 'admin',
      };
      return p;
    }, {});
    return acc;
  }, {});
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
  const integration = INTEGRATION_REGISTRY?.[integrationId];
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
      integrationId,
      integration: integrationId,
      action: h?.action ? resolveIntegrationAction(integrationId, h.action) : h?.action,
    };
  });
}

/** Coerce AppSpec — handles pages-only arrays and client-style authRules objects. */
export function normalizeAppSpecShape(parsed, intent = null, dataSchema = null) {
  let spec = parsed;
  const entityNames = (dataSchema?.entities || []).map(e => e.name).filter(Boolean);

  if (Array.isArray(spec)) {
    const looksLikePages = spec.length > 0 && spec.some(p => p && (p.route || p.name));
    spec = looksLikePages
      ? { pages: spec, apiEndpoints: [], authRules: [], integrationHooks: [], workflowStubs: [] }
      : { pages: [], apiEndpoints: [], authRules: [], integrationHooks: [], workflowStubs: [] };
  }

  if (!spec || typeof spec !== 'object') {
    spec = {};
  }

  if (spec.authRules && !Array.isArray(spec.authRules)) {
    const roles = spec.authRules.roles || [{ name: 'admin' }, { name: 'user' }];
    const permissions = spec.authRules.permissions || permissionsForRoles(roles, entityNames);
    spec.authPolicy = {
      roles,
      authentication: spec.authRules.authentication || [],
      businessRules: spec.authRules.businessRules || spec.businessRules || [],
      validationConstraints: spec.authRules.validationConstraints || [],
      permissions,
    };
    spec.businessRules = spec.authPolicy.businessRules;
    spec.authRules = roles.map(r => {
      const roleName = r.name || r.role || 'user';
      return {
        role: roleName,
        permissions: permissions[roleName] || entityNames.reduce((acc, e) => {
          acc[e] = { read: true, write: true, delete: roleName === 'admin' };
          return acc;
        }, {}),
      };
    });
  }

  if (!Array.isArray(spec.pages)) spec.pages = [];
  if (!Array.isArray(spec.apiEndpoints)) spec.apiEndpoints = [];
  if (!Array.isArray(spec.authRules)) {
    spec.authRules = [
      { role: 'admin', permissions: entityNames.reduce((a, e) => { a[e] = { read: true, write: true, delete: true }; return a; }, {}) },
      { role: 'user', permissions: entityNames.reduce((a, e) => { a[e] = { read: true, write: true, delete: false }; return a; }, {}) },
    ];
  }
  if (!Array.isArray(spec.integrationHooks)) spec.integrationHooks = [];
  if (!Array.isArray(spec.workflowStubs)) spec.workflowStubs = [];

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

export function normalizeParsedByStage(data, stage, intent = null, dataSchema = null) {
  if (data == null) return data;
  const s = stage === 'schema' || stage === 'schema_generation' ? 'schema' : stage;
  const a = stage === 'appspec' || stage === 'appspec_generation' ? 'appspec' : stage;

  if (s === 'schema' || stage === 'schema_generation') {
    return normalizeDataSchemaShape(data, intent);
  }
  if (a === 'appspec' || stage === 'appspec_generation') {
    return normalizeAppSpecShape(data, intent, dataSchema);
  }
  return data;
}
