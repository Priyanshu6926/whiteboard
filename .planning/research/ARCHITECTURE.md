# Architecture Research: VoxCanvas

**Researched:** 2026-09-25
**Confidence:** HIGH

## System Topology & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|                                                                                   |
|  +---------------------------+             +----------------------------------+   |
|  | Web Speech API (Live STT) |             |  tldraw Engine (Infinite Canvas) |   |
|  +-------------+-------------+             +-----------------+----------------+   |
|                |                                             |                    |
|                | Speech Transcript                           | Viewport JSON      |
|                v                                             v (Objects + Bounds) |
|  +-----------------------------------------------------------+-----------------+  |
|  |                   Spatial Context Aggregator & Sanitizer                    |  |
|  +-------------------------------------+---------------------------------------+  |
+----------------------------------------|------------------------------------------+
                                         | Unified Context Payload
                                         v
+-----------------------------------------------------------------------------------+
|                         INFERENCE ROUTING ENGINE (Hybrid)                         |
|                                                                                   |
|                   [ navigator.onLine == true && latency < 800ms ]                |
|                                 /                 \                               |
|                               YES                  NO                             |
|                              /                       \                            |
|                             v                         v                           |
|               +-----------------------+     +------------------------+            |
|               | Cloud: Gemma / Gemini |     | Edge: Local Ollama     |            |
|               | (Structured Output)   |     | (gemma-2b / qwen-2.5)  |            |
|               +-----------+-----------+     +-----------+------------+            |
|                           \                             /                         |
|                            +------------+--------------+                          |
|                                         | Strict JSON Function Call               |
+-----------------------------------------|-----------------------------------------+
                                          v
+-----------------------------------------------------------------------------------+
|                        EXECUTION & SYNCHRONIZATION LAYER                          |
|                                                                                   |
|  +-----------------------------------+     +-----------------------------------+  |
|  |   Zod Schema Validation & Guard   | --> | Visual Agent Cursor (Bezier Path) |  |
|  +-----------------+-----------------+     +-----------------+-----------------+  |
|                    | Valid Mutation                          |                    |
|                    v                                         v                    |
|  +-----------------------------------+     +-----------------------------------+  |
|  | Local Canvas Mutation (IndexedDB) |     | Socket.IO Delta Relay (<150ms)    |  |
|  +-----------------------------------+     +-----------------+-----------------+  |
+--------------------------------------------------------------|--------------------+
                                                               v
                                                 +----------------------------+
                                                 | 30+ Read-Only Student UIs  |
                                                 +----------------------------+
```

## Component Boundaries

### 1. Spatial Context Aggregator
- Monitors `tldraw` camera and viewport coordinates.
- Serializes visible nodes into `CanvasSpatialContext`:
  ```typescript
  interface CanvasSpatialContext {
    viewport: { x: number; y: number; width: number; height: number; zoom: number };
    existingNodes: Array<{
      id: string;
      type: "card" | "sticky" | "mindmap_node" | "timer";
      text: string;
      bounds: { x: number; y: number; width: number; height: number };
    }>;
  }
  ```
- Formats context into a concise quadrant summary injected into prompt metadata.

### 2. Dual-Engine Speech Processing Hook (`useVoiceCommander`)
- Wraps `webkitSpeechRecognition` with auto-restart, continuous listening, and error handling.
- Implements interim transcript emitter for real-time UI feedback.
- Provides fallback trigger to MediaRecorder 3-second audio slices if recognition fails or is unsupported.

### 3. Hybrid Inference Router
- Evaluates `navigator.onLine` and checks `/api/healthz` heartbeat with 600ms timeout.
- Online: routes to Next.js API route `/api/llm/cloud` (Google Gemini with structured tool call response).
- Offline: routes directly to `http://localhost:11434/api/chat` (local Ollama with low temperature and JSON schema format).
- Guarantees identical system prompts and Zod response validation across both backends.

### 4. Deterministic CanvasManager Service
- Wraps `@tldraw/tldraw` store methods:
  - `addNode(x, y, text, type)`
  - `createEdge(fromId, toId, label)`
  - `layoutTree(rootText, childTexts, layoutType)`
  - `setCountdown(durationSeconds)`
- Manages shape IDs, coordinate calculation, and bounding box avoidance.

### 5. Delta Synchronization Layer
- Teacher client listens to store events (`store.listen`) and filters for external / user changes.
- Transmits lightweight `CanvasDeltaPayload`:
  ```typescript
  interface CanvasDeltaPayload {
    roomId: string;
    sequenceId: number;
    timestamp: number;
    operation: "INSERT" | "UPDATE" | "DELETE";
    entity: {
      id: string;
      type: string;
      data: Record<string, unknown>;
    };
  }
  ```
- Server relays delta diffs to student rooms via Socket.IO.
- Student instances apply delta mutations idempotently using `sequenceId` deduplication.

### 6. Visual Agent Cursor
- Calculates cubic Bezier curve from agent current position $P_0$ through control points $P_1, P_2$ to destination $P_3$:
  $$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$$
- Animate cursor along trajectory over 400ms using `requestAnimationFrame`.
- Spawns canvas element on interpolation completion.
