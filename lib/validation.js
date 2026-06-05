
import { z } from 'zod';
import { isValidIntegration, INTEGRATION_REGISTRY } from './integrations.js';
import { resolveIntegrationAction } from './schemaNormalize.js';

/** Local helper — Vercel serverless can drop named re-exports from integrations.js */
function isValidAction(integrationId, actionId) {
  if (!integrationId || !actionId) return false;
  const integration = INTEGRATION_REGISTRY[integrationId];
  if (!integration) return false;
  const resolved = resolveIntegrationAction(integrationId, actionId);
  return (integration.actions || []).some(a => a.id === resolved);
}

export const AppIntentSchema = z.object({
  appName:               z.string().min(1),
  appType:               z.enum(['crm', 'project_management', 'ecommerce', 'hr_tool', 'inventory', 'content_platform', 'analytics', 'custom']),
  features:              z.array(z.string()),
  entities:              z.array(z.string()),
  integrations_requested:z.array(z.string()).default([]),
  assumptions:           z.array(z.string()).default([]),
  clarification_required:z.boolean().optional(),
  clarification_question:z.string().optional(),
});

const FieldSchema = z.object({
  name:       z.string(),
  type:       z.enum(['string', 'text', 'integer', 'float', 'boolean', 'date', 'datetime', 'uuid', 'json', 'enum']),
  nullable:   z.boolean().default(false),
  isRelation: z.boolean().default(false),
  isPrimary:  z.boolean().default(false),
  isUnique:   z.boolean().default(false),
  enumValues: z.array(z.string()).optional(),
});

const RelationSchema = z.object({
  type:       z.enum(['hasMany', 'belongsTo', 'hasOne']),
  target:     z.string(),
  foreignKey: z.string(),
  onDelete:   z.enum(['CASCADE', 'SET NULL', 'RESTRICT']).default('CASCADE'),
});

export const EntitySchemaZod = z.object({
  name:      z.string(),
  tableName: z.string().regex(/^[a-z][a-z0-9_]*$/, 'tableName must be snake_case'),
  fields:    z.array(FieldSchema).min(1),
  relations: z.array(RelationSchema).default([]),
});

export const DataSchemaZod = z.object({
  entities: z.array(EntitySchemaZod).min(1),
});

const ComponentSchema = z.object({
  type:   z.enum(['table', 'form', 'chart', 'card', 'stats', 'kanban', 'calendar']),
  id:     z.string(),
  boundEntity: z.string().nullable().optional(),
  props:  z.record(z.unknown()).optional(),
});

const PageSchema = z.object({
  name:        z.string(),
  route:       z.string().startsWith('/'),
  layout:      z.enum(['list', 'detail', 'dashboard', 'settings', 'form', 'kanban']),
  boundEntity: z.string().nullable().optional(),
  components:  z.array(ComponentSchema).min(1),
});

const EndpointSchema = z.object({
  path:        z.string().startsWith('/'),
  method:      z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  description: z.string(),
  boundEntity: z.string().nullable().optional(),
  authRequired:z.boolean(),
  rateLimit:   z.boolean().default(false),
});

const AuthRuleSchema = z.object({
  role:        z.string(),
  permissions: z.record(z.object({
    read:    z.boolean(),
    write:   z.boolean(),
    delete:  z.boolean(),
  })),
});

const IntegrationHookSchema = z.object({
  integrationId: z.string(),
  trigger:       z.object({
    entity:    z.string(),
    event:     z.enum(['created', 'updated', 'deleted', 'status_changed']),
    condition: z.string().optional(),
  }),
  action: z.string(),
});

const WorkflowStubSchema = z.object({
  name:        z.string(),
  trigger:     z.object({
    entity:    z.string(),
    event:     z.enum(['created', 'updated', 'deleted', 'status_changed']),
    condition: z.string().optional(),
  }),
  integration: z.string(),
  action:      z.string(),
  payload:     z.record(z.string()),
});

export const AppSpecSchema = z.object({
  pages:           z.array(PageSchema).min(1),
  apiEndpoints:    z.array(EndpointSchema).min(1),
  authRules:       z.array(AuthRuleSchema),
  integrationHooks:z.array(IntegrationHookSchema).default([]),
  workflowStubs:   z.array(WorkflowStubSchema).default([]),
});

