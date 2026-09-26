"use client";

import React from "react";
import { Sparkles, Keyboard, Activity, RefreshCw } from "lucide-react";

interface HarnessHUDProps {
  nodeCount: number;
  lastAction: string | null;
  onActionClick: (action: string) => void;
  onClear: () => void;
}

export default function HarnessHUD({
  nodeCount,
  lastAction,
  onActionClick,
  onClear,
}: HarnessHUDProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
      {/* HUD Header & Status Card */}
      <div className="backdrop-blur-xl bg-slate-900/85 border border-slate-700/60 shadow-2xl rounded-xl p-3.5 text-slate-100 flex flex-col gap-2.5 transition-all duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-xs tracking-wider uppercase text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              VoxCanvas Engine
            </span>
          </div>
          <span className="text-[11px] font-mono bg-slate-800/80 px-2 py-0.5 rounded-full text-slate-300 border border-slate-700/50">
            {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
          </span>
        </div>

        {/* Action feedback */}
        <div className="flex items-center gap-2 text-xs bg-slate-950/60 rounded-lg p-2 border border-slate-800/70 font-mono">
          <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-slate-400 text-[11px] truncate">
            {lastAction ? (
              <span className="text-emerald-300 font-medium">{lastAction}</span>
            ) : (
              "Ready. Press hotkey or click buttons below."
            )}
          </span>
        </div>

        {/* Hotkey Controls Matrix */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-0.5">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3 h-3 text-slate-400" /> Test Harness Hotkeys
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onActionClick("node")}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/70 active:scale-95 border border-slate-700/40 text-xs transition text-left"
              title="Add a new note to the canvas"
            >
              <span className="text-slate-200">Add Note</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900/90 text-indigo-300 rounded border border-slate-700">
                N
              </kbd>
            </button>

            <button
              onClick={() => onActionClick("mindmap")}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/70 active:scale-95 border border-slate-700/40 text-xs transition text-left"
              title="Generate a mindmap tree with collision-free branches"
            >
              <span className="text-slate-200">Mindmap</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900/90 text-indigo-300 rounded border border-slate-700">
                M
              </kbd>
            </button>

            <button
              onClick={() => onActionClick("connect")}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/70 active:scale-95 border border-slate-700/40 text-xs transition text-left"
              title="Connect two recent nodes with an arrow"
            >
              <span className="text-slate-200">Connect</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900/90 text-indigo-300 rounded border border-slate-700">
                C
              </kbd>
            </button>

            <button
              onClick={() => onActionClick("timer")}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/70 active:scale-95 border border-slate-700/40 text-xs transition text-left"
              title="Spawn a 60-second countdown card"
            >
              <span className="text-slate-200">Timer</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900/90 text-indigo-300 rounded border border-slate-700">
                T
              </kbd>
            </button>
          </div>

          <button
            onClick={onClear}
            className="mt-1 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-[11px] font-medium border border-rose-800/40 transition active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
