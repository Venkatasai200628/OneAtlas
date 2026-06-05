
import { PROVIDERS, STAGE_ROUTING, resolveApiKey, computeCost } from './modelRouting.js';

export function safeJSON(text, fallback = {}) {
  if (!text) return fallback;
  let t = text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(t); } catch {}

  const m = t.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}

  const a = t.match(/\[[\s\S]*\]/);
  if (a) try { return JSON.parse(a[0]); } catch {}
  return fallback;
}

async function callOpenAICompat(baseUrl, apiKey, model, system, userMsg, maxTokens, temp, extraHeaders = {}) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({
      model, max_tokens: maxTokens, temperature: temp,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: userMsg }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err?.error?.message || `HTTP ${res.status}`);
    e.status = res.status; throw e;
  }
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || '{}',
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0 },
  };
}

async function callAnthropic(apiKey, model, system, userMsg, maxTokens, temp) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature: temp, system, messages: [{ role: 'user', content: userMsg }] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err?.error?.message || `HTTP ${res.status}`);
    e.status = res.status; throw e;
  }
  const data = await res.json();
  return {
    text: data.content?.[0]?.text || '{}',
    usage: { prompt_tokens: data.usage?.input_tokens || 0, completion_tokens: data.usage?.output_tokens || 0 },
  };
}

async function callGemini(apiKey, model, system, userMsg, maxTokens, temp) {
  const url = `${PROVIDERS.gemini.baseUrl}/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${system}\n\n${userMsg}` }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: temp, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err?.error?.message || `HTTP ${res.status}`);
    e.status = res.status; throw e;
  }
  const data = await res.json();
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '{}',
    usage: { prompt_tokens: data.usageMetadata?.promptTokenCount || 0, completion_tokens: data.usageMetadata?.candidatesTokenCount || 0 },
  };
}

export async function gatewayCall(stageName, system, userMsg, userKeys = {}, options = {}) {
  const routing = STAGE_ROUTING[stageName];
  if (!routing) throw new Error(`Unknown stage: ${stageName}`);

  const maxTokens = options.maxTokens || 2500;
  const temp      = options.temp ?? 0.1;
  const costLog   = [];
  const attempted = [];

  const tryProvider = async ({ provider, model }) => {
    const apiKey = resolveApiKey(provider, userKeys);
    if (!apiKey) {
      attempted.push({ provider, model, skipped: true, reason: 'no_api_key' });
      return null;
    }

    try {
      let result;
      if (provider === 'anthropic') {
        result = await callAnthropic(apiKey, model, system, userMsg, maxTokens, temp);
      } else if (provider === 'gemini' || provider === 'google_ai') {
        result = await callGemini(apiKey, model, system, userMsg, maxTokens, temp);
      } else {
        const extraHeaders = provider === 'openrouter'
          ? { 'HTTP-Referer': 'https://oneatlas.app', 'X-Title': 'One Atlas' }
          : {};
        result = await callOpenAICompat(PROVIDERS[provider].baseUrl, apiKey, model, system, userMsg, maxTokens, temp, extraHeaders);
      }
      const cost = computeCost(model, result.usage.prompt_tokens, result.usage.completion_tokens);
      costLog.push({ provider, model, ...cost });
      attempted.push({ provider, model, success: true });
      return { text: result.text, costLog, attempted };
    } catch (e) {

      const status = e.status;
      const reason =
        status === 402 ? 'insufficient_balance' :
        status === 429 ? 'rate_limited' :
        status === 401 ? 'invalid_api_key' :
        status === 403 ? 'forbidden' :
        status === 400 ? 'bad_request' :
        (status >= 500 && status < 600) ? 'server_error' :
        'network_error';

      console.warn(`[Gateway] ${provider}/${model} failed — ${reason} (${status ?? 'net'}): ${e.message} → trying next provider`);
      attempted.push({ provider, model, error: e.message, status, reason });

      return null;
    }
  };

  const providerOrder = [routing.primary, routing.fallback, routing.universal_fallback];

  for (const providerConfig of providerOrder) {
    const result = await tryProvider(providerConfig);
    if (result) return result;
  }

  const configuredAny = providerOrder.some(p => resolveApiKey(p.provider, userKeys));
  if (!configuredAny) {
    throw new Error(
      `No API keys configured for stage "${stageName}". ` +
      `Need at least one of: ${providerOrder.map(p => p.provider).join(', ')}. ` +
      `Go to Settings → AI Provider API Keys to add your keys.`
    );
  }

  const summary = attempted
    .filter(a => !a.skipped)
    .map(a => `${a.provider}/${a.model?.split('/').pop()} → ${a.reason || a.error || 'unknown'}`)
    .join(';  ');
  throw new Error(
    `All providers failed for stage "${stageName}". ` +
    `Tried: ${summary}. ` +
    `Add more keys in Settings (OpenRouter works as a universal fallback).`
  );
}
