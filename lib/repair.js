
import { gatewayCall, safeJSON } from './gateway.js';
import { validateDataSchema, validateAppSpec } from './validation.js';
import { isValidIntegration, getAllIntegrations, INTEGRATION_REGISTRY } from './integrations.js';
import { normalizeParsedByStage, normalizeAppSpecShape } from './schemaNormalize.js';
import { finalizeAppSpec } from './pipeline.js';

/** Local helper — avoids ReferenceError if bundler drops named import on serverless */
function isValidAction(integrationId, actionId) {
  const integration = INTEGRATION_REGISTRY[integrationId];
  if (!integration || !actionId) return false;
  return (integration.actions || []).some(a => a.id === actionId);
}

function hookIntegrationId(hook) {
  return hook?.integrationId || hook?.integration || '';
}

function logEntry(strategy, errorCode, location, outcome, detail = '') {
  return {
    strategy,
    errorCode,
    location,
    outcome,
    detail,
    timestamp: new Date().toISOString(),
  };
}

function structuralRepair(raw, expectedShape) {
  if (!raw || typeof raw !== 'string') {
    return { repaired: null, log: logEntry('structural', 'INVALID_INPUT', 'root', 'failed', 'Input is not a string') };
  }

  let cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const stageKey = expectedShape === 'dataSchema' ? 'schema' : 'appspec';
  try {
    const parsed = normalizeParsedByStage(JSON.parse(cleaned), stageKey);
    return { repaired: parsed, log: logEntry('structural', 'MALFORMED_JSON', 'root', 'repaired', 'Stripped markdown fences') };
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = normalizeParsedByStage(JSON.parse(match[0]), stageKey);
      return { repaired: parsed, log: logEntry('structural', 'MALFORMED_JSON', 'root', 'repaired', 'Extracted JSON object from text') };
    } catch {}
  }

  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      let parsed = JSON.parse(arrMatch[0]);
      if (expectedShape === 'dataSchema' && Array.isArray(parsed)) {
        parsed = { entities: parsed };
      }
      parsed = normalizeParsedByStage(parsed, stageKey);
      return { repaired: parsed, log: logEntry('structural', 'MALFORMED_JSON', 'root', 'repaired', 'Extracted JSON array') };
    } catch {}
  }

  if (expectedShape === 'dataSchema') {
    const repaired = { entities: [] };
    return { repaired, log: logEntry('structural', 'TRUNCATED_JSON', 'root', 'escalated', 'Could not parse — returning minimal valid shape') };
  }
  if (expectedShape === 'appSpec') {
    const repaired = { pages: [], apiEndpoints: [], authRules: [], integrationHooks: [], workflowStubs: [] };
    return { repaired, log: logEntry('structural', 'TRUNCATED_JSON', 'root', 'escalated', 'Could not parse — returning minimal valid shape') };
  }

  return { repaired: null, log: logEntry('structural', 'TRUNCATED_JSON', 'root', 'failed', 'Cannot recover structure') };
}

