"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store";
import { STAGE_LABELS } from "@/lib/models";
import { formatLatency, formatCost } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import type { GenerationStage } from "@/types";

export function GenerationPanel() {
  const { stages, isStreaming, streamError, currentJob } = useBuilderStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stages]);

  if (!currentJob && stages.length === 0) return null;

  const totalLatency = currentJob?.totalLatencyMs;
  const totalCost = currentJob?.costUsd;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111111]">Generation Progress</h3>
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-xs text-[#FF6600]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Streaming…</span>
          </div>
        )}
        {!isStreaming && streamError && (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </div>
        )}
        {!isStreaming && !streamError && stages.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete</span>
          </div>
        )}
      </div>

      {/* Stage timeline */}
      <div className="space-y-2">
        {stages.map((stage, i) => (
          <StageRow key={stage.name} stage={stage} index={i} />
        ))}
      </div>

      {/* Reconnecting state */}
      {streamError === "reconnecting" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7280] p-3 bg-[#F5F5EE] rounded-[10px]">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Connection lost — attempting to reconnect…</span>
        </div>
      )}

      {/* Error detail */}
      {streamError && streamError !== "reconnecting" && (
        <ErrorPanel error={streamError} stages={stages} />
      )}

      {/* Summary */}
      {!isStreaming && !streamError && (totalLatency || totalCost) && (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center gap-4 text-xs text-[#9CA3AF]">
          {totalLatency && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatLatency(totalLatency)}</span>
            </div>
          )}
          {totalCost && (
            <div>Cost: {formatCost(totalCost)}</div>
          )}
          {currentJob?.model && (
            <div>Model: {currentJob.model}</div>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function StageRow({ stage, index }: { stage: GenerationStage; index: number }) {
  const label = STAGE_LABELS[stage.name] || stage.name;

  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">
        {stage.status === "complete" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {stage.status === "failed" && <XCircle className="w-4 h-4 text-red-500" />}
        {stage.status === "running" && <Loader2 className="w-4 h-4 text-[#FF6600] animate-spin" />}
        {stage.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-[#E5E7EB]" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-sm font-medium",
            stage.status === "running" ? "text-[#FF6600]" :
            stage.status === "complete" ? "text-[#111111]" :
            stage.status === "failed" ? "text-red-600" :
            "text-[#9CA3AF]"
          )}>
            {label}
          </span>
          {stage.latencyMs && (
            <span className="text-xs text-[#9CA3AF] ml-2 shrink-0">
              {formatLatency(stage.latencyMs)}
            </span>
          )}
        </div>

        {stage.status === "running" && (
          <div className="mt-1 h-1 bg-[#F5F5EE] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF6600] to-[#FF8533] rounded-full animate-pulse w-2/3" />
          </div>
        )}

        {stage.status === "failed" && stage.error && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{stage.error}</p>
        )}
      </div>
    </div>
  );
}

function ErrorPanel({ error, stages }: { error: string; stages: GenerationStage[] }) {
  const failedStage = stages.find(s => s.status === "failed");

  return (
    <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-[14px]">
      <div className="flex items-start gap-2.5">
        <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Generation Failed</p>
          {failedStage && (
            <div className="mt-2 space-y-1 text-xs text-red-600">
              <p><span className="font-medium">Stage:</span> {STAGE_LABELS[failedStage.name] || failedStage.name}</p>
              {failedStage.error && <p><span className="font-medium">Error:</span> {failedStage.error}</p>}
            </div>
          )}
          <p className="text-xs text-red-500 mt-2">{error}</p>
        </div>
      </div>
    </div>
  );
}
