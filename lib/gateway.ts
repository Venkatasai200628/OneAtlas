import type { ModelId } from "@/types";

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

// Cost table (per 1M tokens in USD)
export const COST_TABLE: Record<string, { input: number; output: number }> = {
  "gpt-5.5": { input: 15, output: 60 },
  "gpt-5.4-mini": { input: 0.15, output: 0.6 },
  "claude-sonnet-4.6": { input: 3, output: 15 },
  "claude-opus-4.6": { input: 15, output: 75 },
  "gemini-3.1-pro": { input: 3.5, output: 10.5 },
  "gemini-3-flash": { input: 0.075, output: 0.3 },
  "deepseek-v4": { input: 0.14, output: 0.28 },
  "llama-4-scout": { input: 0.11, output: 0.34 },
  "mistral-small": { input: 0.2, output: 0.6 },
  "auto": { input: 1, output: 4 },
};

export const STAGE_MODEL_ROUTING: Record<string, { primary: ModelId; fallback: ModelId }> = {
  intent_extraction: { primary: "llama-4-scout", fallback: "gpt-5.4-mini" },
  schema_design: { primary: "claude-sonnet-4.6", fallback: "gpt-5.5" },
  api_generation: { primary: "claude-sonnet-4.6", fallback: "gpt-5.5" },
  auth_rules: { primary: "claude-sonnet-4.6", fallback: "gpt-5.4-mini" },
  integration_hooks: { primary: "claude-opus-4.6", fallback: "gpt-5.5" },
  workflow_stubs: { primary: "claude-sonnet-4.6", fallback: "deepseek-v4" },
  appspec_assembly: { primary: "claude-opus-4.6", fallback: "gpt-5.5" },
  deployment: { primary: "auto", fallback: "mistral-small" },
};

export function calculateCost(model: ModelId, inputTokens: number, outputTokens: number): number {
  const rates = COST_TABLE[model] ?? COST_TABLE["auto"]!;
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}

export function estimateComplexity(prompt: string): "low" | "medium" | "high" {
  const wordCount = prompt.split(/\s+/).length;
  const entityCount = (prompt.match(/\b(table|model|entity|database|api|integration|user|admin|report|dashboard)\b/gi) ?? []).length;
  const score = wordCount + entityCount * 10;
  if (score < 50) return "low";
  if (score < 150) return "medium";
  return "high";
}

export function selectAutoModel(prompt: string, stage: string): ModelId {
  const complexity = estimateComplexity(prompt);
  const routing = STAGE_MODEL_ROUTING[stage];
  if (!routing) return "claude-sonnet-4.6";
  if (complexity === "low") return "gpt-5.4-mini";
  return routing.primary;
}

export { generateMockAppSpec } from "./mock-appspec";
