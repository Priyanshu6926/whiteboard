# Roadmap: VoxCanvas

## Overview

VoxCanvas is engineered in five vertical phases, starting with a deterministic tldraw canvas foundation, layering browser-native voice and cloud AI function calling, introducing local Ollama edge fallback for air-gapped classrooms, scaling state with low-latency WebSocket delta broadcast and IndexedDB, and completing with visual Bezier agent cursor interpolation.

## Phases

- [x] **Phase 1: Core Canvas & Schema Execution** - Initialize Next.js project with `@tldraw/tldraw` and deterministic CanvasManager service with manual keyboard test harness (completed 2026-09-26)
- [x] **Phase 2: Speech & Intelligence Pipeline** - Web Speech API live streaming hook, spatial context injection, and Zod action validation with cloud Gemini inference (completed 2026-09-27)
- [ ] **Phase 3: Hybrid Fallback Integration** - Dynamic connectivity router, local Ollama runner integration, and audio recorder fallback
- [ ] **Phase 4: Collaborative Sync Engine** - Authoritative teacher WebSocket delta broadcast, read-only student UI route, and IndexedDB local persistence
- [ ] **Phase 5: Production Polish & Cursor Interpolation** - Cubic Bezier agent cursor animation, confidence scoring HUD, latency telemetry, and deployment configuration

## Phase Details

### Phase 1: Core Canvas & Schema Execution

**Goal**: Establish an infinite canvas environment powered by `@tldraw/tldraw` and a deterministic `CanvasManager` service capable of creating nodes, edges, mindmaps, and timers via programmatic and keyboard inputs.
**Mode**: mvp
**Depends on**: Nothing
**Requirements**: CANV-01, CANV-02, CANV-03
**Success Criteria** (what must be TRUE):

  1. User can interact with an infinite canvas (pan, pinch-to-zoom, select) in Next.js with zero layout shift.
  2. Programmatic `CanvasManager` API reliably creates and positions sticky notes, cards, edges, and countdown timers without overlapping existing elements.
  3. Keyboard shortcuts trigger all `CanvasManager` actions in isolation, verifying canvas mechanics before speech integration.

**Plans**: 2 plans

Plans:
**Wave 1**

- [x] 01-01: Initialize Next.js 14 App Router project with TypeScript, Tailwind CSS, `@tldraw/tldraw`, and core canvas shell

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: Implement `CanvasManager` mutation service and interactive keyboard test harness with collision-avoidance layout helpers

### Phase 2: Speech & Intelligence Pipeline

**Goal**: Capture live speech from the browser, extract spatial canvas context, infer actions via Cloud Gemini, and validate mutations through strict Zod schemas.
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: SPAT-01, SPAT-02, VOIC-01, VOIC-03, TOOL-01, TOOL-02
**Success Criteria** (what must be TRUE):

  1. User can speak natural language commands and observe live interim transcription text rendering in <50ms.
  2. Spatial context extractor serializes visible nodes and bounding boxes to provide quadrant placement awareness.
  3. Cloud Gemini API translates voice intent into strictly typed `CanvasActionSchema` JSON payloads, rejecting unstructured markdown.
  4. Execution dispatcher maps validated JSON actions to `CanvasManager` invocations on the canvas.

**Plans**: 2 plans

Plans:
**Wave 1**

- [x] 02-01: Build `useVoiceCommander` hook with interim token streaming and confidence score calculation

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02: Build `/api/llm/cloud` route, spatial context injector, Zod schema guard, and action dispatcher

### Phase 3: Hybrid Fallback Integration

**Goal**: Guarantee uninterrupted offline operation in rural/low-bandwidth environments using local Ollama LLMs and chunked audio capture.
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: ROUT-01, ROUT-02, ROUT-03, ROUT-04, VOIC-02
**Success Criteria** (what must be TRUE):

  1. Network router automatically detects connectivity loss via `navigator.onLine` and `/api/healthz` 600ms heartbeat.
  2. When offline, prompt is transparently redirected to local Ollama (`http://localhost:11434/api/chat`) returning identical Zod-compliant JSON in <3.2s.
  3. Disabling internet connection in browser tools allows voice commands to still mutate the canvas without crashing or UI freezing.
  4. `MediaRecorder` audio chunking provides fallback speech capture when browser speech recognition is unavailable.

**Plans**: 2 plans

Plans:
**Wave 1**

- [ ] 03-01: Implement network health monitor, dynamic endpoint switcher, and Ollama edge client

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 03-02: Implement `MediaRecorder` 3-second audio chunking fallback pipeline and verify complete offline operation

### Phase 4: Collaborative Sync Engine

**Goal**: Broadcast low-bandwidth delta updates from teacher to student viewer rooms via WebSockets and guarantee state persistence with IndexedDB.
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: SYNC-01, SYNC-02, SYNC-03
**Success Criteria** (what must be TRUE):

  1. Teacher client captures tldraw store mutations and emits sequence-numbered `CanvasDeltaPayload` diffs over Socket.IO.
  2. Student clients visiting `/view/[roomId]` mount a read-only canvas mirroring teacher mutations with <120ms latency.
  3. Canvas state is automatically written to IndexedDB every 3 seconds, enabling instant state reconstitution on page refresh.

**Plans**: 2 plans

Plans:

- [ ] 04-01: Implement Socket.IO real-time relay server with room isolation and sequence-numbered delta broadcasting
- [ ] 04-02: Build `/view/[roomId]` read-only student page and IndexedDB debounced persistence layer

### Phase 5: Production Polish & Cursor Interpolation

**Goal**: Provide visual transparency with a Bezier-interpolated thinking cursor, telemetry instrumentation, and production-ready deployment packaging.
**Mode**: mvp
**Depends on**: Phase 4
**Requirements**: VIZ-01, VIZ-02
**Success Criteria** (what must be TRUE):

  1. Visual agent cursor animates smoothly along a cubic Bezier curve to target coordinates over 400ms before nodes appear.
  2. HUD displays real-time connection status (Cloud vs Edge), STT latency, inference duration, and confidence scores.
  3. Project passes complete production build and is configured for deployment (frontend on Vercel, WebSocket relay on Render/Railway).

**Plans**: 2 plans

Plans:

- [ ] 05-01: Implement cubic Bezier cursor animation engine ($B(t)$ pathing) and canvas HUD metrics
- [ ] 05-02: End-to-end performance verification, load testing harness, and deployment configuration
