"use client";

import React, { useCallback, useState } from "react";
import { Tldraw, Editor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCanvasSync } from "@/hooks/useCanvasSync";
import StudentHUD from "./StudentHUD";

interface StudentWhiteboardProps {
  roomId: string;
}

export default function StudentWhiteboard({ roomId }: StudentWhiteboardProps) {
  const [editor, setEditor] = useState<Editor | null>(null);

  // Connect to collaborative relay as read-only student
  const syncState = useCanvasSync({
    editor,
    roomId,
    role: "student",
  });

  const handleMount = useCallback((mountedEditor: Editor) => {
    // Lock canvas to read-only mode (SYNC-02)
    mountedEditor.updateInstanceState({ isReadonly: true });
    mountedEditor.user.updateUserPreferences({ colorScheme: "dark" });
    setEditor(mountedEditor);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950">
      <Tldraw onMount={handleMount} autoFocus={false} />
      <StudentHUD
        roomId={roomId}
        isConnected={syncState.isConnected}
        isTeacherPresent={syncState.isTeacherPresent}
        latencyMs={syncState.latencyMs}
        lastSequenceId={syncState.lastSequenceId}
      />
    </div>
  );
}
