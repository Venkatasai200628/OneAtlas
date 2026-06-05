import type { ModelId, ModelInfo } from "@/types";

export const MODEL_REGISTRY: ModelInfo[] = [
  {
    id: "auto",
    name: "Automatic",
    provider: "OneAtlas",
    tier: "balanced",
    costTier: "medium",
    description: "Platform routes to best model per task based on cost and complexity",
    badge: "Smart",
  },
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    provider: "OpenAI",
    tier: "powerful",
    costTier: "high",
    description: "Flagship model — most capable for complex schema and spec generation",
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "OpenAI",
    tier: "fast",
    costTier: "low",
    description: "Fast and cheap — ideal for intent extraction and classification",
  },
  {
    id: "claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    tier: "balanced",
    costTier: "medium",
    description: "Strong structured output — excellent for multi-step reasoning",
    badge: "Recommended",
  },
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    tier: "powerful",
    costTier: "high",
    description: "Most capable Claude — highest-complexity generation stages",
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    tier: "powerful",
    costTier: "high",
    description: "Strong alternative to GPT-5.5 for heavy generation tasks",
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "Google",
    tier: "fast",
    costTier: "low",
    description: "Fast and cost-efficient — good for intermediate pipeline stages",
  },
  {
    id: "deepseek-v4",
    name: "DeepSeek V4",
    provider: "DeepSeek",
    tier: "balanced",
    costTier: "low",
    description: "Strong on code-adjacent and schema generation tasks",
  },
  {
    id: "llama-4-scout",
    name: "Llama 4 Scout",
    provider: "Groq",
    tier: "fast",
    costTier: "low",
    description: "Low-latency via Groq inference — good for real-time streaming",
  },
  {
    id: "mistral-small",
    name: "Mistral Small",
    provider: "Mistral",
    tier: "fast",
    costTier: "low",
    description: "Efficient, reliable — good fallback for classification and extraction",
  },
];

export const getModelById = (id: ModelId): ModelInfo | undefined =>
  MODEL_REGISTRY.find((m) => m.id === id);

export const PROVIDER_COLORS: Record<string, string> = {
  OneAtlas: "#FF6600",
  OpenAI: "#10A37F",
  Anthropic: "#D97757",
  Google: "#4285F4",
  DeepSeek: "#5B8DEF",
  Groq: "#F55036",
  Mistral: "#FF7000",
};

export const STAGE_LABELS: Record<string, string> = {
  intent_extraction: "Extracting Intent",
  schema_design: "Designing Schema",
  api_generation: "Generating APIs",
  auth_rules: "Configuring Auth",
  integration_hooks: "Setting Up Integrations",
  workflow_stubs: "Building Workflows",
  appspec_assembly: "Assembling AppSpec",
  deployment: "Deploying",
};
export const GENERATION_STAGES = [
  "intent_extraction",
  "schema_design",
  "api_generation",
  "auth_rules",
  "integration_hooks",
  "workflow_stubs",
  "appspec_assembly",
  "deployment",
];
