
/**
 * Deterministic checks for Evaluation prompts (#4–12) without calling live AI APIs.
 */
import { EVAL_PROMPTS } from './eval-prompts-data.mjs';
import { normalizeDataSchemaShape, normalizeAppSpecShape } from '../lib/schemaNormalize.js';
import { finalizeAppSpec } from '../lib/pipeline.js';
import { validateDataSchema, validateAppSpec } from '../lib/validation.js';
import { bootstrapVagueIntent } from '../src/lib/pipeline.js';

let passed = 0;
let failed = 0;

function assert(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log('\n── Eval fixture normalization (no API) ──\n');

for (const item of EVAL_PROMPTS) {
  const bootClient = bootstrapVagueIntent(item.prompt);
  const entities = bootClient?.entities || ['User', 'Record', 'Activity'];
  const intent = {
    appName: bootClient?.appName || item.label,
    appType: bootClient?.appType || 'custom',
    features: bootClient?.features || ['dashboard'],
    entities,
    integrations_requested: bootClient?.integrations_requested || [],
  };

  const schema = normalizeDataSchemaShape({}, intent);
  const spec = finalizeAppSpec(
    normalizeAppSpecShape({ pages: [], apiEndpoints: [], integrationHooks: [], workflowStubs: [] }, intent, schema),
    intent,
    schema
  );

  const sv = validateDataSchema(schema);
  const av = validateAppSpec(spec, schema);
  assert(
    `#${item.id} ${item.label}: schema valid`,
    sv.isValid,
    sv.errors?.map(e => e.message).join('; ')
  );
  assert(
    `#${item.id} ${item.label}: appspec valid`,
    av.isValid,
    av.errors?.map(e => e.message).join('; ')
  );
  assert(`#${item.id} ${item.label}: has pages`, (spec.pages?.length || 0) >= 1);
}

console.log(`\n── Summary: ${passed} passed, ${failed} failed ──\n`);
process.exit(failed > 0 ? 1 : 0);
