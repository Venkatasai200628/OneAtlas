import type { Project, Deployment, GenerationJob } from "@/types";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    orgId: "org-demo",
    name: "Real Estate CRM",
    appType: "crm",
    prompt: "Build a CRM for a real estate agency. Agents manage leads, properties, and deals. Admin sees analytics dashboard. WhatsApp notification when a deal closes.",
    status: "deployed",
    metadata: { subdomain: "realestate-crm" },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    subdomain: "realestate-crm.oneatlas.dev",
  },
  {
    id: "proj-2",
    orgId: "org-demo",
    name: "Engineering Task Manager",
    appType: "internal_tool",
    prompt: "Task manager for an engineering team. Tasks have priorities, assignees, due dates, and status columns. Slack message to team lead when a task is overdue.",
    status: "deployed",
    metadata: { subdomain: "eng-tasks" },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    subdomain: "eng-tasks.oneatlas.dev",
  },
  {
    id: "proj-3",
    orgId: "org-demo",
    name: "KPI Analytics Dashboard",
    appType: "dashboard",
    prompt: "Build a KPI dashboard with real-time metrics, revenue tracking, and team performance indicators.",
    status: "deployed",
    metadata: { subdomain: "kpi-dash" },
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    subdomain: "kpi-dash.oneatlas.dev",
  },
  {
    id: "proj-4",
    orgId: "org-demo",
    name: "HR Management Portal",
    appType: "admin_panel",
    prompt: "HR tool. Employees, leave requests, performance reviews. Notify manager on Slack when leave is approved.",
    status: "idle",
    metadata: {},
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "proj-5",
    orgId: "org-demo",
    name: "Inventory System",
    appType: "internal_tool",
    prompt: "Inventory system with products, stock movements, supplier records. Email alert when stock drops below reorder threshold.",
    status: "failed",
    metadata: { errorStage: "deployment" },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString(),
  },
];

export const MOCK_DEPLOYMENTS: Deployment[] = [
  {
    id: "dep-1",
    projectId: "proj-1",
    subdomain: "realestate-crm",
    status: "live",
    url: "https://realestate-crm.oneatlas.dev",
    deployedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "dep-2",
    projectId: "proj-2",
    subdomain: "eng-tasks",
    status: "live",
    url: "https://eng-tasks.oneatlas.dev",
    deployedAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const MOCK_ACTIVITY = [
  { id: "act-1", event: "Generation complete", project: "Real Estate CRM", stage: "deployment", status: "success", elapsed: "47s", time: new Date(Date.now() - 3600000).toISOString() },
  { id: "act-2", event: "Generation started", project: "Engineering Task Manager", stage: "intent_extraction", status: "success", elapsed: "2s", time: new Date(Date.now() - 7200000).toISOString() },
  { id: "act-3", event: "Generation failed", project: "Inventory System", stage: "deployment", status: "failed", elapsed: "38s", time: new Date(Date.now() - 1200000).toISOString() },
];
