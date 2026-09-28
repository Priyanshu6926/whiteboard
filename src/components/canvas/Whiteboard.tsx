"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, Editor, TLRecord } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { CanvasManager } from "@/services/canvas/CanvasManager";
import KeyboardHarness from "./KeyboardHarness";
import VoiceHUD from "@/components/voice/VoiceHUD";
import AudioChunkModal from "@/components/voice/AudioChunkModal";
import AgentCursor from "./AgentCursor";
import TelemetryHUD, { TelemetryData } from "@/components/telemetry/TelemetryHUD";
import { useVoiceCommander } from "@/hooks/useVoiceCommander";
import { useNetworkMonitor } from "@/hooks/useNetworkMonitor";
import { useCanvasSync } from "@/hooks/useCanvasSync";
import { useAgentCursor } from "@/hooks/useAgentCursor";
import { Point2D } from "@/services/animation/bezierPath";
import { CanvasAction } from "@/types/actions";
import {
  loadCanvasSnapshot,
  startPeriodicPersistence,
} from "@/services/persistence/indexedDbStore";
import { dispatchCanvasAction } from "@/services/ai/actionDispatcher";
import { routeInference } from "@/services/ai/inferenceRouter";

interface WhiteboardProps {
  onEditorMount?: (editor: Editor) => void;
  children?: React.ReactNode;
}

