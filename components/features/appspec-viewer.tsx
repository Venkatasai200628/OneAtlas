"use client";
import { useState } from "react";
import { useBuilderStore } from "@/store";
import { cn } from "@/lib/utils";
import { Copy, Check, ChevronDown, ChevronRight, Database, Globe, Lock, Workflow, Layers } from "lucide-react";
import type { AppSpec } from "@/types";

export function AppSpecViewer() {
  const { appSpec } = useBuilderStore();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["pages", "api", "schema"]));

  if (!appSpec) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border border-[#E5E7EB] rounded-[20px]">
        <p className="text-sm text-[#9CA3AF]">AppSpec will appear here after generation</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(appSpec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB] bg-[#F5F5EE]">
        <div>
          <h3 className="text-sm font-semibold text-[#111111]">AppSpec</h3>
          <p className="text-xs text-[#9CA3AF]">v{appSpec.version} · {appSpec.id}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6B7280] border border-[#E5E7EB] bg-white rounded-[8px] hover:border-[#9CA3AF] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        <Section
          id="pages"
          label="Pages"
          icon={<Globe className="w-4 h-4 text-blue-500" />}
          count={appSpec.pages.length}
          expanded={expanded.has("pages")}
          onToggle={() => toggle("pages")}
        >
          {appSpec.pages.map(p => (
            <div key={p.path} className="flex items-start gap-2 py-2 border-b border-[#F5F5EE] last:border-0">
              <code className="text-xs bg-[#F5F5EE] px-2 py-0.5 rounded font-mono text-[#4B5563] shrink-0">{p.path}</code>
              <div>
                <p className="text-xs font-medium text-[#111111]">{p.name}</p>
                <p className="text-[11px] text-[#9CA3AF]">{p.components.join(", ")}</p>
              </div>
            </div>
          ))}
        </Section>

        <Section
          id="api"
          label="API Endpoints"
          icon={<Globe className="w-4 h-4 text-green-500" />}
          count={appSpec.apiEndpoints.length}
          expanded={expanded.has("api")}
          onToggle={() => toggle("api")}
        >
          {appSpec.apiEndpoints.slice(0, 12).map((ep, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#F5F5EE] last:border-0">
              <span className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0",
                ep.method === "GET" ? "bg-blue-50 text-blue-600" :
                ep.method === "POST" ? "bg-green-50 text-green-600" :
                ep.method === "PUT" ? "bg-yellow-50 text-yellow-600" :
                "bg-red-50 text-red-600"
              )}>
                {ep.method}
              </span>
              <code className="text-xs text-[#4B5563] font-mono truncate">{ep.path}</code>
              {ep.authRequired && <Lock className="w-3 h-3 text-[#9CA3AF] shrink-0" />}
            </div>
          ))}
          {appSpec.apiEndpoints.length > 12 && (
            <p className="text-xs text-[#9CA3AF] pt-2">+{appSpec.apiEndpoints.length - 12} more endpoints</p>
          )}
        </Section>

        <Section
          id="schema"
          label="Data Schema"
          icon={<Database className="w-4 h-4 text-purple-500" />}
          count={appSpec.dataSchema.entities.length}
          expanded={expanded.has("schema")}
          onToggle={() => toggle("schema")}
        >
          {appSpec.dataSchema.entities.map(entity => (
            <div key={entity.name} className="mb-3 last:mb-0">
              <p className="text-xs font-semibold text-[#111111] mb-1">{entity.name}</p>
              <div className="space-y-1">
                {entity.fields.map(f => (
                  <div key={f.name} className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#4B5563] font-mono">{f.name}</span>
                    <span className="text-[#9CA3AF]">{f.type}</span>
                    {f.required && <span className="text-[#FF6600]">required</span>}
                    {f.unique && <span className="text-blue-500">unique</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section
          id="auth"
          label="Auth Rules"
          icon={<Lock className="w-4 h-4 text-yellow-500" />}
          count={appSpec.authRules.length}
          expanded={expanded.has("auth")}
          onToggle={() => toggle("auth")}
        >
          {appSpec.authRules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 text-xs border-b border-[#F5F5EE] last:border-0">
              <code className="font-mono text-[#4B5563]">{rule.path}</code>
              <span className={rule.action === "allow" ? "text-green-600" : "text-red-600"}>{rule.action}</span>
              {rule.roles.length > 0 && <span className="text-[#9CA3AF]">({rule.roles.join(", ")})</span>}
            </div>
          ))}
        </Section>

        {appSpec.workflowStubs.length > 0 && (
          <Section
            id="workflows"
            label="Workflow Stubs"
            icon={<Workflow className="w-4 h-4 text-pink-500" />}
            count={appSpec.workflowStubs.length}
            expanded={expanded.has("workflows")}
            onToggle={() => toggle("workflows")}
          >
            {appSpec.workflowStubs.map(ws => (
              <div key={ws.id} className="py-2 border-b border-[#F5F5EE] last:border-0">
                <p className="text-xs font-medium text-[#111111]">{ws.name}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {ws.triggerEntity}.{ws.triggerEvent} → {ws.actionType}
                </p>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  id, label, icon, count, expanded, onToggle, children
}: {
  id: string; label: string; icon: React.ReactNode; count: number;
  expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-[#E5E7EB] rounded-[14px] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-[#F9F9F7] hover:bg-[#F5F5EE] transition-colors text-left"
      >
        {icon}
        <span className="text-sm font-semibold text-[#111111] flex-1">{label}</span>
        <span className="text-xs text-[#9CA3AF] bg-white border border-[#E5E7EB] px-2 py-0.5 rounded-full">{count}</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />}
      </button>
      {expanded && (
        <div className="px-4 py-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
