"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/store";
import { MODEL_REGISTRY } from "@/lib/models";
import { useToast } from "@/components/ui/toast";
import {
  Paperclip, Image, Mic, MicOff, ChevronDown,
  X, Zap, ClipboardList, LayoutDashboard,
  Users, Bot, Settings2, FolderKanban, Send
} from "lucide-react";
import type { AppType, ModelId } from "@/types";

const CATEGORY_CARDS = [
  { id: "internal_tool" as AppType, label: "Internal Tool", icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "dashboard" as AppType, label: "Dashboard", icon: LayoutDashboard, color: "text-purple-600", bg: "bg-purple-50" },
  { id: "client_portal" as AppType, label: "Client Portal", icon: Users, color: "text-green-600", bg: "bg-green-50" },
  { id: "crm" as AppType, label: "CRM App", icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
  { id: "ai_workflow" as AppType, label: "AI Workflow", icon: Bot, color: "text-pink-600", bg: "bg-pink-50" },
  { id: "admin_panel" as AppType, label: "Admin Panel", icon: Settings2, color: "text-gray-600", bg: "bg-gray-50" },
];

const SUGGESTION_CHIPS = [
  "Sales CRM",
  "KPI Dashboard",
  "Employee Onboarding App",
  "Customer Support Portal",
  "Inventory Tracker",
  "Approval Workflow",
];

interface PromptInterfaceProps {
  onGenerate?: (prompt: string, model: ModelId, mode: "build" | "plan") => void;
  compact?: boolean;
}

export function PromptInterface({ onGenerate, compact }: PromptInterfaceProps) {
  const router = useRouter();
  const { toast } = useToastSafe();
  const {
    prompt, model, mode,
    setPrompt, setModel, setMode,
    attachedFiles, addAttachedFile, removeAttachedFile,
    addToHistory,
  } = useBuilderStore();

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);

  const currentModel = MODEL_REGISTRY.find(m => m.id === model);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setCharCount(e.target.value.length);
    // Auto-resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(f => addAttachedFile(f));
    e.target.value = "";
  };

  const handleVoice = async () => {
    if (isRecording) {
      mediaRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        // In production, send to transcription API
        setPrompt(prompt + " [voice input transcribed]");
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      // mic not available in demo
      setPrompt(prompt + " [describe what you want to build]");
    }
  };

  const handleChipClick = (chip: string) => {
    const newPrompt = `Build a ${chip} for my team`;
    setPrompt(newPrompt);
    setCharCount(newPrompt.length);
    textareaRef.current?.focus();
  };

  const handleCategoryClick = (cat: AppType) => {
    const labels: Record<AppType, string> = {
      internal_tool: "Build an internal tool for my team that helps manage",
      dashboard: "Create a dashboard that shows",
      client_portal: "Build a client portal where customers can",
      crm: "Create a CRM app to manage leads, contacts, and deals for",
      ai_workflow: "Build an AI workflow that automates",
      admin_panel: "Create an admin panel to manage",
    };
    const newPrompt = labels[cat] + " ";
    setPrompt(newPrompt);
    setCharCount(newPrompt.length);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!prompt.trim()) {
      return;
    }
    addToHistory(prompt);
    if (onGenerate) {
      onGenerate(prompt, model, mode);
    } else {
      // Navigate to builder
      const params = new URLSearchParams({
        prompt: prompt.trim(),
        model,
        mode,
      });
      router.push(`/builder/new?${params.toString()}`);
    }
  };

  return (
    <div className={cn("w-full", compact ? "max-w-2xl" : "max-w-3xl")} style={{ margin: "0 auto" }}>
      {/* Prompt box */}
      <div className="bg-white border border-[#E5E7EB] rounded-[28px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_24px_rgba(0,0,0,0.04)]">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handlePromptChange}
          onKeyDown={handleKeyDown}
          placeholder={compact ? "Describe what you want to build…" : "Describe the internal tool your team needs…"}
          className="w-full resize-none border-none outline-none text-[15px] text-[#111111] placeholder:text-[#9CA3AF] leading-relaxed min-h-[80px] max-h-[240px] overflow-y-auto bg-transparent"
          rows={3}
        />

        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {attachedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5EE] rounded-[8px] text-xs text-[#4B5563]">
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button onClick={() => removeAttachedFile(i)} className="text-[#9CA3AF] hover:text-[#111111]">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0F0EA]">
          <div className="flex items-center gap-2">
            {/* Attach file */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-medium text-[#6B7280] hover:bg-[#F5F5EE] hover:text-[#111111] transition-colors"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
              <span className="hidden sm:inline">File</span>
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileAttach} />

            {/* Attach image */}
            <button
              onClick={() => imageRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-medium text-[#6B7280] hover:bg-[#F5F5EE] hover:text-[#111111] transition-colors"
              title="Attach Image"
            >
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Image</span>
            </button>
            <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileAttach} />

            {/* Mode toggle */}
            <div className="flex items-center bg-[#F5F5EE] rounded-[8px] p-0.5">
              <button
                onClick={() => setMode("build")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all",
                  mode === "build" ? "bg-white text-[#111111] shadow-sm" : "text-[#6B7280] hover:text-[#111111]"
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                Build
              </button>
              <button
                onClick={() => setMode("plan")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all",
                  mode === "plan" ? "bg-white text-[#111111] shadow-sm" : "text-[#6B7280] hover:text-[#111111]"
                )}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Plan
              </button>
            </div>

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[#E5E7EB] bg-white text-xs font-medium text-[#4B5563] hover:border-[#9CA3AF] transition-colors max-w-[150px]"
              >
                <span className="truncate">{currentModel?.name || "Automatic"}</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>

              {showModelPicker && (
                <div className="absolute bottom-full mb-2 left-0 w-60 bg-white border border-[#E5E7EB] rounded-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    {MODEL_REGISTRY.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setModel(m.id); setShowModelPicker(false); }}
                        className={cn(
                          "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] text-left transition-colors hover:bg-[#F5F5EE]",
                          model === m.id ? "bg-[#FFF5EE]" : ""
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", model === m.id ? "bg-[#FF6600]" : "bg-[#E5E7EB]")} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-sm font-medium", model === m.id ? "text-[#FF6600]" : "text-[#111111]")}>{m.name}</span>
                            {m.badge && <span className="text-[10px] font-semibold text-[#FF6600] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full">{m.badge}</span>}
                          </div>
                          <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-tight">{m.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Char count */}
            {charCount > 0 && (
              <span className="text-xs text-[#9CA3AF]">{charCount}</span>
            )}

            {/* Voice */}
            <button
              onClick={handleVoice}
              className={cn(
                "p-2 rounded-[8px] transition-all",
                isRecording
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "text-[#9CA3AF] hover:bg-[#F5F5EE] hover:text-[#6B7280]"
              )}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="h-9 px-4 text-sm rounded-[10px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Generate</span>
              <span className="text-[11px] opacity-60 hidden md:inline">⌘↵</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Category cards */}
      {!compact && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {CATEGORY_CARDS.map(({ id, label, icon: Icon, color, bg }) => (
              <button
                key={id}
                onClick={() => handleCategoryClick(id)}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-[#E5E7EB] rounded-[16px] hover:border-[#9CA3AF] hover:shadow-sm transition-all duration-200"
              >
                <div className={cn("w-8 h-8 rounded-[8px] flex items-center justify-center", bg)}>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <span className="text-xs font-medium text-[#4B5563] text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTION_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 text-xs font-medium text-[#6B7280] bg-white border border-[#E5E7EB] rounded-full hover:border-[#9CA3AF] hover:text-[#111111] transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Safe toast hook (works outside provider too)
function useToastSafe() {
  try {
    const t = useToast();
    return { toast: t };
  } catch {
    return { toast: null };
  }
}
