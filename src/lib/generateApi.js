
import { runLocalPipeline, runPlanPipeline } from '@/lib/localPipeline';
import { filterProviderKeysByPlan, getAllowedProvidersForPlan } from '../../lib/planProviders.js';
import { auth, ensureFirebase } from '@/lib/firebase';

function hasAnyProviderKey(keys = {}) {
  return Object.values(keys).some(k => typeof k === 'string' && k.trim().length > 0);
}

const API_BASE = '';

async function buildAuthHeaders() {
  await ensureFirebase();
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function syncProviderKeys(providerKeys = {}) {
  const authHeaders = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ keys: providerKeys }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to sync API keys (${res.status})`);
  }
  return res.json();
}

export async function fetchSettings() {
  const authHeaders = await buildAuthHeaders();
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: 'GET',
    headers: { ...authHeaders },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load settings (${res.status})`);
  }
  return res.json();
}

function mapStageId(stage) {
  if (stage === 'intent_extraction') return 'intent_extraction';
  if (stage === 'schema_generation') return 'schema_generation';
  if (stage === 'appspec_generation') return 'appspec_generation';
  return stage;
}

function emitProgress(onProgress, patch) {
  if (onProgress) onProgress(patch);
}

function handleJobEvent(event, ctx) {
  const { type, data } = event;
  const stage = mapStageId(data?.stage);

  switch (type) {
    case 'stage_start':
      emitProgress(ctx.onProgress, {
        stage,
        status: 'running',
        message: `Running ${stage?.replace(/_/g, ' ')}…`,
      });
      break;

    case 'repair_start':
      emitProgress(ctx.onProgress, {
        stage,
        status: 'repairing',
        message: `Repair engine: ${data.errorCount || 0} error(s) — ${(data.errors || []).slice(0, 2).map(e => e.message || e).join('; ')}`,
      });
      ctx.repairLogs.push({
        stage,
        strategy: 'pending',
        outcome: 'in_progress',
        fixes: [],
        errors: data.errors,
      });
      break;

    case 'repair_complete':
      if (Array.isArray(data.repairLog)) {
        ctx.repairLogs.push(...data.repairLog.map(r => ({ ...r, stage })));
      }
      emitProgress(ctx.onProgress, {
        stage,
        status: data.success ? 'running' : 'repairing',
        message: data.success
          ? `Repaired ${stage} — re-validating`
          : `Repair escalated on ${stage}`,
      });
      break;

    case 'stage_complete': {
      const key = stage === 'intent_extraction' ? 'intent'
        : stage === 'schema_generation' ? 'schema'
          : stage === 'appspec_generation' ? 'appSpec' : null;
      if (key && data.output) ctx.outputs[key] = data.output;
      if (data.attemptLog) {
        emitProgress(ctx.onProgress, {
          stage,
          status: 'complete',
          data: data.output,
          latency: data.latencyMs,
          attempted: data.attemptLog,
        });
      } else {
        emitProgress(ctx.onProgress, {
          stage,
          status: 'complete',
          data: data.output,
          latency: data.latencyMs,
          provider: data.provider ? { provider: data.provider, model: data.model, success: true } : undefined,
        });
      }
      break;
    }

    case 'stage_failed':
      emitProgress(ctx.onProgress, {
        stage,
        status: 'error',
        message: data.error,
      });
      break;

    case 'generation_failed':
      ctx.failed = data.error || 'Generation failed';
      break;

    default:
      break;
  }
}

async function fetchJob(jobId) {
  const res = await fetch(`${API_BASE}/api/generate/${jobId}`);
  if (!res.ok) throw new Error('Failed to load job result');
  return res.json();
}

