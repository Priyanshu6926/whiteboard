"use client";

import React, { useCallback, useRef, useState } from "react";
import { Tldraw, Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { CanvasManager } from "@/services/canvas/CanvasManager";
import KeyboardHarness from "./KeyboardHarness";
import VoiceHUD from "@/components/voice/VoiceHUD";
import { useVoiceCommander } from "@/hooks/useVoiceCommander";
import { useNetworkMonitor } from "@/hooks/useNetworkMonitor";
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
  const canvasManagerRef = useRef<CanvasManager | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const networkMonitor = useNetworkMonitor();
  const networkMonitorRef = useRef(networkMonitor);

  // Keep ref updated for callbacks
  networkMonitorRef.current = networkMonitor;

  const handleVoiceCommand = useCallback(
    async (transcript: string, confidence: number) => {
      const manager = canvasManagerRef.current;
      if (!manager) return;

      const currentMode = networkMonitorRef.current.effectiveMode;
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

        if (result.success && result.action) {
          const dispatchResult = dispatchCanvasAction(result.action, manager);
          const engineTag = result.engine === "cloud" ? "Cloud" : "Edge";
          setLastVoiceAction(`[${engineTag} ${result.latencyMs}ms] ${dispatchResult.details}`);
        } else {
          setLastVoiceAction(`Error: ${result.error || "Could not parse command"}`);
        }
      } catch (err) {
        console.error("[VoiceCommander] Inference routing failed:", err);
        setLastVoiceAction("Voice inference failed");
      }
    },
    []
  );

  const voiceCommander = useVoiceCommander({
    onFinalTranscript: handleVoiceCommand,
  });

  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      editorRef.current = mountedEditor;
      mountedEditor.user.updateUserPreferences({ colorScheme: "dark" });
      const manager = new CanvasManager(mountedEditor);
      canvasManagerRef.current = manager;
      setEditor(mountedEditor);
      setCanvasManager(manager);
      if (onEditorMount) {
        onEditorMount(mountedEditor);
      }
    },
    [onEditorMount]
  );

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950">
      <Tldraw onMount={handleMount} autoFocus />
      {editor && canvasManager && (
        <>
          <KeyboardHarness canvasManager={canvasManager} />
          <VoiceHUD
            voiceCommander={voiceCommander}
            networkMonitor={networkMonitor}
            lastParsedAction={lastVoiceAction}
            onSimulateCommand={(text) => handleVoiceCommand(text, 0.95)}
          />
          {children}
        </>
      )}
    </div>
  );
}
