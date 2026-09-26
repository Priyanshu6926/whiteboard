"use client";

import React, { useCallback, useRef, useState } from "react";
import { Tldraw, Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { CanvasManager } from "@/services/canvas/CanvasManager";
import KeyboardHarness from "./KeyboardHarness";
import VoiceHUD from "@/components/voice/VoiceHUD";
import { useVoiceCommander } from "@/hooks/useVoiceCommander";
import { dispatchCanvasAction } from "@/services/ai/actionDispatcher";
import { LLMResponse } from "@/types/actions";

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

  const handleVoiceCommand = useCallback(
    async (transcript: string, confidence: number) => {
      const manager = canvasManagerRef.current;
      if (!manager) return;

      console.log(
        `[VoiceCommander] Spoken: "${transcript}" (confidence: ${confidence.toFixed(2)})`
      );
      setLastVoiceAction(`Parsing: "${transcript}"...`);

      try {
        const spatialContext = manager.getSpatialContext();
        const res = await fetch("/api/llm/cloud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, spatialContext }),
        });

        const data: LLMResponse = await res.json();
        if (data.success && data.action) {
          const result = dispatchCanvasAction(data.action, manager);
          setLastVoiceAction(result.details);
        } else {
          setLastVoiceAction(`Error: ${data.error || "Could not parse command"}`);
        }
      } catch (err) {
        console.error("[VoiceCommander] API dispatch failed:", err);
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
            lastParsedAction={lastVoiceAction}
            onSimulateCommand={(text) => handleVoiceCommand(text, 0.95)}
          />
          {children}
        </>
      )}
    </div>
  );
}
