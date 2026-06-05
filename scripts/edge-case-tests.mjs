
import { bootstrapVagueIntent } from '../src/lib/pipeline.js';
import { validateIntent, validateSchema, validateAppSpec } from '../src/lib/validation.js';
import { repairOutput } from '../src/lib/repairEngine.js';
import {
  normalizeDataSchemaShape,
  normalizeAppSpecShape,
  normalizeParsedByStage,
} from '../src/lib/schemaNormalize.js';
import {
  normalizeDataSchemaShape as serverNormalizeSchema,
  normalizeAppSpecShape as serverNormalizeAppSpec,
} from '../lib/schemaNormalize.js';
import { validateDataSchema, validateAppSpec as serverValidateAppSpec } from '../lib/validation.js';
import { generateAllSampleData } from '../src/lib/sampleDataGenerator.js';
import { INTEGRATION_REGISTRY } from '../src/lib/integrationRegistry.js';

const EVAL_PROMPTS = [
  { id: 7, label: 'Vague', prompt: 'make an app' },
  { id: 11, label: 'Minimal SaaS', prompt: 'Build a SaaS' },
  { id: 1, label: 'CRM', prompt: 'Build a CRM with customers and deals' },
  { id: 're', label: 'Real estate CRM', prompt: 'Build a real estate CRM with leads, properties, and deals' },
  { id: '', label: 'Empty', prompt: '' },
  { id: 'ws', label: 'Whitespace', prompt: '   \n\t  ' },
  { id: 'xss', label: 'Special chars', prompt: 'Build app with <script>alert(1)</script> and "quotes"' },
  { id: 'long', label: 'Long', prompt: 'Build a CRM '.repeat(200) },
  { id: 'unknown-int', label: 'Bad integrations', prompt: 'app with fakeintegration99 and slack' },
  { id: 'sample5', label: 'Sample count', prompt: 'generate 5 random users for a blog' },
];

let passed = 0;
let failed = 0;

