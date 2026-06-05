
import { INTEGRATION_REGISTRY } from './integrationRegistry.js';
import { normalizeParsedByStage, normalizeDataSchemaShape, normalizeAppSpecShape } from './schemaNormalize.js';

function structuralRepair(rawText, stage = null, intent = null, schema = null) {
  const log = { strategy: 'structural', outcome: null, fixes: [] };

  if (!rawText || typeof rawText !== 'string') {
    log.outcome = 'failed'; log.reason = 'No raw text available';
    return { result: null, log };
  }

  let t = rawText.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  try {
    const r = normalizeParsedByStage(JSON.parse(t), stage, intent, schema);
    log.outcome = 'repaired'; log.fixes.push('Parsed after fence strip'); return { result: r, log };
  } catch {}

  const noTrailingComma = t.replace(/,(\s*[}\]])/g, '$1');
  try {
    const r = normalizeParsedByStage(JSON.parse(noTrailingComma), stage, intent, schema);
    log.outcome = 'repaired'; log.fixes.push('Removed trailing commas'); return { result: r, log };
  } catch {}

  const closingAttempts = [t, t + '"}}', t + '"]}', t + ']}', t + '}}', t + '}', t.replace(/,\s*$/, '') + '}'];
  for (const attempt of closingAttempts) {
    try {
      const r = normalizeParsedByStage(JSON.parse(attempt), stage, intent, schema);
      log.outcome = 'repaired'; log.fixes.push('Closed open JSON structure'); return { result: r, log };
    } catch {}
  }

  const objMatch = t.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const r = normalizeParsedByStage(JSON.parse(objMatch[0]), stage, intent, schema);
      log.outcome = 'repaired'; log.fixes.push('Extracted JSON object fragment'); return { result: r, log };
    } catch {}

    const frag = objMatch[0];
    for (const suffix of ['', '}', '}}', '"}}']) {
      try {
        const r = normalizeParsedByStage(JSON.parse(frag + suffix), stage, intent, schema);
        log.outcome = 'repaired'; log.fixes.push('Extracted + closed JSON fragment'); return { result: r, log };
      } catch {}
    }
  }

  log.outcome = 'escalated'; log.reason = 'Could not recover valid JSON from output';
  return { result: null, log };
}

function fieldRepair(data, errors) {
  const log = { strategy: 'field', outcome: null, fixes: [], errorsAttempted: errors.length };
  const result = JSON.parse(JSON.stringify(data || {}));
  let fixed = 0;

  for (const error of errors) {
    if (!error.autoFixable || !error.fixAction) continue;
    const act = error.fixAction;

    switch (act.type) {
      case 'set_field': {
        if (result[act.path] == null) {

          if (act.path === 'features' || act.path === 'entities' || act.path === 'integrations_requested') {
            result[act.path] = Array.isArray(result[act.path]) ? result[act.path] : (result[act.path] ? [String(result[act.path])] : []);
          } else {
            result[act.path] = act.value;
          }
          log.fixes.push(`Set ${act.path} = ${JSON.stringify(result[act.path])}`);
          fixed++;
        }
        break;
      }
      case 'coerce_array': {
        const v = result[act.path] ?? act.existing;
        if (v != null && !Array.isArray(v)) {
          result[act.path] = [String(v)];
          log.fixes.push(`Coerced ${act.path} to array`);
          fixed++;
        } else if (v == null) {
          result[act.path] = [];
          log.fixes.push(`Set ${act.path} to empty array`);
          fixed++;
        }
        break;
      }
      case 'add_pk': {
        const entity = (result.entities || []).find(e => e.name === act.entity);
        if (entity && !entity.fields?.some(f => f.name === 'id')) {
          entity.fields = entity.fields || [];
          entity.fields.unshift({ name: 'id', type: 'uuid', nullable: false, isPrimary: true, isUnique: true, isRelation: false });
          log.fixes.push(`Added id primary key to ${act.entity}`);
          fixed++;
        }
        break;
      }
      case 'add_tenant_id': {
        const entity = (result.entities || []).find(e => e.name === act.entity);
        if (entity && !entity.fields?.some(f => f.name === 'tenantId')) {
          entity.fields = entity.fields || [];
          const idIdx = entity.fields.findIndex(f => f.name === 'id');
          entity.fields.splice(idIdx + 1, 0, { name: 'tenantId', type: 'uuid', nullable: false, isPrimary: false, isUnique: false, isRelation: false });
          log.fixes.push(`Added tenantId to ${act.entity}`);
          fixed++;
        }
        break;
      }
      case 'set_table_name': {
        const entity = (result.entities || []).find(e => e.name === act.entity);
        if (entity && !entity.tableName) {
          entity.tableName = act.entity.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();
          log.fixes.push(`Set tableName for ${act.entity} → ${entity.tableName}`);
          fixed++;
        }
        break;
      }
      case 'add_default_fields': {
        const entity = (result.entities || []).find(e => e.name === act.entity);
        if (entity && !Array.isArray(entity.fields)) {
          entity.fields = [
            { name: 'id',        type: 'uuid',      nullable: false, isPrimary: true,  isUnique: true,  isRelation: false },
            { name: 'tenantId',  type: 'uuid',      nullable: false, isPrimary: false, isUnique: false, isRelation: false },
            { name: 'createdAt', type: 'timestamp', nullable: false, isPrimary: false, isUnique: false, isRelation: false },
          ];
          log.fixes.push(`Added default fields to ${act.entity}`);
          fixed++;
        }
        break;
      }
      case 'add_endpoint_for_page': {
        const base = (act.route || `/${act.page.toLowerCase()}`).split('/').filter(Boolean)[0];
        result.apiEndpoints = result.apiEndpoints || [];
        if (!result.apiEndpoints.some(ep => ep.path?.includes(base))) {
          result.apiEndpoints.push({
            path: `/api/${base}`, method: 'GET',
            handler: `List ${act.page} records with pagination`, boundEntity: null,
            authRequired: true, rateLimit: false,
          });
          log.fixes.push(`Added GET /api/${base} endpoint for page "${act.page}"`);
          fixed++;
        }
        break;
      }
      case 'clear_bound_entity': {
        const page = (result.pages || []).find(p => p.name === act.page);
        if (page) { page.boundEntity = null; log.fixes.push(`Cleared invalid boundEntity on page "${act.page}"`); fixed++; }
        break;
      }
      default:
        break;
    }
  }

  log.outcome = fixed > 0 ? 'repaired' : 'escalated';
  if (fixed === 0) log.reason = 'No auto-fixable errors found or no fixActions matched';
  return { result, log };
}

