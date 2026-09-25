# VoxCanvas (Voice-First Spatial Intelligence Platform)

## What This Is

VoxCanvas is an accessibility-first, voice-directed collaborative whiteboard platform designed for users with motor disabilities and educators in physical and bandwidth-constrained classrooms. It translates natural, unstructured spoken language into deterministic spatial canvas mutations (nodes, edges, mindmaps, timers) with real-time WebSocket synchronization (<150ms latency) and full offline resilience via local IndexedDB and edge LLMs.

## Core Value

Deterministic, sub-second translation of spoken natural language into precise, non-overlapping spatial canvas actions, seamlessly executing online or offline without losing state or teacher-student synchronization.

## Engineering & Portfolio Context

- **Author**: Engineering Candidate (B.Tech Final Year)
- **Target Roles**: Software Development Engineer (Full Stack, Backend, Frontend, Applied AI)
- **Objective**: Demonstrate production-grade systems engineering (WebSockets, CRDT/delta synchronization, Web Speech API, hybrid cloud/edge AI routing with Ollama, Zod schema validation, cubic Bezier cursor interpolation) moving far beyond shallow API wrapper applications.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **CANV-01**: Interactive infinite canvas built on `@tldraw/tldraw` with responsive pan, zoom, and shape management
- [ ] **CANV-02**: Programmatic `CanvasManager` API for atomic mutations (`addNode`, `createEdge`, `layoutTree`, `setTimer`)
- [ ] **SPAT-01**: Real-time `CanvasSpatialContext` extractor capturing viewport bounds, existing node positions, and types
- [ ] **SPAT-02**: Spatial quadrant heuristic prompting that prevents node overlap collisions relative to parent node IDs
- [ ] **VOIC-01**: Dual-engine speech processing: primary zero-latency `webkitSpeechRecognition` with live interim transcripts (<50ms)
- [ ] **VOIC-02**: Audio recording fallback via chunked 3-second `.webm` blobs for noisy / unsupported speech environments
- [ ] **ROUT-01**: Hybrid inference router with connectivity healthz checks (<600ms heartbeat) and automated failover
- [ ] **ROUT-02**: Cloud inference pipeline (Google Gemini / Gemma API) returning strictly validated JSON tool calls
- [ ] **ROUT-03**: Local edge inference pipeline (Ollama running `gemma:2b` or `qwen2.5:3b`) with identical system prompt schemas
- [ ] **TOOL-01**: Strict Zod schema validation engine (`CanvasActionSchema`) enforcing discriminated unions for actions
- [ ] **SYNC-01**: Single-master authoritative Socket.IO server broadcasting sequence-stamped `CanvasDeltaPayload` diffs (<120ms latency)
- [ ] **SYNC-02**: Read-only Student UI route (`/view/[roomId]`) mirroring teacher mutations in real-time
- [ ] **SYNC-03**: Browser-level IndexedDB synchronization persisting transactions every 3 seconds for zero-loss offline reloads
- [ ] **VIZ-01**: Visual "thinking" agent cursor calculating cubic Bezier interpolation over 400ms ease-out paths
- [ ] **VIZ-02**: Interactive execution feedback displaying command confidence scores and real-time execution status

### Out of Scope

- Multi-master concurrent editing with complex OT/CRDT conflict resolution — v1 enforces single-teacher authoritative master with read-only student mirrors to maximize reliability and sub-150ms broadcast
- Cloud user account / auth database — room codes and local sessions eliminate operational overhead for classroom demos
- Video/audio conferencing streaming — whiteboard delta sync focuses strictly on low-bandwidth spatial state

## Context

- Digital whiteboards (e.g. Miro, FigJam) require continuous physical fine-motor input (drag, click, type), creating accessibility barriers.
- Rural schools and conference settings often face intermittent connectivity where purely cloud-dependent AI tools freeze or drop connections.
- By integrating `@tldraw/tldraw` with local LLMs (via Ollama) and IndexedDB, VoxCanvas delivers a resilient educational platform capable of functioning in total air-gap conditions.

## Constraints

- **Tech Stack**: Next.js (TypeScript), `@tldraw/tldraw`, Socket.IO, Web Speech API, Google Gemini/Gemma API, Ollama (Local LLM), IndexedDB, Tailwind CSS
- **Performance**:
  - STT Interim preview: < 100ms
  - Cloud inference round-trip: < 1.8s
  - Local edge inference (8GB RAM host): < 3.2s
  - WebSocket delta broadcast: < 120ms for 30+ concurrent viewers
  - Client memory footprint: < 250MB heap on 500+ canvas nodes
- **Deployment**: Next.js frontend on Vercel; Socket.IO state server on Render/Railway; Edge runner on local Ollama daemon

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router + TypeScript | Full-stack unified architecture with strict type safety for Zod and tldraw records | — Pending |
| `@tldraw/tldraw` canvas engine | High-performance extensible canvas SDK with headless store APIs and granular event listeners | — Pending |
| Discriminated Union Zod Schema | Guarantees deterministic state manipulation; rejects hallucinated LLM markdown at boundary | — Pending |
| Delta-only WebSocket Sync | Minimizes payload size and bandwidth; enables 30+ student viewers on low-tier connections | — Pending |
| Cubic Bezier Cursor Interpolation | Provides visual agent transparency, letting observers see where and why an action is happening | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-25 after initialization*