function assert(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n── Bootstrap / vague prompts ──');
for (const t of EVAL_PROMPTS) {
  const boot = bootstrapVagueIntent(t.prompt);
  const words = (t.prompt || '').trim().split(/\s+/).filter(w => w.replace(/[^a-z0-9]/gi, '').length > 2).length;
  if (!t.prompt?.trim() || words < 6) {
    assert(`${t.label}: bootstrap returns intent`, !!boot?.appName, JSON.stringify(boot));
    if (boot) {
      const v = validateIntent(boot);
      assert(`${t.label}: bootstrap validates`, v.isValid, v.errors?.map(e => e.message).join('; '));
    }
  } else {
    assert(`${t.label}: no bootstrap (enough words)`, boot === null);
  }
}

console.log('\n── Validation edge cases ──');
assert('null intent invalid', !validateIntent(null).isValid);
assert('array intent invalid', !validateIntent([]).isValid);
assert('missing appName auto-fixable', validateIntent({ appType: 'custom', features: [], entities: [] }).errors.some(e => e.autoFixable));

const malformedIntent = { appName: 'Test', appType: 'custom', features: 'not-array', entities: ['User'] };
const repaired = await repairOutput(JSON.stringify(malformedIntent), malformedIntent, validateIntent(malformedIntent), 'intent_extraction', {});
assert('field repair coerces features', Array.isArray(repaired.result?.features));

console.log('\n── Schema shape normalization (client) ──');
const crmIntent = { appName: 'CRM', appType: 'crm', features: [], entities: ['Lead', 'Property', 'Deal'] };
const bareArray = [{
  name: 'Lead',
  tableName: 'leads',
  fields: [
    { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isUnique: true, isRelation: false },
    { name: 'tenantId', type: 'uuid', nullable: false, isPrimary: false, isUnique: false, isRelation: false },
  ],
  relations: [],
}];
const fromArray = normalizeDataSchemaShape(bareArray, crmIntent);
assert('bare array → { entities }', Array.isArray(fromArray.entities) && fromArray.entities.length >= 1);
const nested = normalizeDataSchemaShape({ data: { entities: bareArray } }, crmIntent);
assert('nested data.entities', nested.entities?.length >= 1);
const emptyWithIntent = normalizeDataSchemaShape({}, crmIntent);
assert('empty schema + intent fills entities', emptyWithIntent.entities.length >= 3, `got ${emptyWithIntent.entities.length}`);

console.log('\n── Schema shape normalization (server) ──');
const serverFromArray = serverNormalizeSchema(bareArray, crmIntent);
assert('server bare array', Array.isArray(serverFromArray.entities));
const serverVal = validateDataSchema(JSON.parse(JSON.stringify(bareArray)));
assert('server validateDataSchema accepts array coercion', serverVal.isValid, serverVal.errors?.map(e => e.message).join('; '));

console.log('\n── AppSpec shape normalization ──');
const pagesOnly = [
  { name: 'Leads', route: '/leads', layout: 'dashboard', boundEntity: 'Lead' },
  { name: 'Properties', route: '/properties', layout: 'dashboard', boundEntity: 'Property' },
];
const specFromPages = normalizeAppSpecShape(pagesOnly, crmIntent, emptyWithIntent);
assert('pages-only array → object', Array.isArray(specFromPages.pages) && specFromPages.pages.length === 2);
const objectAuth = normalizeAppSpecShape(
  { pages: pagesOnly, authRules: { roles: [{ name: 'admin' }, { name: 'user' }] } },
  crmIntent,
  emptyWithIntent
);
assert('object authRules keeps roles array', Array.isArray(objectAuth.authRules?.roles) && objectAuth.authRules.roles.length >= 2);
const serverSpec = serverNormalizeAppSpec(pagesOnly, crmIntent, emptyWithIntent);
const serverSpecVal = serverValidateAppSpec(serverSpec, emptyWithIntent);
assert('server appspec validates after normalize', serverSpecVal.isValid || serverSpecVal.errors.every(e => e.autoFixable),
  serverSpecVal.errors?.map(e => e.message).join('; '));

console.log('\n── normalizeParsedByStage ──');
assert('stage schema_generation', normalizeParsedByStage(bareArray, 'schema_generation', crmIntent).entities?.length >= 1);
assert('stage appspec_generation', normalizeParsedByStage(pagesOnly, 'appspec_generation', crmIntent, emptyWithIntent).pages?.length === 2);

console.log('\n── Schema minimum ──');
const minSchema = {
  entities: [{
    name: 'User', tableName: 'users',
    fields: [
      { name: 'id', type: 'uuid', required: true },
      { name: 'tenantId', type: 'string', required: true },
    ],
    relations: [],
  }],
};
const schemaVal = validateSchema(minSchema);
assert('min schema valid structure', schemaVal.isValid, schemaVal.errors?.map(e => e.message).join('; '));

console.log('\n── Sample data ──');
const sampleSchema = normalizeDataSchemaShape(
  [{ name: 'User', tableName: 'users', fields: [{ name: 'id', type: 'uuid', required: true }, { name: 'email', type: 'string', required: true }], relations: [] }],
  { entities: ['User'] }
);
const samples = generateAllSampleData(sampleSchema, 5);
assert('generate 5 users', samples?.User?.length === 5, `got ${samples?.User?.length}`);

console.log('\n── E-commerce / Stripe coercion ──');
const ecommerceIntent = {
  appName: 'Shop',
  appType: 'ecommerce',
  features: ['catalog', 'cart'],
  entities: ['Product', 'Order', 'Cart'],
  integrations_requested: ['stripe', 'gmail'],
};
const ecommerceSchema = normalizeDataSchemaShape({}, ecommerceIntent);
const rawEcomSpec = {
  pages: [{
    name: 'Checkout',
    route: '/checkout',
    layout: 'detail',
    boundEntity: 'Order',
    components: [{ type: 'stripe_checkout', id: 'pay', boundEntity: 'Order', props: {} }],
  }],
  apiEndpoints: [{ path: '/api/orders', method: 'GET', description: 'List orders', boundEntity: 'Order', authRequired: true, rateLimit: false }],
  authRules: [{ role: 'admin', permissions: { Order: { read: true, write: true, delete: true } } }],
  integrationHooks: [{ integrationId: 'stripe', action: 'create_payment_intent', trigger: { entity: 'Order', event: 'created' } }],
  workflowStubs: [],
};
const ecomNorm = normalizeAppSpecShape(rawEcomSpec, ecommerceIntent, ecommerceSchema);
assert('stripe_checkout → card', ecomNorm.pages[0].components[0].type === 'card');
assert('create_payment_intent valid on client', INTEGRATION_REGISTRY.stripe.actions.some(a => a.id === 'create_payment_intent'));

const serverEcom = serverNormalizeAppSpec(rawEcomSpec, ecommerceIntent, ecommerceSchema);
const serverEcomVal = serverValidateAppSpec(serverEcom, ecommerceSchema);
assert('server ecom appspec validates', serverEcomVal.isValid, serverEcomVal.errors?.map(e => e.message).join('; '));

console.log('\n── AppSpec integration filter ──');
const fakeSpec = {
  pages: [{ name: 'Home', route: '/', layout: 'dashboard' }],
  apiEndpoints: [],
  authRules: { roles: [{ name: 'admin' }, { name: 'user' }] },
  integrationHooks: [{ integration: 'not_real_xyz' }, { integration: 'slack' }],
  workflowStubs: [],
  appPreview: { sidebar: [{ label: 'Home', route: '/' }] },
};
const schema = minSchema;
const specVal = validateAppSpec(fakeSpec, schema);
assert('unregistered integration flagged', specVal.errors.some(e => e.type?.includes('INTEGRATION') || e.message?.includes('integration')));

console.log(`\n── Summary: ${passed} passed, ${failed} failed ──\n`);
process.exit(failed > 0 ? 1 : 0);
