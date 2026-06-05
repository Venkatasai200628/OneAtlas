import { NextResponse } from 'next/server';
import { createJob, generateJobId, addEvent, updateJobStatus, updateJobCost, updateJobLatency, addRepairLog, getJob } from '../../../lib/jobStore.js';
import { extractIntent, generateDataSchema, generateAppSpec, attachSampleData, finalizeAppSpec } from '../../../lib/pipeline.js';
import { normalizeDataSchemaShape, normalizeAppSpecShape } from '../../../lib/schemaNormalize.js';
import { validateIntent, validateDataSchema, validateAppSpec } from '../../../lib/validation.js';
import { runRepairEngine } from '../../../lib/repair.js';
import { generateApp } from '../../../lib/codeGenerator.js';
import { saveProject } from '../../../lib/projectStore.js';
import { getAvailableProviders, setRuntimeKey, PROVIDER_DEFS } from '../../../lib/keyStore.js';
import { getUidFromAuthHeader, getEncryptedUserKeys } from '../../../lib/userServerKeys.js';
import { runLocalPipeline } from '../../../lib/localPipeline.js';
import { filterProviderKeysByPlan, getAllowedProvidersForPlan } from '../../../lib/planProviders.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, keys, templateName, orgPlan = 'explorer' } = body;
    if (!prompt?.trim()) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

    const auth = req.headers.get('authorization') || '';
    const idToken = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
    if (idToken) {
      try {
        const uid = await getUidFromAuthHeader(req);
        if (uid) {
          const storedKeys = await getEncryptedUserKeys(uid, idToken);
          if (storedKeys && typeof storedKeys === 'object') {
            for (const [provider, key] of Object.entries(storedKeys)) {
              if (PROVIDER_DEFS.find(p => p.id === provider)) {
                setRuntimeKey(provider, typeof key === 'string' ? key : '');
              }
            }
          }
        }
      } catch {}
    }

    const planFilteredKeys = filterProviderKeysByPlan(orgPlan, keys && typeof keys === 'object' ? keys : {});
    if (Object.keys(planFilteredKeys).length) {
      for (const [provider, key] of Object.entries(planFilteredKeys)) {
        if (PROVIDER_DEFS.find(p => p.id === provider)) {
          setRuntimeKey(provider, typeof key === 'string' ? key : '');
        }
      }
    }

    const allowedSet = new Set(getAllowedProvidersForPlan(orgPlan));
    if (allowedSet.size) {
      for (const def of PROVIDER_DEFS) {
        if (!allowedSet.has(def.id)) setRuntimeKey(def.id, '');
      }
    }

    const available = getAvailableProviders();
    const jobId = generateJobId();
    createJob(jobId, prompt.trim());
    updateJobStatus(jobId, 'running');

    const genOptions = {
      templateName: templateName || null,
      templateCategory: body.templateCategory || null,
      prompt: prompt.trim(),
    };
    const runner = available.length === 0 ? runLocalJob : runPipeline;
    runner(jobId, prompt.trim(), genOptions).catch(err => {
      runLocalJob(jobId, prompt.trim(), genOptions).catch(localErr => {
        updateJobStatus(jobId, 'failed', null, localErr.message || err.message);
        addEvent(jobId, 'generation_failed', { error: localErr.message || err.message, timestamp: new Date().toISOString() });
      });
    });

    return NextResponse.json({ jobId, availableProviders: available, localEngine: available.length === 0 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function runStage(jobId, stageName, fn, validator, repairStage, prevResult = null, intent = null) {
  const start = Date.now();
  addEvent(jobId, 'stage_start', { stage: stageName, timestamp: new Date().toISOString() });

  let stageResult;
  try {
    stageResult = await fn();
  } catch (err) {
    addEvent(jobId, 'stage_failed', {
      stage: stageName, error: err.message,
      timestamp: new Date().toISOString(),
    });
    throw err;
  }

  const validation = validator(stageResult.result, prevResult);
  let finalOutput = stageResult.result;
  let repairLog = [];

  if (!validation.isValid || validation.warnings.length > 0) {

    addEvent(jobId, 'repair_start', {
      stage: stageName,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      errors: validation.errors.slice(0, 5),
      timestamp: new Date().toISOString(),
    });

    const repairResult = await runRepairEngine(
      repairStage, stageResult.raw, stageResult.result, validation, prevResult, intent
    );
    repairLog = repairResult.repairLog;
    if (repairResult.output) finalOutput = repairResult.output;
    if (repairResult.cost) updateJobCost(jobId, `${stageName}_repair`, repairResult.cost);
    addRepairLog(jobId, repairLog);

    addEvent(jobId, 'repair_complete', {
      stage: stageName,
      repairLog,
      success: repairResult.output !== null,
      timestamp: new Date().toISOString(),
    });
  }

  const latencyMs = Date.now() - start;
  updateJobCost(jobId, stageName, stageResult.cost);
  updateJobLatency(jobId, stageName, latencyMs);

  if (stageName === 'schema_generation') {
    finalOutput = normalizeDataSchemaShape(finalOutput, intent);
  } else if (stageName === 'appspec_generation') {
    finalOutput = normalizeAppSpecShape(finalOutput, intent, prevResult);
    finalOutput = finalizeAppSpec(finalOutput, intent, prevResult);
  }

  const finalValidation = validator(finalOutput, prevResult);

  addEvent(jobId, 'stage_complete', {
    stage: stageName,
    timestamp: new Date().toISOString(),
    output: finalOutput,
    validation: finalValidation,
    repairLog,
    latencyMs,
    cost: stageResult.cost,
    provider: stageResult.provider,
    model: stageResult.model,
    usedFallback: stageResult.usedFallback,
    attemptLog: stageResult.attemptLog,
  });

  if (!finalValidation.isValid) {
    const schemaEmpty = stageName === 'schema_generation' && !(finalOutput?.entities?.length);
    const specEmpty = stageName === 'appspec_generation' && !(finalOutput?.pages?.length);
    const schemaRecoverable = stageName === 'schema_generation' && (finalOutput?.entities?.length || 0) >= 1;
    const specRecoverable = stageName === 'appspec_generation' && (finalOutput?.pages?.length || 0) >= 1;
    if (schemaEmpty || specEmpty) {
      throw new Error(`${stageName} failed validation after all repair attempts. Errors: ${finalValidation.errors.map(e => e.message).join('; ')}`);
    }
    if (!schemaRecoverable && !specRecoverable) {
      const blocking = finalValidation.errors.filter(e => !e.autoFixable);
      if (blocking.length > 0) {
        throw new Error(`${stageName} failed validation after all repair attempts. Errors: ${blocking.map(e => e.message).join('; ')}`);
      }
    }
  }

  return finalOutput;
}

async function runLocalJob(jobId, prompt, options = {}) {
  const result = await runLocalPipeline(prompt, (patch) => {
    const stage = patch.stage;
    if (patch.status === 'running' || patch.status === 'repairing') {
      addEvent(jobId, 'stage_start', { stage, timestamp: new Date().toISOString() });
    }
    if (patch.status === 'complete' && patch.data) {
      addEvent(jobId, 'stage_complete', {
        stage,
        timestamp: new Date().toISOString(),
        output: patch.data,
        latencyMs: patch.latency || 0,
        provider: 'oneatlas',
        model: 'local-engine',
      });
    }
  }, options);

  if (result.repairLogs?.length) addRepairLog(jobId, result.repairLogs);

  const intent = result.intent;
  const dataSchema = result.schema;
  const appSpec = result.appSpec;

  let files = {};
  let appSlug = '';
  try {
    const codeResult = generateApp(intent, dataSchema, appSpec);
    files = codeResult.files;
    appSlug = codeResult.appSlug;
  } catch {}

  const fullResult = { intent, dataSchema, appSpec, files, appSlug, localEngine: true };
  try {
    const job = getJob(jobId);
    saveProject({ jobId, intent, dataSchema, appSpec, files, appSlug, cost: job?.cost, latency: job?.latency });
  } catch {}

  updateJobStatus(jobId, 'complete', fullResult);
  addEvent(jobId, 'generation_complete', {
    timestamp: new Date().toISOString(),
    summary: {
      entities: dataSchema?.entities?.length || 0,
      pages: appSpec?.pages?.length || 0,
      endpoints: appSpec?.apiEndpoints?.length || 0,
      workflows: appSpec?.workflowStubs?.length || 0,
      files: Object.keys(files).length,
      localEngine: true,
    },
  });
}

async function runPipeline(jobId, prompt, options = {}) {

  const intent = await runStage(
    jobId, 'intent_extraction',
    () => extractIntent(prompt, options),
    (r) => validateIntent(r),
    'intent',
    null,
    null
  );

  if (intent.clarification_required && !intent.entities?.length) {
    updateJobStatus(jobId, 'complete', { intent, dataSchema: null, appSpec: null, files: null, clarification_required: true });
    addEvent(jobId, 'generation_complete', { timestamp: new Date().toISOString() });
    return;
  }
  if (intent.clarification_required) {
    intent.clarification_required = false;
  }

  let dataSchema = await runStage(
    jobId, 'schema_generation',
    () => generateDataSchema(intent, options),
    (r) => validateDataSchema(r),
    'schema',
    null,
    intent
  );

  let appSpec = await runStage(
    jobId, 'appspec_generation',
    () => generateAppSpec(intent, dataSchema, options),
    (r) => validateAppSpec(r, dataSchema),
    'appspec',
    dataSchema,
    intent
  );
  appSpec = attachSampleData(appSpec, dataSchema, prompt);

  addEvent(jobId, 'stage_start', { stage: 'code_generation', timestamp: new Date().toISOString() });
  const codeStart = Date.now();
  let files = {};
  let appSlug = '';
  let codeError = null;
  try {
    const codeResult = generateApp(intent, dataSchema, appSpec);
    files = codeResult.files;
    appSlug = codeResult.appSlug;
  } catch (err) {
    codeError = err.message;
    addEvent(jobId, 'stage_failed', { stage: 'code_generation', error: err.message, timestamp: new Date().toISOString() });
  }
  const codeMs = Date.now() - codeStart;
  updateJobLatency(jobId, 'code_generation', codeMs);
  if (!codeError) {
    addEvent(jobId, 'stage_complete', {
      stage: 'code_generation',
      timestamp: new Date().toISOString(),
      fileCount: Object.keys(files).length,
      latencyMs: codeMs,
      cost: null,
      model: 'template-engine',
      provider: 'oneatlas',
      usedFallback: false,
    });
  }

  const fullResult = { intent, dataSchema, appSpec, files, appSlug };

  try {
    const job = getJob(jobId);
    saveProject({ jobId, intent, dataSchema, appSpec, files, appSlug, cost: job?.cost, latency: job?.latency });
  } catch {}

  updateJobStatus(jobId, 'complete', fullResult);
  addEvent(jobId, 'generation_complete', {
    timestamp: new Date().toISOString(),
    summary: {
      entities:  dataSchema.entities.length,
      pages:     appSpec.pages.length,
      endpoints: appSpec.apiEndpoints.length,
      workflows: appSpec.workflowStubs.length,
      files:     Object.keys(files).length,
    },
  });
}
