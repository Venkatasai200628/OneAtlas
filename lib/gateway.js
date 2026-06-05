
import { getEffectiveKey, getAvailableProviders } from './keyStore.js';

export const COST_TABLE = {
  'gpt-4o':                    { input: 0.005,   output: 0.015   },
  'gpt-4o-mini':               { input: 0.00015, output: 0.0006  },
  'claude-sonnet-4-20250514':  { input: 0.003,   output: 0.015   },
  'claude-haiku-4-5-20251001': { input: 0.00025, output: 0.00125 },
  'llama-3.3-70b-versatile':   { input: 0.00059, output: 0.00079 },
  'mixtral-8x7b-32768':        { input: 0.00024, output: 0.00024 },
  'gemini-1.5-flash':          { input: 0.000075,output: 0.0003  },
  'gemini-1.5-pro':            { input: 0.00125, output: 0.005   },
  'deepseek-chat':             { input: 0.00014, output: 0.00028 },
  'mistral-large-latest':      { input: 0.003,   output: 0.009   },
  'mistral-7b-instruct':       { input: 0.00025, output: 0.00025 },
  'openrouter/auto':           { input: 0.002,   output: 0.006   },
};

export const ROUTING_CONFIG = {
  intent_extraction: {
    primary:  { provider: 'groq',      model: 'llama-3.3-70b-versatile'  },
    fallbacks:[
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
      { provider: 'openai',    model: 'gpt-4o-mini'               },
      { provider: 'mistral',   model: 'mistral-7b-instruct'        },
      { provider: 'gemini',    model: 'gemini-1.5-flash'           },
      { provider: 'openrouter',model: 'openrouter/auto'            },
    ],
  },
  schema_generation: {
    primary:  { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    fallbacks:[
      { provider: 'openai',    model: 'gpt-4o'           },
      { provider: 'deepseek',  model: 'deepseek-chat'    },
      { provider: 'gemini',    model: 'gemini-1.5-pro'   },
      { provider: 'groq',      model: 'llama-3.3-70b-versatile' },
      { provider: 'openrouter',model: 'openrouter/auto'  },
    ],
  },
  appspec_generation: {
    primary:  { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    fallbacks:[
      { provider: 'openai',    model: 'gpt-4o'           },
      { provider: 'deepseek',  model: 'deepseek-chat'    },
      { provider: 'gemini',    model: 'gemini-1.5-pro'   },
      { provider: 'groq',      model: 'llama-3.3-70b-versatile' },
      { provider: 'openrouter',model: 'openrouter/auto'  },
    ],
  },
  repair_fast: {
    primary:  { provider: 'groq',     model: 'llama-3.3-70b-versatile' },
    fallbacks:[
      { provider: 'openai',    model: 'gpt-4o-mini'      },
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
      { provider: 'openrouter',model: 'openrouter/auto'  },
    ],
  },
  repair_capable: {
    primary:  { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    fallbacks:[
      { provider: 'openai',    model: 'gpt-4o'           },
      { provider: 'groq',      model: 'llama-3.3-70b-versatile' },
      { provider: 'openrouter',model: 'openrouter/auto'  },
    ],
  },
};

const ENDPOINTS = {
  openai:     'https://api.openai.com/v1/chat/completions',
  anthropic:  'https://api.anthropic.com/v1/messages',
  groq:       'https://api.groq.com/openai/v1/chat/completions',
  gemini:     'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  deepseek:   'https://api.deepseek.com/v1/chat/completions',
  mistral:    'https://api.mistral.ai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  google_ai:  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
};

function estimateCost(model, inputTokens, outputTokens) {
  const rates = COST_TABLE[model] || { input: 0.002, output: 0.006 };
  return {
    input_tokens:  inputTokens,
    output_tokens: outputTokens,
    usd: ((inputTokens / 1000) * rates.input) + ((outputTokens / 1000) * rates.output),
  };
}

async function callProvider(provider, model, systemPrompt, userMessage, maxTokens = 3000, temperature = 0.1) {
  const apiKey = getEffectiveKey(provider);
  if (!apiKey) {
    const err = new Error(`No API key for provider: ${provider}`);
    err.noKey = true;
    throw err;
  }

  let url, headers, body;

  if (provider === 'anthropic') {
    url = ENDPOINTS.anthropic;
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    body = JSON.stringify({
      model, max_tokens: maxTokens, temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
  } else {
    url = ENDPOINTS[provider] || ENDPOINTS.openai;
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://oneatlas.app';
      headers['X-Title'] = 'OneAtlas';
    }
    body = JSON.stringify({
      model, max_tokens: maxTokens, temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
    });
  }

  const res = await fetch(url, { method: 'POST', headers, body });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    const retryable = res.status === 429 || res.status >= 500;
    throw Object.assign(new Error(`[${provider}/${model}] ${msg}`), { retryable, status: res.status, provider, model });
  }

  const data = await res.json();
  let content;
  if (provider === 'anthropic') {
    content = data.content?.[0]?.text || '{}';
  } else {
    content = data.choices?.[0]?.message?.content || '{}';
  }

  const usage = data.usage || {};
  const inputTokens  = usage.input_tokens  || usage.prompt_tokens     || Math.ceil(userMessage.length / 4);
  const outputTokens = usage.output_tokens || usage.completion_tokens || Math.ceil(content.length / 4);

  return {
    content,
    usage: estimateCost(model, inputTokens, outputTokens),
    provider,
    model,
    usedFallback: false,
  };
}

export async function gatewayCall(stage, systemPrompt, userMessage, maxTokens = 3000, temperature = 0.1) {
  const route = ROUTING_CONFIG[stage] || ROUTING_CONFIG.appspec_generation;
  const allOptions = [route.primary, ...route.fallbacks];
  const attemptLog = [];
  let lastError = null;

  for (let i = 0; i < allOptions.length; i++) {
    const { provider, model } = allOptions[i];
    const isFallback = i > 0;

    if (!getEffectiveKey(provider)) {
      attemptLog.push({ provider, model, skipped: true, reason: 'no_key' });
      continue;
    }

    try {
      const result = await callProvider(provider, model, systemPrompt, userMessage, maxTokens, temperature);
      result.usedFallback = isFallback;
      result.attemptLog = attemptLog;
      result.attemptLog.push({ provider, model, success: true });
      return result;
    } catch (err) {
      lastError = err;
      attemptLog.push({
        provider, model,
        failed: true,
        reason: err.noKey ? 'no_key' : err.message,
        status: err.status,
        retryable: !!err.retryable,
      });

      if (!err.retryable && !err.noKey) {

      }
    }
  }

  const availableProviders = getAvailableProviders();
  throw new Error(
    availableProviders.length === 0
      ? 'No API keys configured. Add at least one provider key in Settings.'
      : `All providers failed. Attempted: ${attemptLog.map(a => a.provider).join(', ')}. Last error: ${lastError?.message}`
  );
}

export function safeJSON(text, fallback = {}) {
  if (!text) return fallback;
  let t = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
  try { return JSON.parse(t); } catch {}

  const match = t.match(/\{[\s\S]*\}/);
  if (match) try { return JSON.parse(match[0]); } catch {}

  const arrMatch = t.match(/\[[\s\S]*\]/);
  if (arrMatch) try { return JSON.parse(arrMatch[0]); } catch {}
  return fallback;
}
