"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Editor, TLRecord, TLShapeId } from "@tldraw/tldraw";
import {
  CanvasDeltaPayload,
  CanvasSnapshotPayload,
  SyncClientRole,
  SYNC_EVENTS,
  SyncRoomState,
} from "@/types/sync";

export interface UseCanvasSyncOptions {
  editor: Editor | null;
  roomId: string;
  role: SyncClientRole;
  serverUrl?: string;
}

export interface UseCanvasSyncReturn {
  isConnected: boolean;
  viewerCount: number;
  latencyMs: number;
  lastSequenceId: number;
  roomId: string;
  role: SyncClientRole;
  isTeacherPresent: boolean;
  socket: Socket | null;
}

export function useCanvasSync({
  editor,
  roomId,
  role,
  serverUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL || "http://localhost:4001",
}: UseCanvasSyncOptions): UseCanvasSyncReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isTeacherPresent, setIsTeacherPresent] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [lastSequenceId, setLastSequenceId] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const sequenceRef = useRef(0);
  const lastProcessedSeqRef = useRef(0);
  const isApplyingRemoteRef = useRef(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!roomId) return;

    const socket: Socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SYNC_EVENTS.JOIN_ROOM, { roomId, role });

      // If student, request current snapshot
      if (role === "student") {
        socket.emit(SYNC_EVENTS.REQUEST_SNAPSHOT, { roomId });
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(SYNC_EVENTS.ROOM_STATE, (state: SyncRoomState) => {
      setViewerCount(state.viewerCount || 0);
      setIsTeacherPresent(Boolean(state.teacherId));
      if (state.lastSequenceId) {
        setLastSequenceId(state.lastSequenceId);
      }
    });

    // Handle incoming canvas deltas (sub-120ms SYNC-01 / SYNC-02)
    socket.on(SYNC_EVENTS.CANVAS_DELTA, (delta: CanvasDeltaPayload) => {
      if (!editor || !delta || delta.roomId !== roomId) return;

      // Deduplication check: ignore out-of-order or duplicate packets
      if (delta.sequenceId <= lastProcessedSeqRef.current) {
        return;
      }
      lastProcessedSeqRef.current = delta.sequenceId;
      setLastSequenceId(delta.sequenceId);

      // Latency calculation: time from teacher emission to student arrival
      const latency = Math.max(1, Date.now() - delta.timestamp);
      setLatencyMs(latency);

      // Apply mutation to store without triggering local echo broadcast
      isApplyingRemoteRef.current = true;
      try {
        if (delta.operation === "INSERT" || delta.operation === "UPDATE") {
          editor.store.put([delta.entity.data as unknown as TLRecord]);
        } else if (delta.operation === "DELETE") {
          editor.store.remove([delta.entity.id as unknown as TLShapeId]);
        }
      } catch (err) {
        console.warn("[useCanvasSync] Error applying remote delta:", err);
      } finally {
        isApplyingRemoteRef.current = false;
      }
    });

    // Handle snapshot response on fresh join
    socket.on(SYNC_EVENTS.SYNC_RESPONSE, (snapshot: CanvasSnapshotPayload) => {
      if (!editor || !snapshot || snapshot.roomId !== roomId) return;

      if (snapshot.sequenceId > lastProcessedSeqRef.current) {
        lastProcessedSeqRef.current = snapshot.sequenceId;
        setLastSequenceId(snapshot.sequenceId);
      }

      if (Array.isArray(snapshot.records) && snapshot.records.length > 0) {
        isApplyingRemoteRef.current = true;
        try {
          editor.store.put(snapshot.records as unknown as TLRecord[]);
        } catch (err) {
          console.warn("[useCanvasSync] Error loading snapshot:", err);
        } finally {
          isApplyingRemoteRef.current = false;
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [editor, roomId, role, serverUrl]);

  // Teacher broadcasting listener
  useEffect(() => {
    if (!editor || role !== "teacher") return;

    const cleanupListener = editor.store.listen((entry) => {
      // Ignore mutations originating from remote sync packets
      if (isApplyingRemoteRef.current) return;
      if (!socketRef.current || !socketRef.current.connected) return;

      const { added, updated, removed } = entry.changes;

      // Handle added shapes
      for (const record of Object.values(added)) {
        if (record && record.typeName === "shape") {
          const seq = ++sequenceRef.current;
          setLastSequenceId(seq);
          const payload: CanvasDeltaPayload = {
            roomId,
            sequenceId: seq,
            timestamp: Date.now(),
            operation: "INSERT",
            entity: {
              id: record.id,
              type: (record as unknown as { type?: string }).type || "shape",
              data: record as unknown as Record<string, unknown>,
            },
          };
          socketRef.current.emit(SYNC_EVENTS.CANVAS_DELTA, payload);
        }
      }

      // Handle updated shapes
      for (const [, to] of Object.values(updated)) {
        if (to && to.typeName === "shape") {
          const seq = ++sequenceRef.current;
          setLastSequenceId(seq);
          const payload: CanvasDeltaPayload = {
            roomId,
            sequenceId: seq,
            timestamp: Date.now(),
            operation: "UPDATE",
            entity: {
              id: to.id,
              type: (to as unknown as { type?: string }).type || "shape",
              data: to as unknown as Record<string, unknown>,
            },
          };
          socketRef.current.emit(SYNC_EVENTS.CANVAS_DELTA, payload);
        }
      }

      // Handle removed shapes
      for (const record of Object.values(removed)) {
        if (record && record.typeName === "shape") {
          const seq = ++sequenceRef.current;
          setLastSequenceId(seq);
          const payload: CanvasDeltaPayload = {
            roomId,
            sequenceId: seq,
            timestamp: Date.now(),
            operation: "DELETE",
            entity: {
              id: record.id,
              type: (record as unknown as { type?: string }).type || "shape",
              data: record as unknown as Record<string, unknown>,
            },
          };
          socketRef.current.emit(SYNC_EVENTS.CANVAS_DELTA, payload);
        }
      }

      // Periodically update full snapshot on the relay server
      const currentShapes = editor.store
        .allRecords()
        .filter((r) => r.typeName === "shape");
      socketRef.current.emit("update-snapshot", {
        roomId,
        sequenceId: sequenceRef.current,
        records: currentShapes,
      });
    });

    return () => {
      cleanupListener();
    };
  }, [editor, roomId, role]);

  // If student and editor mounts after socket connected, request snapshot immediately
  useEffect(() => {
    if (role === "student" && editor && socketRef.current?.connected) {
      socketRef.current.emit(SYNC_EVENTS.REQUEST_SNAPSHOT, { roomId });
    }
  }, [editor, role, roomId]);

  return {
    isConnected,
    viewerCount,
    latencyMs,
    lastSequenceId,
    roomId,
    role,
    isTeacherPresent,
    socket: socketRef.current,
  };
}
