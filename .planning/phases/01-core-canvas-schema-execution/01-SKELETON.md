# Walking Skeleton — VoxCanvas

**Phase:** 1
**Generated:** 2026-09-26

## Capability Proven End-to-End

A user can interact with an infinite vector canvas in their browser, pan/zoom smoothly, and trigger deterministic programmatic canvas mutations (`addNode`, `createEdge`, `layoutTree`, `setTimer`) via a keyboard harness with instant visual updates.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | Strict type safety, clean separation of client canvas from future SSR/API routes |
| Canvas Engine | `@tldraw/tldraw` | Infinite canvas with headless store API, atomic shape records, and camera controls |
| Styling | Tailwind CSS | Rapid utility styling for floating HUD controls, dialogs, and overlays |
| Mutation Architecture | Dedicated `CanvasManager` service | Encapsulates tldraw store interactions into deterministic methods for speech and AI layers |
| Directory Layout | Feature-based modular structure | `src/components/canvas/`, `src/services/canvas/`, `src/types/` |

## Stack Touched in Phase 1

- [ ] Project scaffold (Next.js 14, TypeScript, Tailwind CSS, ESLint)
- [ ] Canvas Engine (`@tldraw/tldraw` client-side dynamic import to avoid SSR issues)
- [ ] State / Canvas Service (`CanvasManager` wrapping tldraw Editor instance)
- [ ] Interactive UI (Full-screen canvas with floating test harness HUD and keyboard listeners)
- [ ] Verification (Local dev execution verified on `http://localhost:3000`)

## Out of Scope (Deferred to Later Slices)

- Web Speech API and live audio processing (Phase 2)
- Cloud Gemini and Local Ollama inference integration (Phases 2 & 3)
- Socket.IO delta broadcast and multi-client rooms (Phase 4)
- IndexedDB offline persistent store (Phase 4)
- Cubic Bezier thinking cursor animation (Phase 5)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Speech & Intelligence Pipeline (`useVoiceCommander` + Cloud Gemini structured tool calling)
- Phase 3: Hybrid Fallback Integration (dynamic router + local Ollama air-gapped fallback)
- Phase 4: Collaborative Sync Engine (Socket.IO sequence deltas + `/view/[roomId]` student mirror + IndexedDB)
- Phase 5: Production Polish & Cursor Interpolation (Cubic Bezier path animation + HUD telemetry)
