"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Loader2 } from "lucide-react";

interface StudentCanvasWrapperProps {
  roomId: string;
}

const StudentWhiteboardDynamic = dynamic(
  () => import("@/components/canvas/StudentWhiteboard"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        </div>
        <div className="mt-4 flex flex-col items-center">
          <h2 className="text-lg font-semibold tracking-wide text-slate-100">
            VoxCanvas Viewer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connecting to classroom broadcast...
          </p>
        </div>
      </div>
    ),
  }
);

export default function StudentCanvasWrapper({ roomId }: StudentCanvasWrapperProps) {
  return <StudentWhiteboardDynamic roomId={roomId} />;
}