function fieldRepair(obj, validationErrors, context = {}) {
  const repairLog = [];
  let fixed = JSON.parse(JSON.stringify(obj));

  for (const error of validationErrors) {
    if (error.code === 'MISSING_TENANT_ID' && error.fixHint?.type === 'add_field') {
      const { entity: entityName, field } = error.fixHint;
      const entity = fixed.entities?.find(e => e.name === entityName);
      if (entity && !entity.fields.some(f => f.name === 'tenantId')) {
        entity.fields.push(field);
        repairLog.push(logEntry('field', 'MISSING_TENANT_ID', error.location, 'repaired', `Added tenantId to ${entityName}`));
      }
    }

    if (error.code === 'MISSING_PK' && error.fixHint?.type === 'add_field') {
      const { entity: entityName, field } = error.fixHint;
      const entity = fixed.entities?.find(e => e.name === entityName);
      if (entity && !entity.fields.some(f => f.isPrimary || f.name === 'id')) {
        entity.fields.unshift(field);
        repairLog.push(logEntry('field', 'MISSING_PK', error.location, 'repaired', `Added primary key to ${entityName}`));
      }
    }

    if (error.code === 'UNDEFINED_ROLE' && error.fixHint?.type === 'add_role') {
      const { role } = error.fixHint;
      if (fixed.authRules && !fixed.authRules.some(r => r.role === role)) {
        fixed.authRules.push({
          role,
          permissions: (context.entityNames || []).reduce((acc, e) => {
            acc[e] = { read: true, write: role !== 'viewer', delete: role === 'admin' };
            return acc;
          }, {}),
        });
        repairLog.push(logEntry('field', 'UNDEFINED_ROLE', error.location, 'repaired', `Added role "${role}"`));
      }
    }

    if (error.code === 'SCHEMA_MISMATCH' && error.fixHint?.type === 'structural') {
      if (Array.isArray(fixed.pages)) {
        const ds = context.dataSchema || null;
        const intent = context.intent || { integrations_requested: [] };
        fixed = finalizeAppSpec(normalizeAppSpecShape(fixed, intent, ds), intent, ds);
        repairLog.push(logEntry('field', 'SCHEMA_MISMATCH', error.location, 'repaired', 'Coerced AppSpec structure, components, and endpoints'));
      }
    }

    if (error.code === 'SCHEMA_MISMATCH' && error.fixHint?.type === 'field_default') {

      const field = error.fixHint.field;
      const defaults = {
        'appType': 'custom',
        'features': [],
        'entities': [],
        'integrations_requested': [],
        'assumptions': [],
      };
      if (field in defaults && fixed[field] === undefined) {
        fixed[field] = defaults[field];
        repairLog.push(logEntry('field', 'SCHEMA_MISMATCH', error.location, 'repaired', `Applied default for field "${field}"`));
      }
    }
  }

  return { fixed, repairLog };
}