function mkError(code, severity, location, message, autoFixable = false, fixHint = null) {
  return { code, severity, location, message, autoFixable, fixHint };
}

export function validateIntent(intent) {
  const errors = [];
  const warnings = [];

  const result = AppIntentSchema.safeParse(intent);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(mkError(
        'SCHEMA_MISMATCH',
        'error',
        `intent.${issue.path.join('.')}`,
        issue.message,
        true,
        { type: 'field_default', field: issue.path.join('.') }
      ));
    }
  }

  if (intent?.features?.length === 0) {
    warnings.push(mkError('EMPTY_FEATURES', 'warning', 'intent.features', 'No features extracted — output may be generic'));
  }
  if (intent?.entities?.length === 0) {
    warnings.push(mkError('EMPTY_ENTITIES', 'warning', 'intent.entities', 'No entities extracted — schema may be minimal'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: { errors: errors.length, warnings: warnings.length },
  };
}

export function validateDataSchema(dataSchema) {
  const errors = [];
  const warnings = [];

  if (Array.isArray(dataSchema)) {
    dataSchema = { entities: dataSchema };
  }

  const result = DataSchemaZod.safeParse(dataSchema);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(mkError(
        'SCHEMA_MISMATCH',
        'error',
        `dataSchema.${issue.path.join('.')}`,
        issue.message,
        true,
        { type: 'structural', path: issue.path }
      ));
    }
  }

  if (!result.success) {
    return { isValid: false, errors, warnings, summary: { errors: errors.length, warnings: warnings.length } };
  }

  const entityNames = new Set(dataSchema.entities.map(e => e.name));

  for (const entity of dataSchema.entities) {

    const hasTenantId = entity.fields.some(f => f.name === 'tenantId' || f.name === 'tenant_id');
    if (!hasTenantId) {
      errors.push(mkError(
        'MISSING_TENANT_ID',
        'error',
        `entity:${entity.name}`,
        `Entity "${entity.name}" missing required tenantId field`,
        true,
        { type: 'add_field', entity: entity.name, field: { name: 'tenantId', type: 'uuid', nullable: false, isRelation: false, isPrimary: false, isUnique: false } }
      ));
    }

    const hasPK = entity.fields.some(f => f.isPrimary || f.name === 'id');
    if (!hasPK) {
      warnings.push(mkError(
        'MISSING_PK',
        'warning',
        `entity:${entity.name}`,
        `Entity "${entity.name}" has no primary key field`,
        true,
        { type: 'add_field', entity: entity.name, field: { name: 'id', type: 'uuid', nullable: false, isRelation: false, isPrimary: true, isUnique: true } }
      ));
    }

    for (const rel of entity.relations || []) {
      if (!entityNames.has(rel.target)) {
        errors.push(mkError(
          'BROKEN_RELATION',
          'error',
          `entity:${entity.name} → ${rel.target}`,
          `Relation target "${rel.target}" does not exist in schema`,
          true,
          { type: 'remove_relation', entity: entity.name, target: rel.target }
        ));
      } else {

        const targetEntity = dataSchema.entities.find(e => e.name === rel.target);
        const hasReverse = targetEntity?.relations?.some(r => r.target === entity.name);
        if (!hasReverse) {
          warnings.push(mkError(
            'UNIDIRECTIONAL_RELATION',
            'warning',
            `entity:${entity.name} → ${rel.target}`,
            `Relation from "${entity.name}" to "${rel.target}" has no reverse`,
            true,
            { type: 'add_reverse_relation', from: entity.name, to: rel.target, relationType: rel.type === 'hasMany' ? 'belongsTo' : 'hasMany' }
          ));
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: { errors: errors.length, warnings: warnings.length },
  };
}

export function validateAppSpec(appSpec, dataSchema) {
  const errors = [];
  const warnings = [];

  const result = AppSpecSchema.safeParse(appSpec);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(mkError(
        'SCHEMA_MISMATCH',
        'error',
        `appSpec.${issue.path.join('.')}`,
        issue.message,
        true,
        { type: 'structural', path: issue.path }
      ));
    }
  }

  const entityNames = new Set((dataSchema?.entities || []).map(e => e.name));
  const definedRoles = new Set((appSpec?.authRules || []).map(r => r.role));
  const endpoints = appSpec?.apiEndpoints || [];

  for (const page of appSpec?.pages || []) {
    const hasEndpoint = endpoints.some(ep =>
      ep.boundEntity === page.boundEntity ||
      ep.path.toLowerCase().includes((page.boundEntity || '').toLowerCase()) ||
      ep.description.toLowerCase().includes(page.name.toLowerCase())
    );
    if (!hasEndpoint && page.boundEntity) {
      errors.push(mkError(
        'PAGE_WITHOUT_ENDPOINT',
        'error',
        `page:${page.name}`,
        `Page "${page.name}" (bound to "${page.boundEntity}") has no corresponding API endpoint`,
        true,
        { type: 'add_endpoint', page: page.name, entity: page.boundEntity }
      ));
    }

    if (page.boundEntity && !entityNames.has(page.boundEntity)) {
      errors.push(mkError(
        'UNRESOLVED_ENTITY',
        'error',
        `page:${page.name}`,
        `Page "${page.name}" references unknown entity "${page.boundEntity}"`,
        true,
        { type: 'remap_entity', page: page.name, availableEntities: [...entityNames] }
      ));
    }
  }

  for (const ep of endpoints) {
    if (ep.authRequired && definedRoles.size > 0) {
      const epRoles = ep.roles || [];
      for (const role of epRoles) {
        if (!definedRoles.has(role)) {
          warnings.push(mkError(
            'UNDEFINED_ROLE',
            'warning',
            `endpoint:${ep.method} ${ep.path}`,
            `Endpoint references undefined role "${role}"`,
            true,
            { type: 'add_role', role }
          ));
        }
      }
    }
  }

  for (const hook of appSpec?.integrationHooks || []) {
    const integrationId = hook.integrationId || hook.integration || '';
    if (!integrationId) {
      errors.push(mkError(
        'SCHEMA_MISMATCH',
        'error',
        'integrationHook',
        'Integration hook missing integration id',
        true,
        { type: 'structural', path: ['integrationHooks'] }
      ));
      continue;
    }
    if (!isValidIntegration(integrationId)) {
      errors.push(mkError(
        'UNREGISTERED_INTEGRATION',
        'error',
        `integrationHook:${integrationId}`,
        `Integration "${integrationId}" is not registered in the registry`,
        true,
        { type: 'remove_hook', integrationId }
      ));
    } else if (hook.action && !isValidAction(integrationId, hook.action)) {
      errors.push(mkError(
        'INVALID_INTEGRATION_ACTION',
        'error',
        `integrationHook:${integrationId}`,
        `Action "${hook.action}" is not valid for integration "${integrationId}"`,
        true,
        { type: 'fix_action', integrationId }
      ));
    }

    if (hook.trigger?.entity && !entityNames.has(hook.trigger.entity)) {
      errors.push(mkError(
        'UNRESOLVED_ENTITY',
        'error',
        `integrationHook:${integrationId}`,
        `Integration hook references unknown entity "${hook.trigger.entity}"`,
        true,
        { type: 'remap_entity', availableEntities: [...entityNames] }
      ));
    }
  }

  for (const stub of appSpec?.workflowStubs || []) {
    const stubIntegration = stub.integration || String(stub.actionType || '').split('.')[0] || '';
    if (stubIntegration && !isValidIntegration(stubIntegration)) {
      errors.push(mkError(
        'UNREGISTERED_INTEGRATION',
        'error',
        `workflowStub:${stub.name}`,
        `Workflow stub references unregistered integration "${stubIntegration}"`,
        true,
        { type: 'remove_stub', integration: stubIntegration }
      ));
    }
    const triggerEntity = stub.trigger?.entity ?? stub.triggerEntity;
    if (triggerEntity && !entityNames.has(triggerEntity)) {
      errors.push(mkError(
        'UNRESOLVED_ENTITY',
        'error',
        `workflowStub:${stub.name}`,
        `Workflow stub references unknown entity "${triggerEntity}"`,
        true,
        { type: 'remap_entity', availableEntities: [...entityNames] }
      ));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: { errors: errors.length, warnings: warnings.length },
  };
}
