export type DeltaOperation = "INSERT" | "UPDATE" | "DELETE";

export type SyncClientRole = "teacher" | "student";

export interface CanvasDeltaPayload {
  roomId: string;
  sequenceId: number;
  timestamp: number;
  operation: DeltaOperation;
  entity: {
    id: string;
    type: string;
    data: Record<string, unknown>;
  };
}

export interface SyncRoomState {
  roomId: string;
  teacherId?: string;
  viewerCount: number;
  lastSequenceId: number;
}

export interface CanvasSnapshotPayload {
  roomId: string;
  sequenceId: number;
  records: Record<string, unknown>[];
}

export const SYNC_EVENTS = {
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  CANVAS_DELTA: "canvas-delta",
  ROOM_STATE: "room-state",
  REQUEST_SNAPSHOT: "request-snapshot",
  SYNC_RESPONSE: "sync-response",
} as const;
