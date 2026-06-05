"use client";
import { useState } from "react";
import { MOCK_DEPLOYMENTS, MOCK_PROJECTS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ExternalLink, RefreshCw, RotateCcw, Globe, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState(MOCK_DEPLOYMENTS);
  const [redeploying, setRedeploying] = useState<string | null>(null);

  const handleRedeploy = (id: string) => {
    setRedeploying(id);
    setTimeout(() => {
      setDeployments(prev => prev.map(d =>
        d.id === id ? { ...d, status: "live" as const, deployedAt: new Date().toISOString() } : d
      ));
      setRedeploying(null);
    }, 2500);
  };

  const getProjectName = (projectId: string) =>
    MOCK_PROJECTS.find(p => p.id === projectId)?.name || "Unknown Project";

  const statusIcon = (status: string) => {
    if (status === "live") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "building") return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const statusVariant = (status: string): "success" | "warning" | "error" | "default" => {
    if (status === "live") return "success";
    if (status === "building") return "warning";
    if (status === "failed") return "error";
    return "default";
  };

  return (
    <div className="p-6 md:p-8 max-w-[1280px]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#111111] tracking-[-0.02em]">Deployments</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Track and manage all your app deployments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Deployments", value: deployments.length + 3, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Live", value: deployments.filter(d => d.status === "live").length, color: "text-green-600", bg: "bg-green-50" },
          { label: "Building", value: 0, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Failed", value: 1, color: "text-red-600", bg: "bg-red-50" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#E5E7EB] rounded-[20px] p-5">
            <p className="text-xs font-medium text-[#9CA3AF] mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Deployments table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#111111]">Deployment History</h2>
        </div>

        <div className="divide-y divide-[#F0F0EA]">
          {/* Extra mock entries */}
          {[
            { id: "dep-hist-1", projectId: "proj-3", subdomain: "kpi-dash", status: "live", url: "https://kpi-dash.oneatlas.dev", deployedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: "dep-hist-2", projectId: "proj-4", subdomain: "hr-portal", status: "failed", url: "", deployedAt: new Date(Date.now() - 3600000 * 2).toISOString(), createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
            { id: "dep-hist-3", projectId: "proj-5", subdomain: "inventory-v1", status: "live", url: "https://inventory-v1.oneatlas.dev", deployedAt: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
            ...deployments,
          ].map((dep) => (
            <div key={dep.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F9F9F7] transition-colors">
              {/* Status */}
              <div className="shrink-0">{statusIcon(dep.status)}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-[#111111] truncate">
                    {getProjectName(dep.projectId)}
                  </p>
                  <Badge variant={statusVariant(dep.status)}>{dep.status}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="font-mono truncate">{dep.subdomain}.oneatlas.dev</span>
                </div>
              </div>

              {/* Time */}
              <div className="text-xs text-[#9CA3AF] shrink-0 hidden md:block">
                {formatRelativeTime(dep.deployedAt)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {dep.status === "live" && dep.url && (
                  <a
                    href={dep.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:bg-[#F5F5EE] hover:text-[#6B7280] transition-colors"
                    title="Open live app"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleRedeploy(dep.id)}
                  disabled={redeploying === dep.id}
                  className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:bg-[#F5F5EE] hover:text-[#6B7280] transition-colors disabled:opacity-50"
                  title="Redeploy"
                >
                  {redeploying === dep.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCw className="w-4 h-4" />}
                </button>
                <button
                  className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:bg-[#F5F5EE] hover:text-[#6B7280] transition-colors"
                  title="Rollback"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
