/** Which AI providers unlock per organisation plan (monthly subscription). */

export const PLAN_PROVIDER_ACCESS = {
  explorer: [],
  studio: ['openrouter', 'groq', 'gemini', 'google_ai', 'mistral'],
  scale: ['openrouter', 'groq', 'gemini', 'google_ai', 'mistral', 'deepseek', 'openai'],
  orbit: ['openrouter', 'groq', 'gemini', 'google_ai', 'mistral', 'deepseek', 'openai', 'anthropic'],
};

export const PLAN_LABELS = {
  explorer: 'Explorer (local engine only)',
  studio: 'Studio — OpenRouter, Groq, Google, Mistral',
  scale: 'Scale — Studio providers + DeepSeek & OpenAI',
  orbit: 'Orbit — all providers including Anthropic',
};

export function getAllowedProvidersForPlan(plan = 'explorer') {
  return PLAN_PROVIDER_ACCESS[plan] || [];
}

export function filterProviderKeysByPlan(plan, keys = {}) {
  const allowed = new Set(getAllowedProvidersForPlan(plan));
  if (!allowed.size) return {};
  const out = {};
  for (const [id, value] of Object.entries(keys)) {
    if (allowed.has(id) && typeof value === 'string' && value.trim()) {
      out[id] = value.trim();
    }
  }
  return out;
}

export function isProviderAllowedForPlan(plan, providerId) {
  return getAllowedProvidersForPlan(plan).includes(providerId);
}
