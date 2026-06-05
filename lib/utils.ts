import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`;
  return `$${usd.toFixed(4)}`;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const APP_TYPE_LABELS: Record<string, string> = {
  internal_tool: "Internal Tool",
  dashboard: "Dashboard",
  client_portal: "Client Portal",
  crm: "CRM App",
  ai_workflow: "AI Workflow",
  admin_panel: "Admin Panel",
};

export const APP_TYPE_COLORS: Record<string, string> = {
  internal_tool: "bg-blue-50 text-blue-700 border-blue-200",
  dashboard: "bg-purple-50 text-purple-700 border-purple-200",
  client_portal: "bg-green-50 text-green-700 border-green-200",
  crm: "bg-orange-50 text-orange-700 border-orange-200",
  ai_workflow: "bg-pink-50 text-pink-700 border-pink-200",
  admin_panel: "bg-gray-50 text-gray-700 border-gray-200",
};

export const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-100 text-green-700",
  building: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  idle: "bg-gray-100 text-gray-600",
  generating: "bg-blue-100 text-blue-700",
  deployed: "bg-green-100 text-green-700",
};
