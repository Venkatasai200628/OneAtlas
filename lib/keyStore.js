
const runtimeKeys = new Map();

export const PROVIDER_DEFS = [
  { id: 'openai',     label: 'OpenAI',       envVar: 'OPENAI_API_KEY',     placeholder: 'sk-...',              models: ['gpt-4o', 'gpt-4o-mini'] },
  { id: 'anthropic',  label: 'Anthropic',    envVar: 'ANTHROPIC_API_KEY',  placeholder: 'sk-ant-...',          models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'] },
  { id: 'groq',       label: 'Groq',         envVar: 'GROQ_API_KEY',       placeholder: 'gsk_...',             models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
  { id: 'gemini',     label: 'Google Gemini',envVar: 'GEMINI_API_KEY',     placeholder: 'AIza...',             models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
  { id: 'deepseek',   label: 'DeepSeek',     envVar: 'DEEPSEEK_API_KEY',   placeholder: 'sk-...',              models: ['deepseek-chat'] },
  { id: 'openrouter', label: 'OpenRouter',   envVar: 'OPENROUTER_API_KEY', placeholder: 'sk-or-...',           models: ['openrouter/auto'] },
  { id: 'mistral',    label: 'Mistral',      envVar: 'MISTRAL_API_KEY',    placeholder: 'xxxx...',             models: ['mistral-large-latest', 'mistral-7b-instruct'] },
  { id: 'google_ai',  label: 'Google AI',    envVar: 'GOOGLE_AI_API_KEY',  placeholder: 'AIza...',             models: ['gemini-1.5-flash'] },
];

export function getEffectiveKey(provider) {
  const envVar = getEnvVar(provider);
  return runtimeKeys.get(provider) || process.env[envVar] || process.env[`VITE_${envVar}`] || null;
}

function getEnvVar(provider) {
  const def = PROVIDER_DEFS.find(p => p.id === provider);
  return def?.envVar || '';
}

export function setRuntimeKey(provider, key) {
  if (!key || !key.trim()) {
    runtimeKeys.delete(provider);
  } else {
    runtimeKeys.set(provider, key.trim());
  }
}

export function getAllProviderStatus() {
  return PROVIDER_DEFS.map(p => {
    const runtime = runtimeKeys.get(p.id);
    const env = process.env[p.envVar];
    const key = runtime || env || null;
    return {
      id: p.id,
      label: p.label,
      models: p.models,
      placeholder: p.placeholder,
      configured: !!key,
      source: runtime ? 'runtime' : env ? 'env' : null,

      masked: key ? key.slice(0, 8) + '••••••••' : null,
    };
  });
}

export function getAvailableProviders() {
  return PROVIDER_DEFS
    .map(p => p.id)
    .filter(id => !!getEffectiveKey(id));
}