export async function generateWithSSE(prompt, providerKeys = {}, onProgress, options = {}) {
  const trimmed = (prompt || '').trim();
  if (!trimmed) {
    return { status: 'error', error: 'Please enter a description for your app.' };
  }

  if (options.mode === 'plan') {
    emitProgress(onProgress, {
      stage: 'intent_extraction',
      status: 'running',
      message: 'Plan mode — generating architecture (no preview yet)…',
    });
    return runPlanPipeline(trimmed, onProgress, options);
  }

  const orgPlan = options.orgPlan || 'explorer';
  const allowedKeys = filterProviderKeysByPlan(orgPlan, providerKeys);
  const allowedList = getAllowedProvidersForPlan(orgPlan);

  if (!hasAnyProviderKey(allowedKeys)) {
    const planHint = orgPlan === 'explorer'
      ? 'Upgrade to Studio ($24) in Settings → Organisation for AI providers (Groq, OpenRouter, Google, Mistral).'
      : `Add API keys for: ${allowedList.join(', ') || 'your plan providers'} in Settings → API Keys.`;
    emitProgress(onProgress, {
      stage: 'intent_extraction',
      status: 'running',
      message: `Using local engine. ${planHint}`,
    });
    const local = await runLocalPipeline(trimmed, onProgress, options);
    return { ...local, localEngine: true, planHint };
  }

  try {
    await syncProviderKeys(allowedKeys).catch(() => {});
    const authHeaders = await buildAuthHeaders();

    const startRes = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        prompt: trimmed,
        keys: allowedKeys,
        templateName: options.templateName || null,
        templateCategory: options.templateCategory || null,
        orgPlan,
      }),
    });
    const startText = await startRes.text();
    let startBody;
    try {
      startBody = JSON.parse(startText);
    } catch {
      throw new Error('Generation API unavailable — start npm run dev (API on :3000). Using local engine.');
    }
    if (!startRes.ok) {
      if (startBody.code === 'NO_KEYS') {
        const local = await runLocalPipeline(trimmed, onProgress, options);
        return { ...local, localEngine: true };
      }
      throw new Error(startBody.error || 'Failed to start generation');
    }

    const { jobId } = startBody;
    const ctx = {
      onProgress,
      outputs: {},
      repairLogs: [],
      failed: null,
    };

    await new Promise((resolve, reject) => {
      const es = new EventSource(`${API_BASE}/api/generate/${jobId}/stream`);
      const timeout = setTimeout(() => {
        es.close();
        reject(new Error('SSE timeout'));
      }, 45000);

      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          handleJobEvent(event, ctx);
          if (event.type === 'generation_complete' || event.type === 'generation_failed') {
            clearTimeout(timeout);
            es.close();
            resolve();
          }
        } catch (e) {
          console.warn('SSE parse error', e);
        }
      };

      es.onerror = () => {
        clearTimeout(timeout);
        es.close();
        reject(new Error('SSE connection lost'));
      };
    });

    const job = await fetchJob(jobId);

    if (job.status === 'failed' || ctx.failed) {
      const partial = ctx.outputs.intent && ctx.outputs.schema && ctx.outputs.appSpec;
      if (partial) {
        const totalLatency = Object.values(job.latency || {}).reduce((a, b) => a + (b || 0), 0);
        return {
          status: 'complete',
          intent: ctx.outputs.intent,
          schema: ctx.outputs.schema,
          appSpec: ctx.outputs.appSpec,
          repairLogs: [...(job.repairLog || []), ...ctx.repairLogs],
          validations: {},
          totalCostUSD: job.cost?.totalUsd ?? 0,
          latency: totalLatency,
          jobId,
        };
      }
      console.warn('Server job failed — local engine fallback:', job.error || ctx.failed);
      const local = await runLocalPipeline(trimmed, onProgress, options);
      return { ...local, localEngine: true };
    }

    const result = job.result || {};
    const intent = result.intent || ctx.outputs.intent;
    const schema = result.dataSchema || ctx.outputs.schema;
    const appSpec = result.appSpec || ctx.outputs.appSpec;

    const totalLatency = Object.values(job.latency || {}).reduce((a, b) => a + (b || 0), 0);
    const totalCostUSD = job.cost?.totalUsd ?? 0;

    return {
      status: result.clarification_required ? 'clarification' : 'complete',
      intent,
      schema,
      appSpec,
      files: result.files,
      appSlug: result.appSlug,
      repairLogs: [...(job.repairLog || []), ...ctx.repairLogs],
      validations: {},
      costLog: job.cost?.stages || {},
      totalCostUSD,
      latency: totalLatency,
      clarification_required: result.clarification_required,
      jobId,
    };
  } catch (apiErr) {
    console.warn('Server pipeline unavailable, using local engine:', apiErr.message);
    emitProgress(onProgress, {
      stage: 'intent_extraction',
      status: 'running',
      message: 'Using OneAtlas local engine…',
    });
    const local = await runLocalPipeline(trimmed, onProgress, options);
    return { ...local, localEngine: true };
  }
}
