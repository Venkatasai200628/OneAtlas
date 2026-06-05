import { NextResponse } from 'next/server';
import { getEffectiveKey } from '../../../../lib/keyStore.js';

const ENDPOINTS = {
  openai:     { url: 'https://api.openai.com/v1/chat/completions',                        type: 'openai' },
  anthropic:  { url: 'https://api.anthropic.com/v1/messages',                             type: 'anthropic' },
  groq:       { url: 'https://api.groq.com/openai/v1/chat/completions',                   type: 'openai' },
  gemini:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', type: 'openai' },
  deepseek:   { url: 'https://api.deepseek.com/v1/chat/completions',                      type: 'openai' },
  mistral:    { url: 'https://api.mistral.ai/v1/chat/completions',                        type: 'openai' },
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions',                     type: 'openai' },
  google_ai:  { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', type: 'openai' },
};

const TEST_MODELS = {
  openai: 'gpt-4o-mini', anthropic: 'claude-haiku-4-5-20251001',
  groq: 'llama-3.3-70b-versatile', gemini: 'gemini-1.5-flash',
  deepseek: 'deepseek-chat', mistral: 'mistral-7b-instruct',
  openrouter: 'openrouter/auto', google_ai: 'gemini-1.5-flash',
};

export async function POST(req) {
  try {
    const { provider } = await req.json();
    const key = getEffectiveKey(provider);
    if (!key) return NextResponse.json({ ok: false, error: 'No API key configured' });

    const ep = ENDPOINTS[provider];
    if (!ep) return NextResponse.json({ ok: false, error: 'Unknown provider' });

    const model = TEST_MODELS[provider];
    let headers, body;

    if (ep.type === 'anthropic') {
      headers = { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' };
      body = JSON.stringify({ model, max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] });
    } else {
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      if (provider === 'openrouter') { headers['HTTP-Referer'] = 'https://oneatlas.app'; headers['X-Title'] = 'OneAtlas'; }
      body = JSON.stringify({ model, max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] });
    }

    const start = Date.now();
    const res = await fetch(ep.url, { method: 'POST', headers, body });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return NextResponse.json({ ok: true, latencyMs, model });
    } else {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ ok: false, error: err?.error?.message || `HTTP ${res.status}`, latencyMs });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
