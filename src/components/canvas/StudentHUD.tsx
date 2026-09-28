"use client";

import React from "react";
import { Eye, Radio, Wifi, WifiOff, UserCheck, UserX, Clock, ShieldCheck } from "lucide-react";

interface StudentHUDProps {
  roomId: string;
  isConnected: boolean;
  isTeacherPresent: boolean;
  latencyMs: number;
  lastSequenceId: number;
}

export default function StudentHUD({
  roomId,
  isConnected,
  isTeacherPresent,
  latencyMs,
  lastSequenceId,
}: StudentHUDProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="flex items-center gap-3 backdrop-blur-xl bg-slate-900/90 border border-slate-700/70 shadow-2xl px-4 py-2.5 rounded-full text-slate-100 transition-all duration-200">
        {/* Brand & Room Badge */}
        <div className="flex items-center gap-2 border-r border-slate-700/80 pr-3">
          <span className="flex h-2 w-2 relative">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            )}
          </span>
          <span className="font-semibold text-xs tracking-wider text-slate-200">
            VoxCanvas
          </span>
          <span className="text-[11px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-md font-semibold">
            {roomId}
          </span>
        </div>

        {/* Read-Only Status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-medium text-slate-300">Read-Only</span>
        </div>

        {/* Teacher Presence */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          {isTeacherPresent ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-300">Teacher Active</span>
            </>
          ) : (
            <>
              <UserX className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-amber-300">Teacher Offline</span>
            </>
          )}
        </div>

        {/* Sync Latency */}
        <div className="flex items-center gap-1.5 pl-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span
            className={`text-[11px] font-mono font-medium ${
              latencyMs < 120
                ? "text-emerald-400"
                : latencyMs < 250
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {latencyMs > 0 ? `${latencyMs}ms` : "<15ms"}
          </span>
          {latencyMs > 0 && latencyMs < 120 && (
            <span className="text-[9px] uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 rounded">
              &lt;120ms
            </span>
          )}
        </div>

        {/* Sequence Counter */}
        {lastSequenceId > 0 && (
          <div className="border-l border-slate-700/80 pl-3 text-[10px] font-mono text-slate-400">
            Seq #{lastSequenceId}
          </div>
        )}
      </div>
    </div>
  );
}
