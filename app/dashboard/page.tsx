"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Zap, Clock, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Trash2, MoreVertical, LayoutDashboard, FolderKanban, Users, Bot, Settings2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { MOCK_PROJECTS, MOCK_ACTIVITY } from "@/lib/mock-data";
import { useProjectStore, useUserStore } from "@/store";
import { cn, APP_TYPE_LABELS, APP_TYPE_COLORS, STATUS_COLORS, formatRelativeTime, generateId, slugify } from "@/lib/utils";
import { MODEL_REGISTRY } from "@/lib/models";
import type { Project, AppType, ModelId } from "@/types";

const APP_TYPE_ICONS: Record<string, React.ElementType> = {
  internal_tool: FolderKanban, dashboard: LayoutDashboard,
  client_portal: Users, crm: Users, ai_workflow: Bot, admin_panel: Settings2,
};

const CATEGORY_CARDS = [
  { id: "internal_tool" as AppType, label: "Internal Tool", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { id: "dashboard" as AppType, label: "Dashboard", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  { id: "client_portal" as AppType, label: "Client Portal", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  { id: "crm" as AppType, label: "CRM App", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  { id: "ai_workflow" as AppType, label: "AI Workflow", color: "text-pink-600", bg: "bg-pink-50 border-pink-200" },
  { id: "admin_panel" as AppType, label: "Admin Panel", color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
];

const SUGGESTION_CHIPS = [
  "Sales CRM", "KPI Dashboard", "Employee Onboarding App",
  "Customer Support Portal", "Inventory Tracker", "Approval Workflow",
];

export default function DashboardPage() {
  const router = useRouter();
  const { userName } = useUserStore();
  const { projects, setProjects, addProject, updateProject, removeProject } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AppType | "all">("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Modal state
  const [newPrompt, setNewPrompt] = useState("");
  const [newAppType, setNewAppType] = useState<AppType>("internal_tool");
  const [newAppName, setNewAppName] = useState("");
  const [newModel, setNewModel] = useState<ModelId>("auto");
  const [newMode, setNewMode] = useState<"build" | "plan">("build");
  const [creating, setCreating] = useState(false);

  // Seed mock projects if store is empty
  useEffect(() => {
    if (projects.length === 0) setProjects(MOCK_PROJECTS);
  }, []);

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.prompt.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.appType === typeFilter;
    return matchSearch && matchType;
  });

  const stats = [
    { label: "Total Projects", value: projects.length, icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Live Apps", value: projects.filter(p => p.status === "deployed").length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Building", value: projects.filter(p => p.status === "generating").length, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Failed", value: projects.filter(p => p.status === "failed").length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  const handleCreateApp = async () => {
    if (!newPrompt.trim()) return;
    setCreating(true);
    const name = newAppName.trim() || newPrompt.split(" ").slice(0, 4).join(" ");
    const project: Project = {
      id: `proj-${generateId()}`,
      orgId: "org-demo",
      name,
      appType: newAppType,
      prompt: newPrompt.trim(),
      status: "idle",
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProject(project);
    await new Promise(r => setTimeout(r, 400));
    setCreating(false);
    setShowModal(false);
    setNewPrompt(""); setNewAppName(""); setNewAppType("internal_tool"); setNewMode("build");
    const params = new URLSearchParams({ prompt: project.prompt, model: newModel, mode: newMode, projectId: project.id });
    router.push(`/builder/${project.id}?${params.toString()}`);
  };

  const handleChipClick = (chip: string) => {
    setNewPrompt(`Build a ${chip} for my team`);
    setShowModal(true);
  };

  const handleRedeploy = (id: string) => {
    updateProject(id, { status: "generating" });
    setTimeout(() => updateProject(id, { status: "deployed", updatedAt: new Date().toISOString() }), 3000);
    setMenuOpen(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this project? This cannot be undone.")) removeProject(id);
    setMenuOpen(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] tracking-[-0.02em]">
            {userName ? `Welcome back, ${userName.split(" ")[0]}` : "Projects"}
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Build and manage your AI-powered applications</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-11 px-5 bg-[#FF6600] text-white rounded-[12px] text-sm font-semibold hover:bg-[#E65C00] transition-all hover:-translate-y-px">
          <Plus className="w-4 h-4" /> New App
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => { const Icon = s.icon; return (
          <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-[20px] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-[#9CA3AF]">{s.label}</p>
              <div className={`w-7 h-7 rounded-[8px] ${s.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#111111]">{s.value}</p>
          </div>
        ); })}
      </div>

      {/* Activity strip */}
      <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 mb-6">
        <h3 className="text-sm font-semibold text-[#111111] mb-3">Recent Activity</h3>
        {MOCK_ACTIVITY.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[#F0F0EA] last:border-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${item.status === "success" ? "bg-green-400" : "bg-red-400"}`} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-[#111111]">{item.event}</span>
              <span className="text-sm text-[#9CA3AF] mx-2">·</span>
              <span className="text-sm text-[#6B7280]">{item.project}</span>
            </div>
            <span className="text-xs text-[#9CA3AF] shrink-0">{formatRelativeTime(item.time)}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
            className="w-full h-10 pl-9 pr-4 rounded-[10px] border border-[#E5E7EB] bg-white text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {([{id:"all",label:"All"}, ...CATEGORY_CARDS] as const).map((t: any) => (
            <button key={t.id} onClick={() => setTypeFilter(t.id)}
              className={cn("px-3 py-1.5 rounded-[8px] text-xs font-medium whitespace-nowrap transition-all",
                typeFilter === t.id ? "bg-[#111111] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#9CA3AF]")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state with chips */}
      {filtered.length === 0 && !search && (
        <div className="text-center py-14">
          <div className="w-14 h-14 rounded-[18px] bg-[#F5F5EE] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-[#FF6600]" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#111111] mb-2">Build your first app</h3>
          <p className="text-sm text-[#9CA3AF] mb-6">Describe what you need — OneAtlas generates it in seconds.</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {SUGGESTION_CHIPS.map(chip => (
              <button key={chip} onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E7EB] rounded-full text-[#6B7280] hover:border-[#FF6600] hover:text-[#FF6600] transition-all">
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && search && (
        <div className="text-center py-14">
          <p className="text-sm font-semibold text-[#111111]">No projects found</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Try a different search term.</p>
        </div>
      )}

      {/* Projects grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => {
            const Icon = APP_TYPE_ICONS[project.appType] || Zap;
            return (
              <div key={project.id} className="group bg-white border border-[#E5E7EB] rounded-[24px] p-6 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", APP_TYPE_COLORS[project.appType])}>
                      {APP_TYPE_LABELS[project.appType]}
                    </span>
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", STATUS_COLORS[project.status])}>
                      {project.status === "deployed" ? "● live" : project.status === "generating" ? "⟳ building" : project.status}
                    </span>
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                      className="p-1 rounded-[6px] text-[#9CA3AF] hover:bg-[#F5F5EE] opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === project.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
                          <button onClick={() => { router.push(`/builder/${project.id}`); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F5F5EE]">
                            <Zap className="w-4 h-4" /> Open Builder
                          </button>
                          <button onClick={() => handleRedeploy(project.id)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F5F5EE]">
                            <RefreshCw className="w-4 h-4" /> Redeploy
                          </button>
                          {project.subdomain && (
                            <a href={`https://${project.subdomain}`} target="_blank" rel="noreferrer"
                              onClick={() => setMenuOpen(null)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F5F5EE]">
                              <ExternalLink className="w-4 h-4" /> Open Live App
                            </a>
                          )}
                          <button onClick={() => handleDelete(project.id)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-8 h-8 rounded-[10px] flex items-center justify-center", CATEGORY_CARDS.find(c => c.id === project.appType)?.bg || "bg-gray-50")}>
                    <Icon className={cn("w-4 h-4", CATEGORY_CARDS.find(c => c.id === project.appType)?.color || "text-gray-600")} />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#111111] truncate">{project.name}</h3>
                </div>

                <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-4 flex-1 leading-relaxed">{project.prompt}</p>

                {project.subdomain && (
                  <div className="flex items-center gap-1.5 mb-4 text-xs text-[#6B7280] bg-[#F5F5EE] rounded-[8px] px-3 py-2 font-mono truncate">
                    {project.subdomain}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EA]">
                  <span className="text-xs text-[#9CA3AF]">{formatRelativeTime(project.updatedAt)}</span>
                  <button onClick={() => router.push(`/builder/${project.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-[8px] text-xs font-semibold text-[#111111] hover:bg-[#F5F5EE] hover:border-[#9CA3AF] transition-all">
                    <Zap className="w-3.5 h-3.5 text-[#FF6600]" /> Open Builder
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── NEW APP MODAL ── */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setNewPrompt(""); }} title="Build a new app" description="Describe what you want — OneAtlas generates it end-to-end." size="xl">
        <div className="space-y-4">
          {/* App type selector */}
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-2">App type</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_CARDS.map(cat => {
                const Icon = APP_TYPE_ICONS[cat.id] || Zap;
                return (
                  <button key={cat.id} onClick={() => setNewAppType(cat.id)}
                    className={cn("flex flex-col items-center gap-1.5 p-3 rounded-[12px] border-2 text-xs font-medium transition-all",
                      newAppType === cat.id ? "border-[#FF6600] bg-orange-50 text-[#FF6600]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#9CA3AF]")}>
                    <div className={cn("w-7 h-7 rounded-[8px] flex items-center justify-center", cat.bg)}>
                      <Icon className={cn("w-4 h-4", cat.color)} />
                    </div>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-[#111111] mb-1.5">Describe your app <span className="text-red-500">*</span></label>
            <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
              placeholder="e.g. Build a CRM for a real estate agency. Agents manage leads, properties, and deals. WhatsApp notification when a deal closes."
              rows={4}
              className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] bg-white text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] resize-none leading-relaxed" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTION_CHIPS.map(chip => (
                <button key={chip} onClick={() => setNewPrompt(`Build a ${chip} for my team`)}
                  className="text-[11px] px-2 py-1 bg-[#F5F5EE] border border-[#E5E7EB] rounded-full text-[#6B7280] hover:border-[#FF6600] hover:text-[#FF6600] transition-colors">
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Name + Model + Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1.5">App name <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
              <input value={newAppName} onChange={e => setNewAppName(e.target.value)}
                placeholder="Auto-generated from prompt"
                className="w-full h-10 px-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111111] mb-1.5">AI Model</label>
              <select value={newModel} onChange={e => setNewModel(e.target.value as ModelId)}
                className="w-full h-10 px-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] appearance-none">
                {MODEL_REGISTRY.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Build vs Plan */}
          <div className="flex items-center gap-3 p-3 bg-[#F9F9F7] rounded-[12px]">
            <span className="text-sm font-medium text-[#111111]">Mode:</span>
            <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[8px] p-0.5">
              {([["build","Build & Deploy"],["plan","Plan Only"]] as const).map(([val, lbl]) => (
                <button key={val} onClick={() => setNewMode(val)}
                  className={cn("px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all",
                    newMode === val ? "bg-[#FF6600] text-white" : "text-[#6B7280] hover:text-[#111111]")}>
                  {lbl}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF] flex-1">
              {newMode === "build" ? "Generates + deploys a live app" : "Returns a structured spec for review"}
            </p>
          </div>

          <button onClick={handleCreateApp} disabled={!newPrompt.trim() || creating}
            className="w-full h-12 bg-[#FF6600] text-white rounded-[14px] text-[15px] font-semibold hover:bg-[#E65C00] disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : <><Zap className="w-4 h-4" /> {newMode === "build" ? "Build App" : "Generate Plan"}</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
