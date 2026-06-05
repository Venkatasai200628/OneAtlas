
import { INTEGRATION_REGISTRY } from './integrationRegistry.js';

const VALID_APP_TYPES = new Set([
  'crm','project_management','ecommerce','hr_tool',
  'inventory','content_platform','analytics','custom',
]);

function err(type, location, message, autoFixable = false, fixAction = null) {
  return { type, severity: 'error', location, message, autoFixable, fixAction };
}
function warn(type, location, message) {
  return { type, severity: 'warning', location, message, autoFixable: false, fixAction: null };
}

export function validateIntent(intent) {
  const errors = [], warnings = [];

  if (!intent || typeof intent !== 'object' || Array.isArray(intent)) {
    errors.push(err('INVALID_STRUCTURE', 'intent', 'Intent must be a JSON object'));
    return { isValid: false, errors, warnings };
  }

  if (!intent.appName || typeof intent.appName !== 'string' || !intent.appName.trim()) {
    errors.push(err('MISSING_FIELD', 'intent.appName', 'appName is required',
      true, { type: 'set_field', path: 'appName', value: 'MyApp' }));
  }

  if (!intent.appType || !VALID_APP_TYPES.has(intent.appType)) {
    errors.push(err('INVALID_ENUM', 'intent.appType',
      `appType must be one of: ${[...VALID_APP_TYPES].join(', ')}`,
      true, { type: 'set_field', path: 'appType', value: 'custom' }));
  }

  const features = intent.features ?? intent.feature_list;
  if (!Array.isArray(features)) {
    errors.push(err('WRONG_TYPE', 'intent.features', 'features must be an array of strings',
      true, { type: 'coerce_array', path: 'features', existing: features }));
  } else if (features.length === 0) {
    warnings.push(warn('EMPTY_FEATURES', 'intent.features', 'No features extracted — prompt may be too vague'));
  }

  const entities = intent.entities ?? intent.entity_list;
  if (!Array.isArray(entities)) {
    errors.push(err('WRONG_TYPE', 'intent.entities', 'entities must be an array of strings',
      true, { type: 'coerce_array', path: 'entities', existing: entities }));
  } else if (entities.length === 0) {
    warnings.push(warn('EMPTY_ENTITIES', 'intent.entities', 'No entities extracted'));
  }

  const integrations = intent.integrations_requested ?? intent.integrationsRequested;
  if (integrations !== undefined && !Array.isArray(integrations)) {
    warnings.push(warn('WRONG_TYPE', 'intent.integrations_requested', 'integrations_requested should be an array'));
  }

  if (!Array.isArray(intent.assumptions)) {
    warnings.push(warn('MISSING_FIELD', 'intent.assumptions', 'assumptions should be an array'));
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function validateSchema(schema) {
  const errors = [], warnings = [];

  if (Array.isArray(schema)) {
    schema = { entities: schema };
  }

  if (!schema || typeof schema !== 'object' || !Array.isArray(schema.entities)) {
    errors.push(err('INVALID_STRUCTURE', 'schema', 'DataSchema must be { entities: [...] }'));
    return { isValid: false, errors, warnings };
  }

  if (schema.entities.length === 0) {
    errors.push(err('EMPTY_ENTITIES', 'schema.entities', 'Schema must have at least one entity'));
    return { isValid: false, errors, warnings };
  }

  const entityNames = new Set(schema.entities.map(e => e.name).filter(Boolean));

  schema.entities.forEach(entity => {
    const loc = `entity:${entity.name || '?'}`;

    if (!entity.name || typeof entity.name !== 'string') {
      errors.push(err('MISSING_FIELD', loc, 'Entity missing name'));
      return;
    }

    if (!entity.tableName) {
      errors.push(err('MISSING_FIELD', loc, `Entity "${entity.name}" missing tableName`,
        true, { type: 'set_table_name', entity: entity.name }));
    } else if (!/^[a-z][a-z0-9_]*$/.test(entity.tableName)) {
      warnings.push(warn('INVALID_TABLE_NAME', loc, `tableName "${entity.tableName}" should be snake_case lowercase`));
    }

    if (!Array.isArray(entity.fields)) {
      errors.push(err('MISSING_FIELD', loc, `Entity "${entity.name}" missing fields array`,
        true, { type: 'add_default_fields', entity: entity.name }));
      return;
    }

    const fieldNames = new Set(entity.fields.map(f => f.name));

    if (!fieldNames.has('id')) {
      errors.push(err('MISSING_PK', loc, `Entity "${entity.name}" missing id (primary key)`,
        true, { type: 'add_pk', entity: entity.name }));
    }
    if (!fieldNames.has('tenantId')) {
      errors.push(err('MISSING_TENANT_ID', loc, `Entity "${entity.name}" missing tenantId (required for multi-tenancy)`,
        true, { type: 'add_tenant_id', entity: entity.name }));
    }

    entity.fields.forEach(f => {
      if (!f.name) errors.push(err('MISSING_FIELD', `${loc}.field`, 'Field missing name'));
      if (!f.type) warnings.push(warn('MISSING_FIELD', `${loc}.field:${f.name}`, `Field "${f.name}" missing type`));
    });

    (entity.relations || []).forEach(rel => {
      if (!rel.target) {
        errors.push(err('MISSING_FIELD', `${loc}.relations`, 'Relation missing target entity'));
      } else if (!entityNames.has(rel.target)) {
        errors.push(err('INVALID_RELATION', `${loc}.relations`, `Relation target "${rel.target}" does not exist in schema`));
      }
      if (!['hasMany', 'belongsTo', 'hasOne'].includes(rel.type)) {
        errors.push(err('INVALID_RELATION_TYPE', `${loc}.relations`, `Relation type "${rel.type}" must be hasMany|belongsTo|hasOne`));
      }
    });
  });

  schema.entities.forEach(entity => {
    (entity.relations || []).forEach(rel => {
      if (!entityNames.has(rel.target)) return;
      const target = schema.entities.find(e => e.name === rel.target);
      const hasReverse = (target?.relations || []).some(r => r.target === entity.name);
      if (!hasReverse) {
        warnings.push(warn('MISSING_REVERSE_RELATION', `entity:${entity.name}`,
          `Relation ${entity.name} → ${rel.target} has no reverse relation on ${rel.target}`));
      }
    });
  });

  return { isValid: errors.length === 0, errors, warnings };
}

export function validateAppSpec(appSpec, schema) {
  const errors = [], warnings = [];

  if (!appSpec || typeof appSpec !== 'object') {
    errors.push(err('INVALID_STRUCTURE', 'appSpec', 'AppSpec must be a JSON object'));
    return { isValid: false, errors, warnings };
  }

  const entityNames  = new Set((schema?.entities || []).map(e => e.name));
  const definedRoles = new Set(
    (appSpec.authRules?.roles || []).map(r => r.name).filter(Boolean)
  );

  if (!Array.isArray(appSpec.pages)) {
    errors.push(err('MISSING_FIELD', 'appSpec.pages', 'pages must be an array',
      true, { type: 'set_field', path: 'pages', value: [] }));
  } else {
    const validLayouts = new Set(['list','detail','dashboard','settings','form','kanban']);
    appSpec.pages.forEach(page => {
      const loc = `page:${page.name || '?'}`;
      if (!page.name)  errors.push(err('MISSING_FIELD', loc, 'Page missing name'));
      if (!page.route) errors.push(err('MISSING_FIELD', loc, 'Page missing route'));
      if (page.layout && !validLayouts.has(page.layout)) {
        warnings.push(warn('INVALID_LAYOUT', loc, `Layout "${page.layout}" is not a standard type`));
      }
      if (page.boundEntity && !entityNames.has(page.boundEntity)) {
        errors.push(err('INVALID_ENTITY_REF', loc,
          `Page "${page.name}" references non-existent entity "${page.boundEntity}"`,
          true, { type: 'clear_bound_entity', page: page.name }));
      }
    });
  }

  if (!Array.isArray(appSpec.apiEndpoints)) {
    errors.push(err('MISSING_FIELD', 'appSpec.apiEndpoints', 'apiEndpoints must be an array',
      true, { type: 'set_field', path: 'apiEndpoints', value: [] }));
  } else {
    const validMethods = new Set(['GET','POST','PUT','PATCH','DELETE']);
    appSpec.apiEndpoints.forEach(ep => {
      const loc = `endpoint:${ep.method} ${ep.path}`;
      if (!ep.path)   errors.push(err('MISSING_FIELD', loc, 'Endpoint missing path'));
      if (!ep.method) errors.push(err('MISSING_FIELD', loc, 'Endpoint missing method'));
      if (ep.method && !validMethods.has(ep.method.toUpperCase())) {
        errors.push(err('INVALID_METHOD', loc, `Method "${ep.method}" must be GET|POST|PUT|PATCH|DELETE`));
      }
      if (ep.boundEntity && !entityNames.has(ep.boundEntity)) {
        errors.push(err('INVALID_ENTITY_REF', loc,
          `Endpoint references non-existent entity "${ep.boundEntity}"`,
          true, { type: 'clear_bound_entity_endpoint', path: ep.path }));
      }
    });
  }

  if (Array.isArray(appSpec.pages) && Array.isArray(appSpec.apiEndpoints)) {
    const endpointPaths = (appSpec.apiEndpoints || []).map(ep => ep.path || '');
    (appSpec.pages || []).forEach(page => {
      if (!page.route || page.layout === 'dashboard') return;
      const routeBase = '/' + (page.route || '').split('/').filter(Boolean)[0];
      const hasEndpoint = endpointPaths.some(p => p.startsWith(routeBase) || p.startsWith('/api' + routeBase));
      if (!hasEndpoint) {
        errors.push(err('NO_API_FOR_PAGE', `page:${page.name}`,
          `Page "${page.name}" (${page.route}) has no corresponding API endpoint`,
          true, { type: 'add_endpoint_for_page', page: page.name, route: page.route }));
      }
    });
  }

  if (!appSpec.authRules) {
    warnings.push(warn('MISSING_FIELD', 'appSpec.authRules', 'No authRules defined'));
  } else {
    if (!Array.isArray(appSpec.authRules.roles)) {
      errors.push(err('MISSING_FIELD', 'appSpec.authRules.roles', 'authRules.roles must be an array'));
    }

    Object.keys(appSpec.authRules.permissions || {}).forEach(entityKey => {
      if (!entityNames.has(entityKey)) {
        warnings.push(warn('INVALID_ENTITY_REF', `authRules.permissions.${entityKey}`,
          `Permission key "${entityKey}" is not a known entity`));
      }
    });
  }

  (appSpec.integrationHooks || []).forEach((hook, i) => {
    const loc = `integrationHooks[${i}]`;
    if (!hook.integration) {
      errors.push(err('MISSING_FIELD', loc, 'Hook missing integration id'));
      return;
    }
    if (!INTEGRATION_REGISTRY[hook.integration]) {
      errors.push(err('UNREGISTERED_INTEGRATION', loc,
        `Integration "${hook.integration}" is not in the registry. Valid: ${Object.keys(INTEGRATION_REGISTRY).join(', ')}`));
    } else if (hook.action) {
      const validActions = INTEGRATION_REGISTRY[hook.integration].actions.map(a => a.id);
      if (!validActions.includes(hook.action)) {
        errors.push(err('INVALID_INTEGRATION_ACTION', loc,
          `Action "${hook.action}" not found in "${hook.integration}". Valid: ${validActions.join(', ')}`,
          true, { type: 'fix_integration_action', integration: hook.integration, index: i }));
      }
    }
    if (hook.entity && !entityNames.has(hook.entity)) {
      errors.push(err('INVALID_ENTITY_REF', loc,
        `Hook references non-existent entity "${hook.entity}"`,
        true, { type: 'clear_hook_entity', index: i }));
    }
  });

  (appSpec.workflowStubs || []).forEach((stub, i) => {
    const loc = `workflowStubs[${i}]:${stub.name || '?'}`;
    if (stub.trigger?.entity && !entityNames.has(stub.trigger.entity)) {
      errors.push(err('INVALID_ENTITY_REF', loc,
        `Workflow trigger entity "${stub.trigger.entity}" does not exist`,
        true, { type: 'fix_workflow_entity', index: i }));
    }
    if (stub.integration && !INTEGRATION_REGISTRY[stub.integration]) {
      errors.push(err('UNREGISTERED_INTEGRATION', loc,
        `Workflow references unregistered integration "${stub.integration}"`));
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}
