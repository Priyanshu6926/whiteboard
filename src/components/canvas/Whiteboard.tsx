"use client";

import React, { useCallback, useRef, useState } from "react";
import { Tldraw, Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { CanvasManager } from "@/services/canvas/CanvasManager";
import KeyboardHarness from "./KeyboardHarness";

interface WhiteboardProps {
  onEditorMount?: (editor: Editor) => void;
  children?: React.ReactNode;
}

export default function Whiteboard({ onEditorMount, children }: WhiteboardProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);
  const editorRef = useRef<Editor | null>(null);

  const handleMount = useCallback(
    (mountedEditor: Editor) => {
      editorRef.current = mountedEditor;
      mountedEditor.user.updateUserPreferences({ colorScheme: "dark" });
      const manager = new CanvasManager(mountedEditor);
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
          {children}
        </>
      )}
    </div>
  );
}
