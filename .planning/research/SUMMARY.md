# Project Research Summary

**Project:** VoxCanvas
**Domain:** Voice-First Spatial Intelligence Platform & Collaborative Whiteboard
**Researched:** 2026-09-25
**Confidence:** HIGH

## Executive Summary

VoxCanvas bridges accessibility and spatial intelligence by transforming voice commands into deterministic digital whiteboard actions. Designed as an engineering-intensive final year portfolio project, it solves the physical input barrier for motor-disabled users and educators while ensuring complete offline capability in bandwidth-constrained classrooms.

The platform combines `@tldraw/tldraw` for vector canvas operations, Web Speech API for low-latency live speech recognition, hybrid inference routing (Cloud Gemini ↔ Local edge Ollama), single-master Socket.IO delta broadcasting (<120ms latency), and browser-side IndexedDB persistence.

Key risks include shape collision from arbitrary coordinates, audio stream timeouts, WebSocket echo loops, and edge model schema disobedience. All risks are systematically mitigated by relative quadrant placement algorithms, Zod discriminated union validation, authoritative single-master synchronization, and debounced IndexedDB commits.

## Key Findings

### Recommended Stack

The chosen architecture leverages modern web standards with strict typed boundaries:
- **Next.js (App Router, TypeScript)**: Modular frontend and API routes with zero-latency SSR/SSG and strong types.
- **`@tldraw/tldraw`**: Rich infinite vector canvas with headless state management.
- **Web Speech API & MediaRecorder**: Native browser STT with chunked audio fallback.
- **Google Gemini & Ollama**: Hybrid AI engine ensuring zero downtime across online/offline transitions.
- **Socket.IO & IndexedDB**: Real-time delta replication and high-speed local persistence.

**Core technologies:**
- Next.js (TypeScript): Application framework — unified frontend and API layer
- `@tldraw/tldraw`: Canvas engine — extensible vector canvas with store listeners
- Web Speech API: Audio transcription — browser-native zero-latency interim transcripts
- Zod: Validation engine — rejects unstructured markdown and enforces deterministic actions
- Socket.IO: Realtime broadcast — sub-120ms delta synchronization to student viewers
- Ollama: Edge LLM runner — local air-gapped inference for offline classrooms

### Expected Features

**Must have (table stakes):**
- Infinite canvas with zoom and pan navigation
- Programmatic `CanvasManager` API for cards, mindmap nodes, edges, and countdown timers
- Live voice transcription HUD with interim token rendering (<50ms feedback)
- Spatial context aggregation with collision-free quadrant placement heuristics
- Strict Zod function-calling schema validation
- Dynamic cloud/edge inference routing with connectivity healthz check
- Single-master WebSocket delta synchronization (<120ms latency)
- Read-only student viewing mode (`/view/[roomId]`)
- IndexedDB client persistence with 3-second debounced state sync

**Should have (competitive):**
- Visual "thinking" agent cursor with cubic Bezier interpolation over 400ms
- Real-time speech confidence scoring display
- Chunked WebM audio fallback via MediaRecorder for noisy settings
- Radial and horizontal automatic mindmap layout heuristics

**Defer (v2+):**
- Multi-teacher bidirectional simultaneous editing
- Cloud user accounts and database persistence
- WebRTC video/audio streaming

### Architecture Approach

The architecture divides into three decoupled tiers:
1. **Client Perception & Spatial Context**: Web Speech API captures speech; viewport serializer aggregates visible nodes and bounds.
2. **Inference Routing Engine**: Dynamic connectivity switcher routes prompt to Google Gemini when online or local Ollama when offline.
3. **Execution & Sync Layer**: Validates returned payload with Zod, interpolates the visual Bezier cursor to the coordinates, mutates local canvas, persists to IndexedDB, and broadcasts atomic diffs over Socket.IO to student mirrors.

### Critical Pitfalls