function consistencyRepair(obj, validationErrors, dataSchema = null) {
  const repairLog = [];
  let fixed = JSON.parse(JSON.stringify(obj));
  const entityNames = (dataSchema?.entities || fixed?.entities || []).map(e => e.name);

  for (const error of validationErrors) {
    if (error.code === 'BROKEN_RELATION' && error.fixHint?.type === 'remove_relation') {
      const { entity: entityName, target } = error.fixHint;
      const entity = fixed.entities?.find(e => e.name === entityName);
      if (entity) {
        const before = entity.relations?.length || 0;
        entity.relations = (entity.relations || []).filter(r => r.target !== target);
        repairLog.push(logEntry('consistency', 'BROKEN_RELATION', error.location, 'repaired', `Removed broken relation ${entityName}→${target}`));
      }
    }

    if (error.code === 'UNIDIRECTIONAL_RELATION' && error.fixHint?.type === 'add_reverse_relation') {
      const { from, to, relationType } = error.fixHint;
      const targetEntity = fixed.entities?.find(e => e.name === to);
      if (targetEntity) {
        const alreadyExists = targetEntity.relations?.some(r => r.target === from);
        if (!alreadyExists) {
          targetEntity.relations = targetEntity.relations || [];
          targetEntity.relations.push({
            type: relationType,
            target: from,
            foreignKey: `${from.toLowerCase()}_id`,
            onDelete: 'CASCADE',
          });
          repairLog.push(logEntry('consistency', 'UNIDIRECTIONAL_RELATION', error.location, 'repaired', `Added reverse relation ${to}→${from}`));
        }
      }
    }

    if (error.code === 'UNREGISTERED_INTEGRATION' && (fixed.integrationHooks || fixed.workflowStubs)) {

      if (fixed.integrationHooks) {
        const before = fixed.integrationHooks.length;
        fixed.integrationHooks = fixed.integrationHooks.filter(h => isValidIntegration(hookIntegrationId(h)));
        if (fixed.integrationHooks.length < before) {
          repairLog.push(logEntry('consistency', 'UNREGISTERED_INTEGRATION', error.location, 'repaired', 'Removed hooks with unregistered integrations'));
        }
      }
      if (fixed.workflowStubs) {
        const before = fixed.workflowStubs.length;
        fixed.workflowStubs = fixed.workflowStubs.filter(s => isValidIntegration(s.integration));
        if (fixed.workflowStubs.length < before) {
          repairLog.push(logEntry('consistency', 'UNREGISTERED_INTEGRATION', error.location, 'repaired', 'Removed stubs with unregistered integrations'));
        }
      }
    }

    if (error.code === 'INVALID_INTEGRATION_ACTION' && error.fixHint?.type === 'fix_action') {
      const { integrationId } = error.fixHint;
      const integration = INTEGRATION_REGISTRY[integrationId];
      const firstAction = integration?.actions?.[0]?.id;
      if (firstAction) {
        if (fixed.integrationHooks) {
          fixed.integrationHooks = fixed.integrationHooks.map(h =>
            hookIntegrationId(h) === integrationId && !isValidAction(integrationId, h.action)
              ? { ...h, integrationId, integration: integrationId, action: firstAction }
              : h
          );
        }
        if (fixed.workflowStubs) {
          fixed.workflowStubs = fixed.workflowStubs.map(s =>
            s.integration === integrationId && !isValidAction(integrationId, s.action)
              ? { ...s, action: firstAction }
              : s
          );
        }
        repairLog.push(logEntry('consistency', 'INVALID_INTEGRATION_ACTION', error.location, 'repaired', `Fixed action to "${firstAction}" for ${integrationId}`));
      }
    }

    if (error.code === 'UNRESOLVED_ENTITY') {

      const target = error.message.match(/"([^"]+)"/g)?.[1]?.replace(/"/g, '');
      const closest = entityNames.find(n => n.toLowerCase().includes((target || '').toLowerCase())) || entityNames[0];
      if (closest && target) {
        if (fixed.pages) {
          fixed.pages = fixed.pages.map(p =>
            p.boundEntity === target ? { ...p, boundEntity: closest } : p
          );
        }
        if (fixed.integrationHooks) {
          fixed.integrationHooks = fixed.integrationHooks.map(h =>
            h.trigger.entity === target ? { ...h, trigger: { ...h.trigger, entity: closest } } : h
          );
        }
        if (fixed.workflowStubs) {
          fixed.workflowStubs = fixed.workflowStubs.map(s =>
            s.trigger.entity === target ? { ...s, trigger: { ...s.trigger, entity: closest } } : s
          );
        }
        if (closest) {
          repairLog.push(logEntry('consistency', 'UNRESOLVED_ENTITY', error.location, 'repaired', `Remapped entity "${target}" → "${closest}"`));
        }
      }
    }

    if (error.code === 'PAGE_WITHOUT_ENDPOINT' && error.fixHint?.type === 'add_endpoint') {
      const { page, entity } = error.fixHint;
      const entityLower = entity?.toLowerCase() || 'resource';
      fixed.apiEndpoints = fixed.apiEndpoints || [];
      fixed.apiEndpoints.push({
        path: `/${entityLower}s`,
        method: 'GET',
        description: `List ${entity || page} records`,
        boundEntity: entity,
        authRequired: true,
        rateLimit: false,
      });
      repairLog.push(logEntry('consistency', 'PAGE_WITHOUT_ENDPOINT', error.location, 'repaired', `Added GET endpoint for page "${page}"`));
    }
  }

  return { fixed, repairLog };
}

async function aiRepair(stage, brokenOutput, validationErrors, errorHint = '') {
  const errorSummary = validationErrors.slice(0, 5).map(e => `- ${e.code} at ${e.location}: ${e.message}`).join('\n');
  const systemPrompt = `You are a JSON repair specialist. Fix the broken output for stage "${stage}".
Return ONLY valid JSON that fixes these issues:
${errorSummary}
${errorHint ? `Additional hint: ${errorHint}` : ''}
Do not explain. Return only the corrected JSON object.`;

  const userMessage = `Broken output to fix:\n${JSON.stringify(brokenOutput, null, 2)}`;

  try {
    const result = await gatewayCall('repair_capable', systemPrompt, userMessage, 2000, 0.1);
    const repaired = safeJSON(result.content);
    return {
      repaired,
      cost: result.usage,
      log: logEntry('ai_reprompt', 'MULTI_ERROR', stage, repaired ? 'repaired' : 'failed', `AI repair via ${result.provider}/${result.model}`),
    };
  } catch (err) {
    return {
      repaired: null,
      cost: null,
      log: logEntry('ai_reprompt', 'MULTI_ERROR', stage, 'failed', `AI repair failed: ${err.message}`),
    };
  }
}

