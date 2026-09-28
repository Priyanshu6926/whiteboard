"use client";

import React, { useState } from "react";
import {
  Activity,
  Cloud,
  Cpu,
  Mic,
  Wifi,
  WifiOff,
  Zap,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface TelemetryData {
  networkMode: "cloud" | "edge";
  isOnline: boolean;
  sttLatencyMs?: number;
  confidenceScore?: number | null;
  inferenceLatencyMs?: number;
  inferenceEngine?: "cloud" | "edge" | null;
  syncLatencyMs?: number;
  sequenceId?: number;
  pipelineStage: "idle" | "listening" | "inferring" | "animating" | "dispatched" | "error";
  lastActionDetail?: string | null;
}

interface TelemetryHUDProps {
  telemetry: TelemetryData;
  onToggleMode?: () => void;
}

export default function TelemetryHUD({ telemetry, onToggleMode }: TelemetryHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    networkMode,
    isOnline,
    sttLatencyMs = 28,
    confidenceScore,
    inferenceLatencyMs,
    inferenceEngine,
    syncLatencyMs = 12,
    sequenceId = 0,
    pipelineStage,
    lastActionDetail,
  } = telemetry;

  const getStageBadge = (stage: TelemetryData["pipelineStage"]) => {
    switch (stage) {
      case "listening":
        return { label: "1. Listening STT", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
      case "inferring":
        return { label: "2. LLM Reasoning", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30" };
      case "animating":
        return { label: "3. Bezier Cursor (400ms)", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" };
      case "dispatched":
        return { label: "4. Dispatched", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" };
      case "error":
        return { label: "Failed", color: "text-rose-400 bg-rose-400/10 border-rose-400/30" };
      default:
        return { label: "Ready", color: "text-slate-400 bg-slate-800/40 border-slate-700/50" };
    }
  };

  const stageBadge = getStageBadge(pipelineStage);

  return (
    <div className="fixed top-4 left-4 z-50 pointer-events-auto flex flex-col gap-1.5 max-w-xs select-none">
      {/* Telemetry Header Pill */}
      <div className="backdrop-blur-xl bg-slate-900/90 border border-slate-700/70 shadow-2xl rounded-xl p-2.5 text-slate-100 flex flex-col gap-2 transition-all duration-200">
        <div className="flex items-center justify-between gap-3">
          {/* Mode Pill */}
          <button
            onClick={onToggleMode}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition cursor-pointer text-xs"
            title="Click to toggle engine routing mode"
          >
            {networkMode === "cloud" ? (
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-200">
              {networkMode} Mode
            </span>
          </button>

          {/* Pipeline Stage Indicator */}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${stageBadge.color}`}
          >
            {stageBadge.label}
          </span>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Toggle telemetry inspector"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Compact Quick Latency Row */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">STT</span>
            <span className="text-slate-200 font-medium">{sttLatencyMs}ms</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">LLM</span>
            <span className="text-slate-200 font-medium">
              {inferenceLatencyMs ? `${inferenceLatencyMs}ms` : "—"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">Sync</span>
            <span className="text-emerald-400 font-medium">&lt;{syncLatencyMs}ms</span>
          </div>
        </div>

        {/* Expanded Deep Metrics Drawer */}
        {isExpanded && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 animate-in fade-in duration-150 text-[11px]">
            {/* Confidence & Network */}
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <Mic className="w-3 h-3 text-amber-400" />
                Confidence
              </span>
              <span className="font-mono text-indigo-300 font-semibold">
                {confidenceScore !== null && confidenceScore !== undefined
                  ? `${Math.round(confidenceScore * 100)}%`
                  : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-rose-400" />
                )}
                Network Link
              </span>
              <span className={`font-mono ${isOnline ? "text-emerald-400" : "text-rose-400"}`}>
                {isOnline ? "Connected" : "Offline"}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <Layers className="w-3 h-3 text-cyan-400" />
                Delta Sequence
              </span>
              <span className="font-mono text-cyan-300">
                Seq #{sequenceId}
              </span>
            </div>

            {lastActionDetail && (
              <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[10px] text-slate-300 font-mono break-words">
                {lastActionDetail}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
