"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, ArrowRight, TrendingUp, Zap } from "lucide-react";
import { DashboardSidebar } from "@/components/layouts/sidebar";
import { DashboardTopnav } from "@/components/layouts/topnav";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { useProjectStore } from "@/store";
import { cn, generateId } from "@/lib/utils";
import { generateMockAppSpec } from "@/lib/mock-appspec";
import type { AppType, Project, AppSpec } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  "AI Apps": "🤖", "Dashboards": "📊", "CRM": "👥",
  "Internal Tools": "🛠️", "Marketplaces": "🏪", "Ecommerce": "🛒",
  "Productivity": "⚡", "Client Apps": "🤝",
};

const CATEGORY_TO_APPTYPE: Record<string, AppType> = {
  "AI Apps": "ai_workflow", "Dashboards": "dashboard", "CRM": "crm",
  "Internal Tools": "internal_tool", "Marketplaces": "client_portal",
  "Ecommerce": "internal_tool", "Productivity": "internal_tool", "Client Apps": "client_portal",
};

// Template prompts that generate good AppSpecs
const TEMPLATE_PROMPTS: Record<string, string> = {
  "ai-support-agent": "Build an AI support agent system with ticket management, auto-routing, and response generation. Agents manage tickets, customers submit requests, admin sees analytics.",
  "kpi-dashboard": "Build a KPI dashboard with real-time metrics, revenue tracking, user analytics, and team performance indicators with charts and stat cards.",
  "sales-pipeline-crm": "Build a Sales Pipeline CRM. Agents manage leads, deals, contacts. Track pipeline stages from prospecting to closed. Slack notification when a deal closes.",
  "admin-panel": "Build an admin panel with full CRUD for users, roles, settings, and audit logs. Role-based access control for admin, editor, and viewer roles.",
  "approval-workflow": "Build an approval workflow system. Employees submit requests, managers approve or reject. Email notification on status change. Track all approvals with audit trail.",
  "inventory-manager": "Build an inventory management system with products, stock movements, supplier records, and purchase orders. Email alert when stock drops below reorder threshold.",
  "project-management": "Build a project management tool with projects, tasks, milestones, assignees, priorities, and due dates. Slack message when task is overdue.",
  "customer-portal": "Build a customer portal where customers can view their orders, submit support tickets, track status, and manage their account.",
  "order-tracking": "Build an order tracking system with orders, customers, products, shipping status, and delivery updates. Email notification on status change.",
  "employee-dashboard": "Build an HR employee dashboard with employee records, leave requests, performance reviews, and payroll information. Manager approval workflow for leave.",
};

export default function TemplatesPage() {
  const router = useRouter();
  const { addProject } = useProjectStore();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [using, setUsing] = useState<string | null>(null);

  const filtered = TEMPLATES.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    return matchSearch && matchCat;
  });
  const featured = TEMPLATES.filter(t => t.featured).slice(0, 6);

  const handleUseTemplate = async (templateId: string, templateName: string, category: string, description: string) => {
    setUsing(templateId);

    // Use a specific prompt for this template or generate one from description
    const prompt = TEMPLATE_PROMPTS[templateId]
      || `Build a ${templateName}. ${description}`;

    const appType = CATEGORY_TO_APPTYPE[category] || "internal_tool";
    const jobId = generateId();

    // Pre-generate the AppSpec from the template — no API call needed
    const appSpec: AppSpec = generateMockAppSpec(prompt, jobId);

    const project: Project = {
      id: `proj-${generateId()}`,
      orgId: "org-demo",
      name: templateName,
      appType,
      prompt,
      status: "deployed",  // Template apps are instantly "deployed"
      metadata: { templateId, fromTemplate: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(project);

    // Pre-load AppSpec into builder store so it shows immediately (no generation needed)
    const { useBuilderStore } = await import("@/store");
    const state = useBuilderStore.getState();
    state.reset();
    state.setPrompt(prompt);
    state.setAppSpec(appSpec);
    state.setCurrentJob({
      id: jobId,
      projectId: project.id,
      prompt,
      model: "auto",
      mode: "build",
      status: "complete",
      stages: [],
      costUsd: 0,
      totalLatencyMs: 0,
      appSpec,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    await new Promise(r => setTimeout(r, 300));
    setUsing(null);

    // Navigate to builder — the AppSpec is already in store, shows immediately
    router.push(`/builder/${project.id}`);
  };

  return (
    <div className="flex h-screen bg-[#F5F5EE] overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopnav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1280px]">
            <div className="mb-8">
              <h1 className="text-[28px] font-bold text-[#111111] tracking-[-0.02em]">Template Library</h1>
              <p className="text-sm text-[#9CA3AF] mt-0.5">
                {TEMPLATES.length}+ production-ready templates. Click <strong className="text-[#111111]">Use template</strong> — your app opens instantly with real data, no generation needed.
              </p>
            </div>

            {/* Featured */}
            {activeCategory === "All" && !search && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#FF6600]" />
                  <h2 className="text-sm font-semibold text-[#111111]">Most Popular</h2>
                  <span className="text-xs text-[#9CA3AF]">— ready instantly, no generation required</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {featured.map(t => (
                    <button key={t.id}
                      onClick={() => handleUseTemplate(t.id, t.name, t.category, t.description)}
                      disabled={using === t.id}
                      className="group bg-white border border-[#E5E7EB] rounded-[16px] p-4 text-left hover:border-[#FF6600]/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60">
                      <div className="text-2xl mb-2">{CATEGORY_ICONS[t.category] || "📦"}</div>
                      <p className="text-[12px] font-semibold text-[#111111] leading-tight mb-1">{t.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{t.usageCount.toLocaleString()} uses</p>
                      {using === t.id ? (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-[#FF6600] font-medium">
                          <div className="w-3 h-3 border-2 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin" />
                          Opening…
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] text-[#FF6600] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Use instantly →
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search + filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
                  className="w-full h-10 pl-9 pr-4 rounded-[10px] border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
              {["All", ...TEMPLATE_CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={cn("flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-medium whitespace-nowrap transition-all",
                    activeCategory === cat ? "bg-[#111111] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#9CA3AF]")}>
                  {CATEGORY_ICONS[cat] && <span>{CATEGORY_ICONS[cat]}</span>}
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(template => (
                <div key={template.id}
                  className="group bg-white border border-[#E5E7EB] rounded-[20px] p-5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#F5F5EE] flex items-center justify-center text-2xl">
                      {CATEGORY_ICONS[template.category] || "📦"}
                    </div>
                    {template.featured && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#FF6600]">
                        <Star className="w-3 h-3 fill-current" /> Popular
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">{template.category}</p>
                  <h3 className="text-[15px] font-semibold text-[#111111] mb-1.5">{template.name}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed flex-1 mb-4">{template.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[#F0F0EA]">
                    <span className="text-[11px] text-[#9CA3AF]">{template.usageCount.toLocaleString()} uses</span>
                    <button
                      onClick={() => handleUseTemplate(template.id, template.name, template.category, template.description)}
                      disabled={using === template.id}
                      className="flex items-center gap-1 text-xs font-semibold text-[#FF6600] hover:gap-2 disabled:opacity-50 transition-all">
                      {using === template.id ? (
                        <><div className="w-3 h-3 border-2 border-[#FF6600]/30 border-t-[#FF6600] rounded-full animate-spin" /> Opening…</>
                      ) : (
                        <>Use template <ArrowRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-sm font-semibold text-[#111111] mb-1">No templates found</p>
                <p className="text-xs text-[#9CA3AF]">Try a different search or category.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
