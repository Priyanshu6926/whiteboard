import React from "react";
import StudentCanvasWrapper from "@/components/canvas/StudentCanvasWrapper";

interface ViewRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function ViewRoomPage({ params }: ViewRoomPageProps) {
  const resolvedParams = await params;
  const roomId = decodeURIComponent(resolvedParams.roomId || "CLASS-101");

  return (
    <main className="w-full h-full relative overflow-hidden">
      <StudentCanvasWrapper roomId={roomId} />
    </main>
  );
}
