"use client";

import React, { useState } from "react";
import {
  Mic,
  AlertCircle,
  Sparkles,
  AudioWaveform,
  ChevronUp,
  ChevronDown,
  Send,
  Cloud,
  Cpu,
} from "lucide-react";
import { UseVoiceCommanderReturn } from "@/hooks/useVoiceCommander";
import { UseNetworkMonitorReturn } from "@/hooks/useNetworkMonitor";

interface VoiceHUDProps {
  voiceCommander: UseVoiceCommanderReturn;
  networkMonitor?: UseNetworkMonitorReturn;
  lastParsedAction?: string | null;
  onSimulateCommand?: (command: string) => void;
}

export default function VoiceHUD({
  voiceCommander,
  networkMonitor,
  lastParsedAction,
  onSimulateCommand,
}: VoiceHUDProps) {
  const {
    isListening,
    interimTranscript,
    finalTranscript,
    confidence,
    isSupported,
    error,
    toggleListening,
  } = voiceCommander;

  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState("");

  // Format confidence percentage
  const confidencePercent = confidence > 0 ? Math.round(confidence * 100) : null;

  const quickCommands = [
    "Draw mindmap on Solar System",
    "Set 5 minute timer for Sprint",
    "Add note Quantum Computing",
    "Connect last two nodes",
  ];

  const handleSimulate = (text: string) => {
    if (onSimulateCommand && text.trim()) {
      onSimulateCommand(text.trim());
      setInputText("");
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-2 select-none max-w-2xl w-[94%] sm:w-auto">
      {/* Expandable Quick Prompt / Accessibility Drawer */}
      {isExpanded && (
        <div className="backdrop-blur-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-2xl p-3 w-full flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Voice Command Quick Palette
            </span>
            <div className="flex items-center gap-2">
              {networkMonitor && (
                <button
                  onClick={networkMonitor.toggleOverride}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Click to switch between Auto, Cloud, and Edge inference modes"
                >
                  Mode: <span className="text-indigo-300 font-semibold">{networkMonitor.manualOverride.toUpperCase()}</span>
                </button>
              )}
              <span className="text-[10px] text-slate-500">Accessible Input</span>
            </div>
          </div>

          {/* Quick chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleSimulate(cmd)}
                className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700/60 transition active:scale-98 truncate flex items-center justify-between group"
              >
                <span className="truncate">&ldquo;{cmd}&rdquo;</span>
                <span className="text-slate-500 group-hover:text-indigo-400 text-[10px] ml-1 shrink-0 font-mono">
                  run ↵
                </span>
              </button>
            ))}
          </div>

          {/* Fallback Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSimulate(inputText);
            }}
            className="flex items-center gap-1.5 pt-1"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Or type speech command manually (e.g. 'Add card Rocket Science')..."
              className="flex-1 bg-slate-950/80 border border-slate-700/70 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shrink-0"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Glassmorphism Pill */}
      <div className="backdrop-blur-xl bg-slate-900/90 border border-slate-700/60 shadow-2xl rounded-full px-4 py-2.5 flex items-center gap-3.5 transition-all duration-300 w-full sm:w-auto">
        {/* Mic Toggle Button */}
        <button
          onClick={toggleListening}
          disabled={!isSupported}
          className={`relative group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shrink-0 ${
            !isSupported
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
              : isListening
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70"
          }`}
          title={
            !isSupported
              ? "Speech recognition not supported in this browser"
              : isListening
              ? "Stop listening"
              : "Start voice command listening"
          }
          aria-label={isListening ? "Mute microphone" : "Unmute microphone"}
        >
          {isListening && (
            <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping opacity-75 pointer-events-none" />
          )}

          {isListening ? (
            <AudioWaveform className="w-5 h-5 animate-pulse text-white" />
          ) : (
            <Mic className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
          )}
        </button>

        {/* Dynamic Status & Transcript Display */}
        <div className="flex flex-col justify-center min-w-[190px] max-w-xs sm:max-w-md md:max-w-lg overflow-hidden py-0.5">
          {!isSupported ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Speech recognition unsupported in this browser</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          ) : interimTranscript ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-emerald-300 truncate tracking-wide">
                &ldquo;{interimTranscript}&rdquo;
              </p>
            </div>
          ) : finalTranscript ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <p className="text-xs sm:text-sm text-slate-200 truncate">
                &ldquo;{finalTranscript}&rdquo;
              </p>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-xs text-slate-400 italic">
                Listening... Speak naturally (e.g. &ldquo;Draw mindmap on Solar System&rdquo;)
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Click mic or use quick palette to command canvas
            </p>
          )}

          {/* Sub-label for parsed action if present */}
          {lastParsedAction && (
            <div className="text-[10px] text-indigo-300 font-mono flex items-center gap-1 mt-0.5 truncate">
              <span className="text-slate-400">Action:</span>
              <span className="text-emerald-400 font-medium truncate">{lastParsedAction}</span>
            </div>
          )}
        </div>

        {/* Network & Engine Mode Indicator (ROUT-01, ROUT-02, ROUT-03) */}
        {networkMonitor && (
          <button
            onClick={networkMonitor.toggleOverride}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all hover:scale-105 active:scale-95 shrink-0 bg-slate-950/70 border-slate-700/60"
            title={`Active inference engine: ${
              networkMonitor.effectiveMode === "cloud" ? "Google Gemini (Cloud)" : "Ollama / Local (Edge)"
            }. Click to cycle: Auto, Force Cloud, Force Edge.`}
          >
            {networkMonitor.effectiveMode === "cloud" ? (
              <Cloud className="w-3 h-3 text-emerald-400" />
            ) : (
              <Cpu className="w-3 h-3 text-amber-400" />
            )}
            <span
              className={
                networkMonitor.effectiveMode === "cloud"
                  ? "text-emerald-300 font-medium"
                  : "text-amber-300 font-medium"
              }
            >
              {networkMonitor.effectiveMode === "cloud" ? "Cloud" : "Edge"}
            </span>
            {networkMonitor.manualOverride !== "auto" && (
              <span className="text-[8px] px-1 rounded bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700/40">
                LOCKED
              </span>
            )}
            {networkMonitor.latencyMs !== null && (
              <span className="text-slate-500 text-[9px]">
                {networkMonitor.latencyMs}ms
              </span>
            )}
          </button>
        )}

        {/* Confidence Badge */}
        {confidencePercent !== null && (
          <div
            className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border shrink-0 ${
              confidencePercent >= 80
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                : "bg-amber-950/60 text-amber-300 border-amber-800/50"
            }`}
            title={`Speech transcription confidence: ${confidencePercent}%`}
          >
            <span>{confidencePercent}% match</span>
          </div>
        )}

        {/* Quick Drawer Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title={isExpanded ? "Collapse quick commands" : "Open quick commands & manual input"}
          aria-label={isExpanded ? "Collapse palette" : "Open palette"}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
