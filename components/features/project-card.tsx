"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, APP_TYPE_LABELS, APP_TYPE_COLORS, STATUS_COLORS, formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Trash2, MoreVertical, Zap, Globe } from "lucide-react";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
  onRedeploy?: (id: string) => void;
}

export function ProjectCard({ project, onDelete, onRedeploy }: ProjectCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const typeColor = APP_TYPE_COLORS[project.appType] || "bg-gray-50 text-gray-700 border-gray-200";
  const statusVariant = project.status === "deployed" ? "success"
    : project.status === "generating" ? "info"
    : project.status === "failed" ? "error" : "default";

  return (
    <div className="group bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", typeColor)}>
              {APP_TYPE_LABELS[project.appType] || project.appType}
            </span>
            <Badge variant={statusVariant}>
              {project.status === "deployed" ? "live" : project.status}
            </Badge>
          </div>
          <h3 className="text-[16px] font-semibold text-[#111111] truncate">{project.name}</h3>
        </div>

        {/* Menu */}
        <div className="relative ml-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:bg-[#F5F5EE] hover:text-[#6B7280] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10 overflow-hidden">
              <button
                onClick={() => { onRedeploy?.(project.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F5F5EE] transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Redeploy
              </button>
              {project.subdomain && (
                <a
                  href={`https://${project.subdomain}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4B5563] hover:bg-[#F5F5EE] transition-colors"
                >
                  <Globe className="w-4 h-4" /> Open Live App
                </a>
              )}
              <button
                onClick={() => { onDelete?.(project.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prompt preview */}
      <p className="text-xs text-[#9CA3AF] line-clamp-2 mb-4 flex-1 leading-relaxed">
        {project.prompt}
      </p>

      {/* Subdomain */}
      {project.subdomain && (
        <div className="flex items-center gap-1.5 mb-4 text-xs text-[#6B7280] bg-[#F5F5EE] rounded-[8px] px-3 py-2">
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate font-mono">{project.subdomain}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EA]">
        <span className="text-xs text-[#9CA3AF]">
          Updated {formatRelativeTime(project.updatedAt)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRedeploy?.(project.id)}
            className="p-1.5 rounded-[8px] text-[#9CA3AF] hover:bg-[#F5F5EE] hover:text-[#6B7280] transition-colors"
            title="Redeploy"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/builder/${project.id}`)}
          >
            <Zap className="w-3.5 h-3.5" />
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}