export async function runRepairEngine(stage, rawOutput, parsedOutput, validationResult, dataSchema = null, intent = null, errorHint = '') {
  const allLogs = [];
  const errors = [...validationResult.errors, ...validationResult.warnings.filter(w => w.severity === 'error')];
  const warnings = validationResult.warnings.filter(w => w.severity === 'warning');
  let current = parsedOutput;
  const stageKey = stage === 'schema' ? 'schema' : 'appspec';

  if (Array.isArray(current)) {
    current = normalizeParsedByStage(current, stageKey, null, dataSchema);
  }

  if (validationResult.isValid) {
    return { output: current, repairLog: [], cost: null };
  }

  if (!parsedOutput || typeof parsedOutput !== 'object') {
    const { repaired, log } = structuralRepair(rawOutput, stage === 'schema' ? 'dataSchema' : 'appSpec');
    allLogs.push(log);
    if (repaired) {
      current = repaired;
    } else {
      allLogs.push(logEntry('structural', 'UNRECOVERABLE', stage, 'escalated', 'Escalating to AI repair'));
      const aiResult = await aiRepair(stage, rawOutput, errors, errorHint);
      allLogs.push(aiResult.log);
      return { output: aiResult.repaired, repairLog: allLogs, cost: aiResult.cost };
    }
  }

  const fieldErrors = errors.filter(e => ['MISSING_TENANT_ID', 'MISSING_PK', 'UNDEFINED_ROLE', 'SCHEMA_MISMATCH'].includes(e.code));
  if (fieldErrors.length > 0) {
    const entityNames = (dataSchema?.entities || current?.entities || []).map(e => e.name);
    const { fixed, repairLog } = fieldRepair(current, fieldErrors, { entityNames, dataSchema, intent });
    allLogs.push(...repairLog);
    current = fixed;
  }

  const consistencyErrors = errors.filter(e =>
    ['BROKEN_RELATION', 'UNIDIRECTIONAL_RELATION', 'UNREGISTERED_INTEGRATION', 'INVALID_INTEGRATION_ACTION',
     'UNRESOLVED_ENTITY', 'PAGE_WITHOUT_ENDPOINT'].includes(e.code)
  );
  if (consistencyErrors.length > 0) {
    const { fixed, repairLog } = consistencyRepair(current, consistencyErrors, dataSchema);
    allLogs.push(...repairLog);
    current = fixed;
  }

  if (stage !== 'schema' && stage !== 'intent' && current && dataSchema) {
    const intentCtx = intent || {
      integrations_requested: [
        ...new Set(
          [
            ...(current.integrationHooks || []).map(h => h.integrationId || h.integration),
            ...(current.workflowStubs || []).map(s => s.integration),
          ].filter(Boolean)
        ),
      ],
    };
    current = finalizeAppSpec(normalizeAppSpecShape(current, intentCtx, dataSchema), intentCtx, dataSchema);
  }

  let revalidation;
  if (stage === 'schema') {
    revalidation = validateDataSchema(current);
  } else {
    revalidation = validateAppSpec(current, dataSchema);
  }

  if (!revalidation.isValid && revalidation.errors.length > 0) {

    allLogs.push(logEntry('escalation', 'REMAINING_ERRORS', stage, 'escalated',
      `${revalidation.errors.length} errors remain after deterministic repair — escalating to AI`));
    const aiResult = await aiRepair(stage, current, revalidation.errors, errorHint);
    allLogs.push(aiResult.log);
    return { output: aiResult.repaired || current, repairLog: allLogs, cost: aiResult.cost };
  }

  return { output: current, repairLog: allLogs, cost: null };
}