1. **Shape Overlap**: LLMs hallucinate absolute coordinates without understanding viewport scale. Avoid by requiring relative placement (`relativeToNodeId`, `placement`) and having `CanvasManager` calculate geometry.
2. **WebSocket Echo Loops**: Infinite broadcast ping-pong occurs if teacher processes its own emitted deltas. Avoid with client ID tagging and unidirectional teacher-to-student broadcast.
3. **Edge Model Schema Failure**: Quantized models can emit markdown formatting. Avoid by markdown stripping, low temperature, and Zod `.safeParse()` retry guards.
4. **Speech Recognition Drops**: Browsers terminate speech streams on pauses. Avoid by automatic restart listeners and fallback audio recording.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core Canvas & Schema Execution
**Rationale:** Establishes the foundational canvas engine and deterministic mutation service before layering voice or network dependencies.
**Delivers:** Next.js project with `@tldraw/tldraw`, `CanvasManager` service (`addNode`, `createEdge`, `layoutTree`, `setTimer`), and manual keyboard shortcut verification.
**Addresses:** CANV-01, CANV-02
**Avoids:** Shape collision issues by establishing programmatic spacing math early.

### Phase 2: Speech & Intelligence Pipeline
**Rationale:** Connects audio input and cloud LLM inference to the deterministic canvas execution layer.
**Delivers:** `useVoiceCommander` hook with live interim transcript, `/api/llm/cloud` route, `CanvasSpatialContext` injection, and Zod action dispatcher.
**Addresses:** VOIC-01, SPAT-01, SPAT-02, TOOL-01
**Avoids:** Freeform LLM hallucination through strict schema boundaries.

### Phase 3: Hybrid Fallback Integration
**Rationale:** Unlocks edge resilience so the system functions smoothly in low-bandwidth or offline conditions.
**Delivers:** Dynamic network router (`navigator.onLine` + `/api/healthz`), local Ollama client integration, and audio chunking fallback.
**Addresses:** ROUT-01, ROUT-02, ROUT-03, VOIC-02
**Avoids:** Offline downtime and localized speech recognition failures.

### Phase 4: Collaborative Sync Engine
**Rationale:** Enables multi-client classroom broadcast once the local teacher instance is fully functional.
**Delivers:** Socket.IO server, room code routing, sequence-stamped `CanvasDeltaPayload` diff broadcaster, read-only `/view/[roomId]` student route, and IndexedDB local persistence.
**Addresses:** SYNC-01, SYNC-02, SYNC-03
**Avoids:** Network saturation and state echo loops.

### Phase 5: Production Polish & Cursor Interpolation
**Rationale:** Adds visual polish, agent transparency, and production deployment packaging for high-impact placement demonstrations.
**Delivers:** Cubic Bezier animated cursor ($B(t)$ curve interpolation), confidence meter HUD, benchmark suite, and production deployment configuration.
**Addresses:** VIZ-01, VIZ-02
**Avoids:** Confusing sudden shape appearances; gives students visual confirmation of AI operations.

### Phase Ordering Rationale

- Phase 1 must precede Phase 2 so the LLM dispatcher targets an already-tested canvas API.
- Phase 2 must precede Phase 3 so edge Ollama prompts can match the established cloud prompt schema.
- Phase 4 comes after local operations are rock solid to avoid debugging canvas logic across network boundaries.
- Phase 5 finalizes UX and visual presentation once the core data pipe is fully working.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Ollama REST API compatibility across platforms and JSON enforcement flags (`format: "json"`).
- **Phase 4:** `@tldraw/tldraw` store event filtering to isolate user actions from programmatic updates.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Standard Next.js + tldraw integration.
- **Phase 2:** Standard Web Speech API and Zod schemas.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries are proven, compatible, and actively maintained |
| Features | HIGH | Detailed functional specifications mapped directly from PRD |
| Architecture | HIGH | Single-master delta architecture eliminates race conditions |
| Pitfalls | HIGH | Clear mitigations outlined for every edge case |

**Overall confidence:** HIGH

### Gaps to Address

- Verify `@tldraw/tldraw` v2+ headless store listeners API exact method signatures during Phase 1 planning.
- Validate local Ollama CORS configuration when invoked from browser frontend or proxy through Next.js rewrite.

## Sources

### Primary (HIGH confidence)
- Official tldraw Documentation (`tldraw.dev`) — Canvas APIs, store records, custom UI integration
- W3C Web Speech API Specification — SpeechRecognition interface and interim results
- Socket.IO Documentation — Room broadcasting and sequence delta patterns

### Secondary (MEDIUM confidence)
- Ollama API Documentation — `/api/chat` format parameters and local streaming

---
*Research completed: 2026-09-25*
*Ready for roadmap: yes*
