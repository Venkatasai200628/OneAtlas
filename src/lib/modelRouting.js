
export const PROVIDERS = {
  openai:    { name: 'OpenAI',        envKey: 'VITE_OPENAI_API_KEY',    baseUrl: 'https://api.openai.com/v1/chat/completions' },
  anthropic: { name: 'Anthropic',     envKey: 'VITE_ANTHROPIC_API_KEY', baseUrl: 'https://api.anthropic.com/v1/messages' },
  groq:      { name: 'Groq',          envKey: 'VITE_GROQ_API_KEY',      baseUrl: 'https://api.groq.com/openai/v1/chat/completions' },
  gemini:    { name: 'Google Gemini', envKey: 'VITE_GEMINI_API_KEY',    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models' },
  google_ai: { name: 'Google AI',     envKey: 'VITE_GOOGLE_AI_API_KEY', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models' },
  deepseek:  { name: 'DeepSeek',      envKey: 'VITE_DEEPSEEK_API_KEY',  baseUrl: 'https://api.deepseek.com/v1/chat/completions' },
  openrouter:{ name: 'OpenRouter',    envKey: 'VITE_OPENROUTER_API_KEY',baseUrl: 'https://openrouter.ai/api/v1/chat/completions' },
  mistral:   { name: 'Mistral',       envKey: 'VITE_MISTRAL_API_KEY',   baseUrl: 'https://api.mistral.ai/v1/chat/completions' },
};

export const COST_TABLE = {
  'gpt-4o':                  { input: 0.005,  output: 0.015 },
  'gpt-4o-mini':             { input: 0.00015,output: 0.0006 },
  'claude-sonnet-4-20250514':{ input: 0.003,  output: 0.015 },
  'claude-haiku-4-5-20251001':{ input: 0.00025,output: 0.00125 },
  'llama-3.3-70b-versatile': { input: 0.00059,output: 0.00079 },
  'llama-3.1-8b-instant':    { input: 0.00005,output: 0.00008 },
  'gemini-1.5-flash':        { input: 0.000075,output: 0.0003 },
  'gemini-1.5-pro':          { input: 0.00125,output: 0.005 },
  'deepseek-chat':           { input: 0.00014,output: 0.00028 },
  'mistral-large-latest':    { input: 0.003,  output: 0.009 },
  'mistral-7b-instruct':     { input: 0.00025,output: 0.00025 },
  'openrouter/auto':         { input: 0.002,  output: 0.006 },
};

export const STAGE_ROUTING = {
  intent_extraction: {
    tier: 'fast',
    primary:  { provider: 'groq',     model: 'llama-3.3-70b-versatile' },
    fallback: { provider: 'openai',   model: 'gpt-4o-mini' },
    universal_fallback: { provider: 'openrouter', model: 'openrouter/auto' },
  },
  schema_generation: {
    tier: 'capable',
    primary:  { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    fallback: { provider: 'openai',    model: 'gpt-4o' },
    universal_fallback: { provider: 'openrouter', model: 'openrouter/auto' },
  },
  appspec_generation: {
    tier: 'capable',
    primary:  { provider: 'openai',   model: 'gpt-4o' },
    fallback: { provider: 'deepseek', model: 'deepseek-chat' },
    universal_fallback: { provider: 'openrouter', model: 'openrouter/auto' },
  },
  repair_fast: {
    tier: 'fast',
    primary:  { provider: 'groq',   model: 'llama-3.3-70b-versatile' },
    fallback: { provider: 'mistral',model: 'mistral-7b-instruct' },
    universal_fallback: { provider: 'openrouter', model: 'openrouter/auto' },
  },
  repair_capable: {
    tier: 'capable',
    primary:  { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    fallback: { provider: 'openai',    model: 'gpt-4o' },
    universal_fallback: { provider: 'openrouter', model: 'openrouter/auto' },
  },
};

export function resolveApiKey(provider, userKeys = {}) {
  return userKeys[provider] || import.meta.env[PROVIDERS[provider]?.envKey] || null;
}

export function computeCost(model, inputTokens, outputTokens) {
  const rates = COST_TABLE[model] || { input: 0.002, output: 0.006 };
  return {
    inputTokens,
    outputTokens,
    inputCost: (inputTokens / 1000) * rates.input,
    outputCost: (outputTokens / 1000) * rates.output,
    totalCost: (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output,
  };
}
