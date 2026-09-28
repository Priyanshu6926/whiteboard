"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { AgentCursorState } from "@/hooks/useAgentCursor";

interface AgentCursorProps {
  cursorState: AgentCursorState;
}

export default function AgentCursor({ cursorState }: AgentCursorProps) {
  const {
    x,
    y,
    angle,
    isVisible,
    isAnimating,
    label,
    trail,
    showRipple,
    ripplePos,
  } = cursorState;

  if (!isVisible && !showRipple) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none">
      {/* Expanding impact ripple wave on destination arrival (VIZ-01) */}
      {showRipple && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400 bg-cyan-400/20 animate-ping"
          style={{
            left: ripplePos.x,
            top: ripplePos.y,
            width: "56px",
            height: "56px",
            animationDuration: "600ms",
          }}
        />
      )}

      {/* Trailing comet particles along the cubic Bezier path */}
      {trail.map((pt) => (
        <div
          key={pt.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300 blur-[1px]"
          style={{
            left: pt.x,
            top: pt.y,
            width: `${Math.max(3, pt.opacity * 7)}px`,
            height: `${Math.max(3, pt.opacity * 7)}px`,
            opacity: pt.opacity * 0.7,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Main Agent Cursor Pointer & Badge */}
      {isVisible && (
        <div
          className="absolute transition-transform duration-75 ease-out"
          style={{
            left: x,
            top: y,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* Subtle cursor aura glow */}
          <div className="absolute -inset-2 rounded-full bg-indigo-500/25 blur-md animate-pulse" />

          {/* Futuristic SVG Cursor Pointer */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_2px_10px_rgba(99,102,241,0.7)]"
            style={{
              transform: `rotate(${Math.min(45, Math.max(-45, angle * 0.4))}deg)`,
              transformOrigin: "top left",
            }}
          >
            <path
              d="M3 2L11 25L15 15L25 11L3 2Z"
              fill="url(#agentCursorGradient)"
              stroke="#e0e7ff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient
                id="agentCursorGradient"
                x1="3"
                y1="2"
                x2="25"
                y2="25"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#6366f1" />
                <stop offset="0.6" stopColor="#06b6d4" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Agent Action Badge */}
          {label && (
            <div className="absolute left-6 top-3 flex items-center gap-1.5 backdrop-blur-md bg-slate-900/90 border border-indigo-500/50 shadow-xl px-2.5 py-1 rounded-full text-slate-100 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-[11px] font-medium tracking-wide bg-gradient-to-r from-indigo-200 via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
                {label}
              </span>
              {isAnimating && (
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
