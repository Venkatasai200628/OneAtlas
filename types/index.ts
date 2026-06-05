// ── Shared Types — OneAtlas ──────────────────────────────────────────────────

export type ModelId =
  | "auto"
  | "gpt-5.5"
  | "gpt-5.4-mini"
  | "claude-sonnet-4.6"
  | "claude-opus-4.6"
  | "gemini-3.1-pro"
  | "gemini-3-flash"
  | "deepseek-v4"
  | "llama-4-scout"
  | "mistral-small";

export type AppType =
  | "internal_tool"
  | "dashboard"
  | "client_portal"
  | "crm"
  | "ai_workflow"
  | "admin_panel";

export type GenerationMode = "build" | "plan";

export type ProjectStatus = "idle" | "generating" | "deployed" | "failed";

export type DeploymentStatus = "pending" | "building" | "live" | "failed";

export type IntegrationType =
  | "slack"
  | "salesforce"
  | "hubspot"
  | "gmail"
  | "notion"
  | "google_sheets"
  | "twilio"
  | "stripe"
  | "google_drive"
  | "jira"
  | "github"
  | "airtable"
  | "resend"
  | "webhook"
  | "discord";

export type PlanTier = "free" | "studio" | "scale" | "orbit" | "enterprise";

export interface ModelInfo {
  id: ModelId;
  name: string;
  provider: string;
  tier: "fast" | "balanced" | "powerful";
  costTier: "low" | "medium" | "high";
  description: string;
  badge?: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  appType: AppType;
  prompt: string;
  status: ProjectStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  subdomain?: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  subdomain: string;
  status: DeploymentStatus;
  url: string;
  deployedAt: string;
  createdAt: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  prompt: string;
  model: ModelId;
  mode: GenerationMode;
  status: "queued" | "running" | "complete" | "failed";
  stages: GenerationStage[];
  costUsd: number;
  totalLatencyMs: number;
  appSpec?: AppSpec;
  createdAt: string;
  completedAt?: string;
}

export interface GenerationStage {
  name: string;
  status: "pending" | "running" | "complete" | "failed";
  startedAt?: string;
  completedAt?: string;
  latencyMs?: number;
  error?: string;
  model?: string;
}

export interface AppSpec {
  id: string;
  jobId: string;
  pages: PageSpec[];
  apiEndpoints: ApiEndpoint[];
  authRules: AuthRule[];
  integrationHooks: IntegrationHook[];
  workflowStubs: WorkflowStub[];
  dataSchema: DataSchema;
  version: number;
  createdAt: string;
}

export interface PageSpec {
  name: string;
  path: string;
  components: string[];
  layout: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  entity: string;
  description: string;
  authRequired: boolean;
}

export interface AuthRule {
  path: string;
  roles: string[];
  action: "allow" | "deny";
}

export interface IntegrationHook {
  integration: IntegrationType;
  trigger: string;
  action: string;
  payloadSchema: Record<string, unknown>;
}

export interface WorkflowStub {
  id: string;
  name: string;
  triggerEntity: string;
  triggerEvent: "created" | "updated" | "deleted" | "status_changed";
  triggerCondition?: Record<string, unknown>;
  integrationConfigId?: string;
  actionType: string;
  payloadSchema: Record<string, unknown>;
  enabled: boolean;
}

export interface DataSchema {
  entities: EntitySchema[];
}

export interface EntitySchema {
  name: string;
  fields: FieldSchema[];
}

export interface FieldSchema {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "json" | "relation";
  required: boolean;
  unique?: boolean;
  relation?: string;
}

export interface Integration {
  id: IntegrationType;
  name: string;
  category: string;
  description: string;
  icon: string;
  connected: boolean;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  featured: boolean;
  usageCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
  orgId: string;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  credits: number;
  defaultModel: ModelId;
}

// SSE Event Types
export interface SSEStageStart {
  type: "stage_start";
  stage: string;
  model: string;
  startedAt: string;
}

export interface SSEStageComplete {
  type: "stage_complete";
  stage: string;
  output: Partial<AppSpec>;
  latencyMs: number;
  completedAt: string;
}

export interface SSEStageFailed {
  type: "stage_failed";
  stage: string;
  error: { code: string; message: string };
  repairAttempted: boolean;
  repairStrategy: string | null;
  failedAt: string;
}

export interface SSEGenerationComplete {
  type: "generation_complete";
  jobId: string;
  appSpec: AppSpec;
  costUsd: number;
  totalLatencyMs: number;
  model: string;
  completedAt: string;
}

export type SSEEvent =
  | SSEStageStart
  | SSEStageComplete
  | SSEStageFailed
  | SSEGenerationComplete;

// API Response Envelope
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
