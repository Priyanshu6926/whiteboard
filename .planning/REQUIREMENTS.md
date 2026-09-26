# Requirements: VoxCanvas

**Defined:** 2026-09-25
**Core Value:** Deterministic, sub-second translation of spoken natural language into precise, non-overlapping spatial canvas actions, seamlessly executing online or offline without losing state or teacher-student synchronization.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Canvas & Manipulation

- [x] **CANV-01**: User can pan, zoom, and interact with an infinite vector whiteboard built with `@tldraw/tldraw`
- [x] **CANV-02**: Developer/system can invoke programmatic `CanvasManager` methods (`addNode`, `createEdge`, `layoutTree`, `setTimer`) to mutate the board deterministically
- [x] **CANV-03**: User can trigger all `CanvasManager` actions via keyboard shortcuts to verify isolation before speech activation

### Spatial Intelligence

- [x] **SPAT-01**: System extracts real-time `CanvasSpatialContext` including viewport coordinates, zoom level, and all existing node bounding boxes
- [x] **SPAT-02**: System applies quadrant collision avoidance heuristics to place new nodes relative to parent nodes without visual overlap

### Speech Processing

- [x] **VOIC-01**: User can speak commands with browser-native `webkitSpeechRecognition` providing live interim transcript previews (<50ms latency)
- [ ] **VOIC-02**: System automatically falls back to 3-second chunked WebM audio capture via `MediaRecorder` when native speech recognition fails or is noisy
- [x] **VOIC-03**: System computes and displays a speech transcription confidence score before routing commands

### Inference & Routing

- [ ] **ROUT-01**: System tracks connectivity state via `navigator.onLine` and a 600ms `/api/healthz` heartbeat check
- [ ] **ROUT-02**: System routes prompts to cloud Gemini/Gemma endpoint (`/api/llm/cloud`) when connected with round-trip < 1.8s
- [ ] **ROUT-03**: System automatically reroutes prompts to local Ollama (`http://localhost:11434/api/chat` running `gemma:2b` or `qwen2.5:3b`) when disconnected, executing in < 3.2s
- [ ] **ROUT-04**: System guarantees identical system prompt contracts and JSON schemas across both cloud and local LLM engines

### Tool Calling & Schema Validation

- [x] **TOOL-01**: System validates all LLM outputs against a strict Zod discriminated union schema (`create_mindmap`, `create_node`, `connect_nodes`, `set_countdown_timer`)
- [x] **TOOL-02**: System safely rejects unstructured markdown or malformed JSON at the validation boundary and displays clear error feedback

### Real-Time Synchronization & Persistence

- [ ] **SYNC-01**: Authoritative teacher client broadcasts atomic `CanvasDeltaPayload` diffs over Socket.IO with sequence IDs (<120ms latency across 30 concurrent viewers)
- [ ] **SYNC-02**: Student clients can join a room via `/view/[roomId]` in a read-only mode that mirrors all teacher canvas updates in real time
- [ ] **SYNC-03**: System persists canvas transactions to local IndexedDB every 3 seconds to ensure instant state restoration on page refresh or offline reload

### Visual Agent Presence & UX

- [ ] **VIZ-01**: Visual agent cursor computes and animates along a cubic Bezier curve trajectory over 400ms ease-out before instantiating shapes
- [ ] **VIZ-02**: UI displays active network mode (Cloud vs Edge), voice status pill, and execution progress HUD

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Collaboration

- **COL-01**: Multi-master bidirectional concurrent editing with Conflict-Free Replicated Data Types (CRDTs)
- **COL-02**: In-canvas audio/video peer-to-peer communication channels via WebRTC

### Identity & Cloud Storage

- **AUTH-01**: User authentication and profile management (Google OAuth, email)
- **STOR-01**: Cloud project storage, file sharing permissions, and version history

### Advanced AI

- **AI-01**: Multilingual voice recognition and automatic live canvas translation
- **AI-02**: Multimodal image-to-canvas diagram generation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-master simultaneous write editing | Sub-150ms classroom broadcasting is prioritized via single-master teacher model; multi-master CRDT adds excessive complexity for v1 |
| Cloud user authentication database | Room codes and local persistence provide faster onboarding and friction-free demonstration |
| Continuous audio streaming to cloud server | Heavy bandwidth consumption contradicts rural/low-bandwidth classroom goals; browser STT + local LLM keeps data on device |
| Freeform markdown rendering on canvas | Enforcing strict Zod structured tool actions prevents messy UI hallucinations |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANV-01 | Phase 1 | Complete |
| CANV-02 | Phase 1 | Complete |
| CANV-03 | Phase 1 | Complete |
| SPAT-01 | Phase 2 | Complete |
| SPAT-02 | Phase 2 | Complete |
| VOIC-01 | Phase 2 | Complete |
| VOIC-03 | Phase 2 | Complete |
| TOOL-01 | Phase 2 | Complete |
| TOOL-02 | Phase 2 | Complete |
| ROUT-01 | Phase 3 | Pending |
| ROUT-02 | Phase 3 | Pending |
| ROUT-03 | Phase 3 | Pending |
| ROUT-04 | Phase 3 | Pending |
| VOIC-02 | Phase 3 | Pending |
| SYNC-01 | Phase 4 | Pending |
| SYNC-02 | Phase 4 | Pending |
| SYNC-03 | Phase 4 | Pending |
| VIZ-01 | Phase 5 | Pending |
| VIZ-02 | Phase 5 | Pending |