export default function Whiteboard({ onEditorMount, children }: WhiteboardProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);
  const [lastVoiceAction, setLastVoiceAction] = useState<string | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>("CLASS-101");
  const [pipelineStage, setPipelineStage] =
    useState<TelemetryData["pipelineStage"]>("idle");
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState<number | undefined>();
  const [inferenceEngine, setInferenceEngine] = useState<"cloud" | "edge" | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(0.95);

  const canvasManagerRef = useRef<CanvasManager | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // Initialize visual agent thinking cursor (VIZ-01)
  const { cursorState, animateTo, teleportTo } = useAgentCursor();

  // Initialize room ID from URL search parameter if present (?room=xyz)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room");
      if (roomParam && roomParam.trim()) {
        setRoomId(roomParam.trim());
      }
    }
  }, []);

  const networkMonitor = useNetworkMonitor();
  const networkMonitorRef = useRef(networkMonitor);

  // Keep ref updated for callbacks
  networkMonitorRef.current = networkMonitor;

  // Real-time collaborative broadcast sync (SYNC-01)
  const syncState = useCanvasSync({
    editor,
    roomId,
    role: "teacher",
  });

  // Local persistence and state reconstitution (SYNC-03)
  useEffect(() => {
    if (!editor || !roomId) return;

    // Load initial snapshot from IndexedDB on startup
    loadCanvasSnapshot(roomId).then((records) => {
      if (records && records.length > 0) {
        console.log(`[IndexedDB] Restoring ${records.length} records for room ${roomId}`);
        editor.store.put(records as unknown as TLRecord[]);
      }
    });

    // Start 3-second periodic persistence worker
    const stopPersistence = startPeriodicPersistence(editor, roomId, 3000);
    return () => {
      stopPersistence();
    };
  }, [editor, roomId]);

  /**
   * Helper to derive the screen target point for the 400ms Bezier cursor sweep.
   */
  const getTargetScreenPos = useCallback(
    (action: CanvasAction, ed: Editor): { pos: Point2D; label: string } => {
      const bounds = ed.getViewportPageBounds();
      let pageX = bounds.x + bounds.width * 0.5;
      let pageY = bounds.y + bounds.height * 0.5;
      let label = "Placing...";

      switch (action.action) {
        case "create_mindmap":
          label = `Mindmap: "${action.rootTitle}"`;
          pageX = bounds.x + bounds.width * 0.45;
          pageY = bounds.y + bounds.height * 0.45;
          break;
        case "create_node":
          label = `Placing ${action.nodeType}: "${action.label}"`;
          if (action.relativeToNodeId) {
            const parent = ed.getShape(action.relativeToNodeId as any);
            if (parent) {
              pageX = parent.x + (action.placement === "right" ? 280 : action.placement === "left" ? -280 : 0);
              pageY = parent.y + (action.placement === "bottom" ? 180 : action.placement === "top" ? -180 : 0);
            }
          } else {
            pageX = bounds.x + bounds.width * 0.5 + (Math.random() - 0.5) * 160;
            pageY = bounds.y + bounds.height * 0.5 + (Math.random() - 0.5) * 120;
          }
          break;
        case "connect_nodes":
          label = `Connecting Nodes${action.label ? ` (${action.label})` : ""}`;
          const source = ed.getShape(action.sourceNodeId as any);
          if (source) {
            pageX = source.x;
            pageY = source.y;
          }
          break;
        case "set_countdown_timer":
          label = `Starting ${action.durationSeconds}s Timer`;
          pageX = bounds.x + bounds.width * 0.65;
          pageY = bounds.y + bounds.height * 0.35;
          break;
      }

      const screenPt = ed.pageToViewport({ x: pageX, y: pageY });
      const clampedX = Math.max(90, Math.min(window.innerWidth - 90, screenPt.x));
      const clampedY = Math.max(90, Math.min(window.innerHeight - 90, screenPt.y));

      return { pos: { x: clampedX, y: clampedY }, label };
    },
    []
  );

  const handleVoiceCommand = useCallback(
    async (transcript: string, confidence: number) => {
      const manager = canvasManagerRef.current;
      const currentEditor = editorRef.current;
      if (!manager) return;

      const currentMode = networkMonitorRef.current.effectiveMode;
      setConfidenceScore(confidence);
      setPipelineStage("inferring");

      console.log(
        `[VoiceCommander] Spoken: "${transcript}" (confidence: ${confidence.toFixed(
          2
        )}, engine: ${currentMode})`
      );
      setLastVoiceAction(`Routing via ${currentMode.toUpperCase()}: "${transcript}"...`);

      try {
        const spatialContext = manager.getSpatialContext();
        const result = await routeInference({
          transcript,
          spatialContext,
          preferredEngine: currentMode,
        });

        setInferenceLatencyMs(result.latencyMs);
        setInferenceEngine(result.engine);

        if (result.success && result.action) {
          // VIZ-01: Animate visual agent cursor along cubic Bezier curve for 400ms
          setPipelineStage("animating");
          if (currentEditor) {
            const { pos, label } = getTargetScreenPos(result.action, currentEditor);
            await animateTo(pos, label, 400);
          }

          // Immediately instantiate shape on cursor arrival
          const dispatchResult = dispatchCanvasAction(result.action, manager);
          const engineTag = result.engine === "cloud" ? "Cloud" : "Edge";
          setLastVoiceAction(`[${engineTag} ${result.latencyMs}ms] ${dispatchResult.details}`);
          setPipelineStage("dispatched");

          // Reset pipeline stage to idle after brief display
          setTimeout(() => {
            setPipelineStage("idle");
          }, 1500);
        } else {
          setLastVoiceAction(`Error: ${result.error || "Could not parse command"}`);
          setPipelineStage("error");
        }
      } catch (err) {
        console.error("[VoiceCommander] Inference routing failed:", err);
        setLastVoiceAction("Voice inference failed");
        setPipelineStage("error");
      }
    },
    [animateTo, getTargetScreenPos]
  );

  const voiceCommander = useVoiceCommander({
    onFinalTranscript: handleVoiceCommand,
  });

  // Track listening stage
  useEffect(() => {
    if (voiceCommander.isListening && pipelineStage === "idle") {
      setPipelineStage("listening");
    } else if (!voiceCommander.isListening && pipelineStage === "listening") {
      setPipelineStage("idle");
    }
  }, [voiceCommander.isListening, pipelineStage]);

  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      editorRef.current = mountedEditor;
      mountedEditor.user.updateUserPreferences({ colorScheme: "dark" });
      const manager = new CanvasManager(mountedEditor);
      canvasManagerRef.current = manager;
      setEditor(mountedEditor);
      setCanvasManager(manager);

      // Initialize cursor at center of viewport
      if (typeof window !== "undefined") {
        teleportTo({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 });
      }

      if (onEditorMount) {
        onEditorMount(mountedEditor);
      }
    },
    [onEditorMount, teleportTo]
  );

  const telemetryData: TelemetryData = {
    networkMode: networkMonitor.effectiveMode,
    isOnline: networkMonitor.isOnline,
    sttLatencyMs: 32,
    confidenceScore,
    inferenceLatencyMs,
    inferenceEngine,
    syncLatencyMs: syncState.latencyMs > 0 ? syncState.latencyMs : 14,
    sequenceId: syncState.lastSequenceId,
    pipelineStage,
    lastActionDetail: lastVoiceAction,
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950">
      <Tldraw onMount={handleMount} autoFocus />
      {editor && canvasManager && (
        <>
          {/* Telemetry HUD (VIZ-02) */}
          <TelemetryHUD
            telemetry={telemetryData}
            onToggleMode={networkMonitor.toggleOverride}
          />

          {/* Visual Agent Cursor with cubic Bezier trajectory (VIZ-01) */}
          <AgentCursor cursorState={cursorState} />

          <KeyboardHarness
            canvasManager={canvasManager}
            roomId={roomId}
            viewerCount={syncState.viewerCount}
            isSyncConnected={syncState.isConnected}
          />
          <VoiceHUD
            voiceCommander={voiceCommander}
            networkMonitor={networkMonitor}
            lastParsedAction={lastVoiceAction}
            onSimulateCommand={(text) => handleVoiceCommand(text, 0.95)}
            onOpenAudioChunkModal={() => setIsAudioModalOpen(true)}
          />
          <AudioChunkModal
            isOpen={isAudioModalOpen}
            onClose={() => setIsAudioModalOpen(false)}
            onTranscriptReady={(transcript, confidence) => {
              handleVoiceCommand(transcript, confidence);
            }}
          />
          {children}
        </>
      )}
    </div>
  );
}
