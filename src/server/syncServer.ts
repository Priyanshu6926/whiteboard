import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {
  CanvasDeltaPayload,
  CanvasSnapshotPayload,
  SyncClientRole,
  SYNC_EVENTS,
} from "../types/sync";

const PORT = parseInt(process.env.SYNC_PORT || "4001", 10);

interface RoomData {
  teacherSocketId?: string;
  viewerSocketIds: Set<string>;
  sequenceId: number;
  history: CanvasDeltaPayload[];
  snapshotRecords: Record<string, unknown>[];
}

const rooms = new Map<string, RoomData>();

function getOrCreateRoom(roomId: string): RoomData {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      viewerSocketIds: new Set<string>(),
      sequenceId: 0,
      history: [],
      snapshotRecords: [],
    };
    rooms.set(roomId, room);
  }
  return room;
}

const httpServer = createServer((req, res) => {
  // Simple health check endpoint for Socket.IO relay
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "voxcanvas-sync-server",
        activeRooms: rooms.size,
        timestamp: Date.now(),
      })
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket: Socket) => {
  let currentRoomId: string | null = null;
  let currentRole: SyncClientRole | null = null;

  socket.on(
    SYNC_EVENTS.JOIN_ROOM,
    ({ roomId, role }: { roomId: string; role: SyncClientRole }) => {
      currentRoomId = roomId;
      currentRole = role;
      socket.join(roomId);

      const room = getOrCreateRoom(roomId);

      if (role === "teacher") {
        room.teacherSocketId = socket.id;
      } else {
        room.viewerSocketIds.add(socket.id);
      }

      // Notify room about updated presence
      io.to(roomId).emit(SYNC_EVENTS.ROOM_STATE, {
        roomId,
        teacherId: room.teacherSocketId,
        viewerCount: room.viewerSocketIds.size,
        lastSequenceId: room.sequenceId,
      });

      // Send initial snapshot if available to newly joined student
      if (role === "student" && room.snapshotRecords.length > 0) {
        socket.emit(SYNC_EVENTS.SYNC_RESPONSE, {
          roomId,
          sequenceId: room.sequenceId,
          records: room.snapshotRecords,
        });
      }

      console.log(
        `[SyncServer] Socket ${socket.id} joined room ${roomId} as ${role} (Viewers: ${room.viewerSocketIds.size})`
      );
    }
  );

  // Authoritative teacher broadcasts delta diffs (SYNC-01)
  socket.on(SYNC_EVENTS.CANVAS_DELTA, (delta: CanvasDeltaPayload) => {
    if (!delta || !delta.roomId) return;
    const room = getOrCreateRoom(delta.roomId);

    // Update sequence tracking and history
    if (delta.sequenceId > room.sequenceId) {
      room.sequenceId = delta.sequenceId;
    }
    room.history.push(delta);
    if (room.history.length > 500) {
      room.history.shift();
    }

    // Broadcast immediately to all other room members with <120ms latency
    socket.to(delta.roomId).emit(SYNC_EVENTS.CANVAS_DELTA, delta);
  });

  // Snapshot synchronization for fresh room joiners
  socket.on(
    "update-snapshot",
    ({ roomId, records, sequenceId }: CanvasSnapshotPayload) => {
      const room = getOrCreateRoom(roomId);
      room.snapshotRecords = records;
      if (sequenceId > room.sequenceId) {
        room.sequenceId = sequenceId;
      }
    }
  );

  socket.on(SYNC_EVENTS.REQUEST_SNAPSHOT, ({ roomId }: { roomId: string }) => {
    const room = getOrCreateRoom(roomId);
    socket.emit(SYNC_EVENTS.SYNC_RESPONSE, {
      roomId,
      sequenceId: room.sequenceId,
      records: room.snapshotRecords,
    });
  });

  socket.on("disconnect", () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        if (currentRole === "teacher" && room.teacherSocketId === socket.id) {
          room.teacherSocketId = undefined;
        } else if (currentRole === "student") {
          room.viewerSocketIds.delete(socket.id);
        }

        io.to(currentRoomId).emit(SYNC_EVENTS.ROOM_STATE, {
          roomId: currentRoomId,
          teacherId: room.teacherSocketId,
          viewerCount: room.viewerSocketIds.size,
          lastSequenceId: room.sequenceId,
        });
      }
    }
    console.log(`[SyncServer] Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[SyncServer] VoxCanvas Socket.IO server running on port ${PORT}`);
});

export { httpServer, io };