function consistencyRepair(data, errors, contextData = {}) {
  const log = { strategy: 'consistency', outcome: null, fixes: [], errorsAttempted: errors.length };
  const result = JSON.parse(JSON.stringify(data || {}));
  let fixed = 0;

  if (contextData?.intent && (!contextData.schema?.entities?.length)) {
    contextData.schema = normalizeDataSchemaShape(contextData.schema || {}, contextData.intent);
  }

  let entityNames = (contextData?.schema?.entities || []).map(e => e.name);
  let firstEntity = entityNames[0] || null;

  for (const error of errors) {
    switch (error.type) {
      case 'INVALID_ENTITY_REF': {
        if (!firstEntity) break;
        const loc = error.location;

        if (loc.startsWith('page:')) {
          const pageName = loc.replace('page:', '');
          const page = (result.pages || []).find(p => p.name === pageName);
          if (page && page.boundEntity && !entityNames.includes(page.boundEntity)) {

            const match = entityNames.find(n =>
              n.toLowerCase().includes(page.boundEntity?.toLowerCase()) ||
              page.boundEntity?.toLowerCase().includes(n.toLowerCase())
            ) || firstEntity;
            page.boundEntity = match;
            log.fixes.push(`Fixed page "${pageName}" boundEntity → "${match}"`);
            fixed++;
          }
        }

        else if (loc.startsWith('endpoint:')) {
          const pathMethod = loc.replace('endpoint:', '');
          const ep = (result.apiEndpoints || []).find(e => `${e.method} ${e.path}` === pathMethod);
          if (ep && ep.boundEntity && !entityNames.includes(ep.boundEntity)) {
            ep.boundEntity = null;
            log.fixes.push(`Cleared invalid boundEntity on endpoint "${pathMethod}"`);
            fixed++;
          }
        }

        else if (loc.startsWith('workflowStubs[')) {
          const idx = parseInt(loc.match(/\[(\d+)\]/)?.[1] ?? '-1');
          const stub = result.workflowStubs?.[idx];
          if (stub?.trigger && !entityNames.includes(stub.trigger.entity)) {
            const match = entityNames.find(n =>
              n.toLowerCase().includes((stub.trigger.entity || '').toLowerCase())
            ) || firstEntity;
            stub.trigger.entity = match;
            log.fixes.push(`Fixed workflowStub[${idx}] trigger entity → "${match}"`);
            fixed++;
          }
        }

        else if (loc.startsWith('integrationHooks[')) {
          const idx = parseInt(loc.match(/\[(\d+)\]/)?.[1] ?? '-1');
          const hook = result.integrationHooks?.[idx];
          if (hook && hook.entity && !entityNames.includes(hook.entity)) {
            hook.entity = firstEntity;
            log.fixes.push(`Fixed integrationHook[${idx}] entity → "${firstEntity}"`);
            fixed++;
          }
        }
        break;
      }

      case 'UNREGISTERED_INTEGRATION': {

        const loc = error.location;
        if (loc.startsWith('integrationHooks[')) {
          const idx = parseInt(loc.match(/\[(\d+)\]/)?.[1] ?? '-1');
          if (idx >= 0 && result.integrationHooks?.[idx]) {
            const removed = result.integrationHooks.splice(idx, 1);
            log.fixes.push(`Removed integrationHook[${idx}] with invalid integration "${removed[0]?.integration}"`);
            fixed++;
          }
        } else if (loc.startsWith('workflowStubs[')) {
          const idx = parseInt(loc.match(/\[(\d+)\]/)?.[1] ?? '-1');
          if (idx >= 0 && result.workflowStubs?.[idx]) {
            const removed = result.workflowStubs.splice(idx, 1);
            log.fixes.push(`Removed workflowStub[${idx}] with invalid integration "${removed[0]?.integration}"`);
            fixed++;
          }
        }
        break;
      }

      case 'INVALID_INTEGRATION_ACTION': {
        const idx = error.fixAction?.index;
        const integId = error.fixAction?.integration;
        if (idx != null && integId && INTEGRATION_REGISTRY[integId]) {
          const valid = INTEGRATION_REGISTRY[integId].actions.map(a => a.id);
          const hook = result.integrationHooks?.[idx];
          const preferred = valid.find(a => a.includes('payment') || a.includes('email') || a.includes('message'))
            || valid[0];
          if (preferred && hook) {
            result.integrationHooks[idx].action = preferred;
            log.fixes.push(`Set integrationHooks[${idx}].action → "${preferred}"`);
            fixed++;
          }
        }
        break;
      }

      case 'NO_API_FOR_PAGE': {

        break;
      }

      default:
        break;
    }
  }

  log.outcome = fixed > 0 ? 'repaired' : 'escalated';
  if (fixed === 0) log.reason = 'No consistency errors could be resolved deterministically';
  return { result, log };
}

