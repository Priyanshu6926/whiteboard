"use client";

import React, { useState } from "react";
import {
  X,
  Radio,
  Square,
  Sparkles,
  Volume2,
  AlertCircle,
  Clock,
  Send,
  Zap,
} from "lucide-react";
import { useAudioChunkRecorder } from "@/hooks/useAudioChunkRecorder";

interface AudioChunkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReady: (transcript: string, confidence: number) => void;
}

interface CapturedChunk {
  id: string;
  time: string;
  durationMs: number;
  transcript?: string;
  confidence?: number;
  status: "transcribing" | "success" | "error";
}

export default function AudioChunkModal({
  isOpen,
  onClose,
  onTranscriptReady,
}: AudioChunkModalProps) {
  const [chunks, setChunks] = useState<CapturedChunk[]>([]);
  const [autoDispatch, setAutoDispatch] = useState<boolean>(true);

  const handleChunkReady = async (blob: Blob, durationMs: number) => {
    const chunkId = `chunk-${Date.now()}`;
    const newChunk: CapturedChunk = {
      id: chunkId,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      durationMs,
      status: "transcribing",
    };

    setChunks((prev) => [newChunk, ...prev]);

    try {
      const formData = new FormData();
      formData.append("file", blob, "chunk.webm");

      const res = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success && data.transcript) {
        setChunks((prev) =>
          prev.map((c) =>
            c.id === chunkId
              ? {
                  ...c,
                  status: "success",
                  transcript: data.transcript,
                  confidence: data.confidence,
                }
              : c
          )
        );

        if (autoDispatch) {
          onTranscriptReady(data.transcript, data.confidence || 0.9);
        }
      } else {
        setChunks((prev) =>
          prev.map((c) => (c.id === chunkId ? { ...c, status: "error" } : c))
        );
      }
    } catch (err) {
      console.error("[AudioChunk] Failed to transcribe chunk:", err);
      setChunks((prev) =>
        prev.map((c) => (c.id === chunkId ? { ...c, status: "error" } : c))
      );
    }
  };

  const {
    isRecording,
    audioLevel,
    chunkCount,
    error,
    isSupported,
    startRecording,
    stopRecording,
    reset,
  } = useAudioChunkRecorder({
    timesliceMs: 3000,
    onChunkReady: handleChunkReady,
  });

  const handleSimulateChunk = async () => {
    const chunkId = `chunk-sim-${Date.now()}`;
    const newChunk: CapturedChunk = {
      id: chunkId,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      durationMs: 3000,
      status: "transcribing",
    };
    setChunks((prev) => [newChunk, ...prev]);

    try {
      const formData = new FormData();
      formData.append("simulatedText", "Draw mindmap on Rural Classroom Tech");

      const res = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.transcript) {
        setChunks((prev) =>
          prev.map((c) =>
            c.id === chunkId
              ? {
                  ...c,
                  status: "success",
                  transcript: data.transcript,
                  confidence: data.confidence,
                }
              : c
          )
        );
        if (autoDispatch) {
          onTranscriptReady(data.transcript, data.confidence || 0.95);
        }
      }
    } catch {
      setChunks((prev) =>
        prev.map((c) => (c.id === chunkId ? { ...c, status: "error" } : c))
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="backdrop-blur-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-2xl p-5 max-w-lg w-full flex flex-col gap-4 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                MediaRecorder 3s Chunked Audio Fallback
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  VOIC-02
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Slices audio into 3-second WebM buffers for noisy / offline environments
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopRecording();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning / Error */}
        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Audio Level Meter & Controls */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-rose-500 animate-ping" : "bg-slate-600"}`} />
              <span className="text-xs font-medium text-slate-300">
                {isRecording ? `Recording 3s slices (${chunkCount} captured)` : "Recorder Idle"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>3000ms window</span>
            </div>
          </div>

          {/* VU Meter Visualizer Bar */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
                style={{ width: `${isRecording ? audioLevel : 0}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
              {isRecording ? `${audioLevel}%` : "0%"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!isSupported}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-rose-600/20 active:scale-98"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Start Chunk Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Recording</span>
              </button>
            )}

            <button
              onClick={handleSimulateChunk}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition active:scale-98 shrink-0"
              title="Inject simulated 3-second audio slice for testing"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Chunk</span>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between px-1 text-xs">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDispatch}
              onChange={(e) => setAutoDispatch(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
            />
            <span>Auto-dispatch transcripts to canvas</span>
          </label>
          {chunks.length > 0 && (
            <button
              onClick={() => {
                setChunks([]);
                reset();
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300"
            >
              Clear timeline
            </button>
          )}
        </div>

        {/* Chunk Timeline */}
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {chunks.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No audio chunks recorded yet. Click &ldquo;Start Chunk Recording&rdquo; or &ldquo;Simulate Chunk&rdquo;.
            </div>
          ) : (
            chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between gap-3 animate-in fade-in"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {chunk.time}
                  </span>
                  {chunk.status === "transcribing" ? (
                    <span className="text-slate-400 italic text-[11px] animate-pulse">
                      Transcribing 3s WebM chunk...
                    </span>
                  ) : chunk.status === "success" ? (
                    <span className="text-slate-200 font-medium truncate">
                      &ldquo;{chunk.transcript}&rdquo;
                    </span>
                  ) : (
                    <span className="text-rose-400 text-[11px]">Transcription failed</span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {chunk.confidence && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                      {Math.round(chunk.confidence * 100)}%
                    </span>
                  )}
                  {chunk.transcript && !autoDispatch && (
                    <button
                      onClick={() => onTranscriptReady(chunk.transcript!, chunk.confidence || 0.9)}
                      className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] flex items-center gap-1"
                    >
                      <Send className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
