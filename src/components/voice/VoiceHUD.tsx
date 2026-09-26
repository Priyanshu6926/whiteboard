"use client";

import React from "react";
import { Mic, MicOff, AlertCircle, Sparkles, AudioWaveform } from "lucide-react";
import { UseVoiceCommanderReturn } from "@/hooks/useVoiceCommander";

interface VoiceHUDProps {
  voiceCommander: UseVoiceCommanderReturn;
  lastParsedAction?: string | null;
}

export default function VoiceHUD({
  voiceCommander,
  lastParsedAction,
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

  // Format confidence percentage
  const confidencePercent = confidence > 0 ? Math.round(confidence * 100) : null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-2 select-none max-w-2xl w-[92%] sm:w-auto">
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
          {/* Pulsing ring when listening */}
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
        <div className="flex flex-col justify-center min-w-[200px] max-w-md sm:max-w-lg overflow-hidden py-0.5">
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
              Click mic or use hotkeys to command canvas
            </p>
          )}

          {/* Sub-label for parsed action if present */}
          {lastParsedAction && (
            <div className="text-[10px] text-indigo-300 font-mono flex items-center gap-1 mt-0.5 truncate">
              <span>Executing:</span>
              <span className="text-emerald-400 font-medium">{lastParsedAction}</span>
            </div>
          )}
        </div>

        {/* Confidence Badge */}
        {confidencePercent !== null && (
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border shrink-0 ${
              confidencePercent >= 80
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                : "bg-amber-950/60 text-amber-300 border-amber-800/50"
            }`}
            title={`Speech transcription confidence: ${confidencePercent}%`}
          >
            <span>{confidencePercent}% match</span>
          </div>
        )}
      </div>
    </div>
  );
}