export async function repairOutput(rawText, parsedData, validation, stage, userKeys, contextData = {}) {
  const intent = contextData.intent || null;
  const schema = contextData.schema || null;
  const repairLog = [];
  let current     = parsedData;
  let anyEscalated = false;

  const hasErrors     = validation.errors.length > 0;
  const structErrors  = validation.errors.filter(e => e.type === 'INVALID_STRUCTURE');
  const fieldErrors   = validation.errors.filter(e =>
    ['MISSING_FIELD','MISSING_PK','MISSING_TENANT_ID','WRONG_TYPE','INVALID_ENUM',
     'NO_API_FOR_PAGE','ADD_DEFAULT_FIELDS'].includes(e.type)
  );
  const consistErrors = validation.errors.filter(e =>
    ['INVALID_ENTITY_REF','INVALID_RELATION','UNREGISTERED_INTEGRATION',
     'INVALID_INTEGRATION_ACTION','MISSING_REVERSE_RELATION'].includes(e.type)
  );

  if (Array.isArray(current)) {
    current = normalizeParsedByStage(current, stage, intent, schema);
  }

  if (!current || structErrors.length > 0) {
    const { result, log } = structuralRepair(rawText, stage, intent, schema);
    repairLog.push(log);
    if (result) {
      current = result;
    } else {
      anyEscalated = true;
      return { result: current, repairLog, escalated: true };
    }
  }

  if (fieldErrors.length > 0) {
    const { result, log } = fieldRepair(current, fieldErrors);
    repairLog.push(log);
    current = result;
    if (log.outcome === 'escalated') anyEscalated = true;
  }

  if (consistErrors.length > 0) {
    const { result, log } = consistencyRepair(current, consistErrors, contextData);
    repairLog.push(log);
    current = result;
    if (log.outcome === 'escalated') anyEscalated = true;
  }

  if (stage === 'appspec_generation' && current) {
    current = normalizeAppSpecShape(current, intent, schema);
  }

  return { result: current, repairLog, escalated: anyEscalated };
}
