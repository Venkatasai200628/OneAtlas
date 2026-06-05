"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useBuilderStore, useProjectStore } from "@/store";
import { GENERATION_STAGES, STAGE_LABELS } from "@/lib/models";
import { AppSpecViewer } from "@/components/features/appspec-viewer";
import { AppPreview } from "@/components/features/app-preview";
import { cn, formatLatency, formatCost, generateId } from "@/lib/utils";
import {
  Monitor, Tablet, Smartphone, Code2, Eye, RefreshCw,
  History, ChevronLeft, ExternalLink, AlertCircle, Loader2,
  Zap, CheckCircle2, XCircle, Send, Mic, MicOff, ChevronDown, Info
} from "lucide-react";
import { MODEL_REGISTRY } from "@/lib/models";
import type { ModelId, GenerationStage, AppSpec } from "@/types";

function BuilderInner() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const isNew = projectId === "new";

  const {
    prompt, model, mode, stages, appSpec, isStreaming, streamError,
    currentJob, setPrompt, setModel, setMode, updateStage, setAppSpec,
    setIsStreaming, setStreamError, setCurrentJob, viewMode, setViewMode,
    viewport, setViewport, promptHistory, addToHistory, reset,
  } = useBuilderStore();
  const { projects, updateProject } = useProjectStore();

  const [localPrompt, setLocalPrompt] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const project = projects.find(p => p.id === projectId);
  const currentModel = MODEL_REGISTRY.find(m => m.id === model);

  // Viewport dimensions for scaling
  const viewportConfig = {
    desktop: { width: "100%", label: "Desktop", scale: 1 },
    tablet:  { width: "768px", label: "Tablet (768px)", scale: 0.85 },
    mobile:  { width: "375px", label: "Mobile (375px)", scale: 0.7 },
  };

  useEffect(() => {
    const p = searchParams.get("prompt");
    const m = searchParams.get("model") as ModelId | null;
    const mo = searchParams.get("mode") as "build" | "plan" | null;
    if (p) {
      setLocalPrompt(p);
      setPrompt(p);
      if (m) setModel(m);
      if (mo) setMode(mo);
      reset();
      setTimeout(() => startGeneration(p, m || "auto", mo || "build"), 300);
    } else if (project?.prompt && !appSpec) {
      setLocalPrompt(project.prompt);
    }
  }, []);

  const startGeneration = async (promptText: string, modelId: ModelId, buildMode: "build" | "plan") => {
    sseRef.current?.close();
    reset();
    setIsStreaming(true);
    const initStages: GenerationStage[] = GENERATION_STAGES.map(name => ({ name, status: "pending" }));
    useBuilderStore.setState({ stages: initStages });
    if (!isNew && projectId) updateProject(projectId, { status: "generating", prompt: promptText, updatedAt: new Date().toISOString() });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, model: modelId, mode: buildMode, projectId: isNew ? undefined : projectId }),
      });
      const data = await res.json();
      const jobId = data.jobId || data.data?.jobId;
      if (!jobId) { setStreamError(data.error?.message || data.error || "Failed to start generation"); setIsStreaming(false); return; }

      const es = new EventSource(`/api/generate/${jobId}/stream`);
      sseRef.current = es;
      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === "stage_start") {
            updateStage(event.stage, { status: "running", startedAt: event.startedAt, model: event.model });
          } else if (event.type === "stage_complete") {
            updateStage(event.stage, { status: "complete", completedAt: event.completedAt, latencyMs: event.latencyMs });
          } else if (event.type === "stage_failed") {
            updateStage(event.stage, { status: "failed", error: event.error?.message });
            setStreamError(event.error?.message || "Stage failed");
            setIsStreaming(false);
            if (!isNew) updateProject(projectId, { status: "failed" });
            es.close();
          } else if (event.type === "generation_complete") {
            setAppSpec(event.appSpec);
            setCurrentJob({ id: jobId, projectId, prompt: promptText, model: event.model, mode: buildMode, status: "complete", stages: useBuilderStore.getState().stages, costUsd: event.costUsd, totalLatencyMs: event.totalLatencyMs, appSpec: event.appSpec, createdAt: new Date().toISOString(), completedAt: event.completedAt });
            setIsStreaming(false);
            if (!isNew) updateProject(projectId, { status: "deployed", updatedAt: new Date().toISOString() });
            es.close();
          } else if (event.type === "generation_failed") {
            setStreamError(event.error || "Failed");
            setIsStreaming(false);
            if (!isNew) updateProject(projectId, { status: "failed" });
            es.close();
          }
        } catch {}
      };
      es.onerror = () => { if (useBuilderStore.getState().isStreaming) setStreamError("reconnecting"); };
    } catch { setStreamError("Network error — please try again"); setIsStreaming(false); }
  };

  const handleSubmit = () => {
    if (!localPrompt.trim()) return;
    addToHistory(localPrompt);
    setPrompt(localPrompt);
    startGeneration(localPrompt, model, mode);
  };

  return (
    <div className="flex h-full bg-[#F5F5EE]">
      {/* ── LEFT PANEL ── */}
      <div className="w-[320px] shrink-0 flex flex-col bg-white border-r border-[#E5E7EB]">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB] shrink-0">
          <button onClick={() => router.push("/dashboard")} className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:bg-[#F5F5EE] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#111111] truncate">{project?.name || "New App"}</h2>
            {project?.status && (
              <p className={cn("text-[11px] font-medium", project.status === "deployed" ? "text-green-600" : project.status === "generating" ? "text-[#FF6600]" : project.status === "failed" ? "text-red-500" : "text-[#9CA3AF]")}>
                {project.status === "deployed" ? "● Live" : project.status === "generating" ? "⟳ Building…" : project.status === "failed" ? "✗ Failed" : "○ Idle"}
              </p>
            )}
          </div>
          <button onClick={() => setShowHistory(!showHistory)} className={cn("p-1.5 rounded-[8px] transition-colors", showHistory ? "bg-[#F5F5EE] text-[#111111]" : "text-[#9CA3AF] hover:bg-[#F5F5EE]")} title="Prompt history">
            <History className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showHistory ? (
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-3">Prompt History</p>
              {promptHistory.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-8">No history yet</p>
              ) : (
                <div className="space-y-2">
                  {promptHistory.map((h, i) => (
                    <button key={i} onClick={() => { setLocalPrompt(h); setShowHistory(false); }}
                      className="w-full text-left p-3 rounded-[12px] bg-[#F9F9F7] border border-[#E5E7EB] hover:border-[#FF6600]/40 text-xs text-[#4B5563] line-clamp-3 transition-colors">
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Demo mode notice */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-[12px]">
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Running in <strong>demo mode</strong>. Add real API keys in{" "}
                  <button onClick={() => router.push("/dashboard/settings?tab=api-keys")} className="underline font-semibold">Settings → API Keys</button>{" "}
                  to use real AI generation.
                </p>
              </div>

              {/* Prompt */}
              <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-3 shadow-sm">
                <textarea value={localPrompt} onChange={e => setLocalPrompt(e.target.value)}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); }}}
                  placeholder="Describe what you want to build or change… (⌘↵ to generate)"
                  rows={5}
                  className="w-full resize-none border-none outline-none text-sm text-[#111111] placeholder:text-[#9CA3AF] leading-relaxed bg-transparent" />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0F0EA]">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center bg-[#F5F5EE] rounded-[6px] p-0.5">
                      {(["build","plan"] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)}
                          className={cn("px-2 py-1 rounded-[5px] text-[11px] font-medium capitalize transition-all",
                            mode === m ? "bg-white text-[#111111] shadow-sm" : "text-[#6B7280]")}>
                          {m === "build" ? "⚡ Build" : "📋 Plan"}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setIsRecording(!isRecording)}
                      className={cn("p-1.5 rounded-[6px] transition-all", isRecording ? "bg-red-100 text-red-600 animate-pulse" : "text-[#9CA3AF] hover:bg-[#F5F5EE]")}
                      title={isRecording ? "Stop recording" : "Voice input"}>
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button onClick={handleSubmit} disabled={!localPrompt.trim() || isStreaming}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6600] text-white rounded-[8px] text-xs font-semibold hover:bg-[#E65C00] disabled:opacity-40 transition-all">
                    {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {isStreaming ? "Generating…" : "Generate"}
                  </button>
                </div>
              </div>

              {/* Model picker */}
              <div className="relative">
                <button onClick={() => setShowModelPicker(!showModelPicker)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#F9F9F7] border border-[#E5E7EB] rounded-[12px] text-sm hover:border-[#9CA3AF] transition-colors">
                  <div className="w-2 h-2 rounded-full bg-[#FF6600]" />
                  <span className="flex-1 text-left text-sm font-medium text-[#111111]">{currentModel?.name || "Automatic"}</span>
                  <span className="text-xs text-[#9CA3AF]">{currentModel?.provider}</span>
                  <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                </button>
                {showModelPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-20 overflow-hidden max-h-64 overflow-y-auto">
                      {MODEL_REGISTRY.map(m => (
                        <button key={m.id} onClick={() => { setModel(m.id); setShowModelPicker(false); }}
                          className={cn("w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[#F5F5EE] transition-colors", model === m.id ? "bg-orange-50" : "")}>
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", model === m.id ? "bg-[#FF6600]" : "bg-[#E5E7EB]")} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-[#111111]">{m.name}</span>
                              {m.badge && <span className="text-[10px] text-[#FF6600] font-semibold bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">{m.badge}</span>}
                            </div>
                            <p className="text-[11px] text-[#9CA3AF] truncate">{m.provider} · {m.tier}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Stage progress */}
              {stages.length > 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#111111]">Generation Pipeline</h3>
                    {isStreaming && <span className="text-[11px] text-[#FF6600] flex items-center gap-1 font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Live</span>}
                    {!isStreaming && appSpec && <span className="text-[11px] text-green-600 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Complete</span>}
                    {!isStreaming && streamError && <span className="text-[11px] text-red-500 flex items-center gap-1 font-medium"><XCircle className="w-3 h-3" /> Failed</span>}
                  </div>
                  <div className="space-y-2">
                    {stages.map(stage => (
                      <div key={stage.name} className="flex items-center gap-2">
                        <div className="shrink-0">
                          {stage.status === "complete" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                          {stage.status === "failed"   && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          {stage.status === "running"  && <Loader2 className="w-3.5 h-3.5 text-[#FF6600] animate-spin" />}
                          {stage.status === "pending"  && <div className="w-3.5 h-3.5 rounded-full border-2 border-[#E5E7EB]" />}
                        </div>
                        <span className={cn("text-xs flex-1 truncate",
                          stage.status === "running"  ? "text-[#FF6600] font-medium" :
                          stage.status === "complete" ? "text-[#111111]" :
                          stage.status === "failed"   ? "text-red-500" : "text-[#9CA3AF]")}>
                          {STAGE_LABELS[stage.name] || stage.name}
                        </span>
                        {stage.latencyMs && <span className="text-[11px] text-[#9CA3AF] shrink-0">{formatLatency(stage.latencyMs)}</span>}
                      </div>
                    ))}
                  </div>

                  {streamError === "reconnecting" && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F5F5EE] rounded-[8px] px-3 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Reconnecting…
                    </div>
                  )}
                  {streamError && streamError !== "reconnecting" && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-[10px]">
                      <p className="text-xs font-semibold text-red-700 mb-1">Generation failed</p>
                      <p className="text-xs text-red-500 mb-2">{streamError}</p>
                      <button onClick={() => startGeneration(localPrompt, model, mode)}
                        className="text-xs font-semibold text-[#FF6600] hover:underline">Try again →</button>
                    </div>
                  )}
                  {currentJob && !isStreaming && !streamError && (
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex gap-4 text-[11px] text-[#9CA3AF]">
                      <span>⏱ {formatLatency(currentJob.totalLatencyMs)}</span>
                      <span>💰 {formatCost(currentJob.costUsd)}</span>
                      <span>🤖 {currentJob.model}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#E5E7EB] shrink-0">
          {/* View toggle */}
          <div className="flex items-center bg-[#F5F5EE] rounded-[10px] p-0.5">
            {[{ v: "preview", icon: Eye, label: "Preview" }, { v: "spec", icon: Code2, label: "AppSpec" }].map(({ v, icon: Icon, label }) => (
              <button key={v} onClick={() => setViewMode(v as "preview" | "spec")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all",
                  viewMode === v ? "bg-white text-[#111111] shadow-sm" : "text-[#6B7280] hover:text-[#111111]")}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Viewport switcher */}
          {viewMode === "preview" && appSpec && (
            <div className="flex items-center gap-1 bg-[#F5F5EE] rounded-[10px] p-0.5">
              {([
                ["desktop", Monitor, "Desktop"],
                ["tablet",  Tablet,  "Tablet"],
                ["mobile",  Smartphone, "Mobile"],
              ] as const).map(([id, Icon, label]) => (
                <button key={id} onClick={() => setViewport(id)}
                  title={viewportConfig[id].label}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-xs font-medium transition-all",
                    viewport === id ? "bg-white text-[#111111] shadow-sm" : "text-[#9CA3AF] hover:text-[#6B7280]")}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Deploy */}
          <div className="flex items-center gap-2">
            {appSpec && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {projectId && !isNew ? `${projectId.slice(0,8)}.oneatlas.dev` : "preview"}
              </span>
            )}
            <button disabled={!appSpec || isStreaming}
              onClick={() => { if (project) updateProject(project.id, { status: "deployed" }); }}
              className="flex items-center gap-1.5 px-4 h-9 bg-[#FF6600] text-white rounded-[10px] text-sm font-semibold hover:bg-[#E65C00] disabled:opacity-40 transition-all">
              <Zap className="w-3.5 h-3.5" />
              {isStreaming ? "Building…" : "Deploy"}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex items-stretch justify-center bg-[#F0F0EA] p-4">
          {viewMode === "spec" ? (
            <div className="w-full max-w-3xl overflow-y-auto"><AppSpecViewer /></div>
          ) : isStreaming ? (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[#FF6600]/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-orange-50 border-2 border-[#FF6600]/30 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#FF6600] animate-spin" />
                </div>
              </div>
              <p className="text-base font-semibold text-[#111111] mb-2">Generating your app…</p>
              <p className="text-sm text-[#9CA3AF]">Watch the pipeline progress on the left</p>
              <div className="mt-6 flex gap-2">
                {GENERATION_STAGES.map((s, i) => {
                  const stage = stages.find(st => st.name === s);
                  return (
                    <div key={s} className={cn("w-2 h-2 rounded-full transition-all",
                      stage?.status === "complete" ? "bg-green-500" :
                      stage?.status === "running"  ? "bg-[#FF6600] animate-pulse" :
                      "bg-[#E5E7EB]")} />
                  );
                })}
              </div>
            </div>
          ) : appSpec ? (
            <PreviewFrame spec={appSpec} projectName={project?.name} viewport={viewport} />
          ) : streamError && streamError !== "reconnecting" ? (
            <div className="flex flex-col items-center justify-center w-full text-center">
              <div className="w-14 h-14 rounded-[18px] bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-base font-semibold text-[#111111] mb-1">Generation failed</p>
              <p className="text-xs text-[#9CA3AF] mb-5 max-w-xs">{streamError}</p>
              <button onClick={() => startGeneration(localPrompt, model, mode)}
                className="px-5 py-2.5 bg-[#FF6600] text-white rounded-[10px] text-sm font-semibold hover:bg-[#E65C00] transition-colors">
                Try again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full text-center">
              <div className="w-16 h-16 rounded-[20px] bg-white border border-[#E5E7EB] flex items-center justify-center mb-5 shadow-sm">
                <Zap className="w-8 h-8 text-[#FF6600]" />
              </div>
              <p className="text-base font-semibold text-[#111111] mb-2">Ready to build</p>
              <p className="text-sm text-[#9CA3AF] max-w-xs">Write your prompt on the left and press Generate. Your app will appear here with full CRUD functionality.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-sm">
                {["Sales CRM","Task Manager","HR Portal","Inventory System"].map(chip => (
                  <button key={chip} onClick={() => { setLocalPrompt(`Build a ${chip} for my team`); }}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E7EB] rounded-full text-[#6B7280] hover:border-[#FF6600] hover:text-[#FF6600] transition-all">
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Properly scaled preview frame
function PreviewFrame({ spec, projectName, viewport }: { spec: AppSpec; projectName?: string; viewport: "desktop" | "tablet" | "mobile" }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!frameRef.current) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(frameRef.current);
    return () => obs.disconnect();
  }, []);

  const targetWidths = { desktop: 1280, tablet: 768, mobile: 375 };
  const targetWidth = targetWidths[viewport];
  const scale = viewport === "desktop" ? 1 : Math.min(1, (containerWidth - 32) / targetWidth);

  return (
    <div ref={frameRef} className="w-full h-full flex items-start justify-center overflow-hidden">
      <div className="relative w-full h-full flex flex-col">
        {/* Browser chrome */}
        <div className="bg-white border border-[#E5E7EB] rounded-t-[14px] px-3 py-2.5 flex items-center gap-2 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-[#F5F5EE] rounded-[6px] px-3 py-1 text-xs text-[#9CA3AF] font-mono flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            {(projectName || "myapp").toLowerCase().replace(/\s+/g,"-")}.oneatlas.dev
          </div>
          <div className="text-[11px] text-[#9CA3AF] font-medium hidden sm:block">{viewportConfig[viewport].label}</div>
        </div>

        {/* Scaled app content */}
        <div className="flex-1 overflow-hidden bg-white border border-t-0 border-[#E5E7EB] rounded-b-[14px]">
          <div
            style={viewport !== "desktop" ? {
              width: targetWidth,
              height: `${100 / scale}%`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            } : { width: "100%", height: "100%" }}
          >
            <AppPreview spec={spec} projectName={projectName} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Make viewportConfig accessible inside component scope
const viewportConfig = {
  desktop: { width: "100%", label: "1280px" },
  tablet:  { width: "768px", label: "768px" },
  mobile:  { width: "375px", label: "375px" },
};

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-[#F5F5EE]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6600] mx-auto mb-3" />
          <p className="text-sm text-[#9CA3AF]">Loading builder…</p>
        </div>
      </div>
    }>
      <BuilderInner />
    </Suspense>
  );
}
