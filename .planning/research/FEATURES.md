# Features Research: VoxCanvas

**Researched:** 2026-09-25
**Confidence:** HIGH

## Feature Taxonomy

### Table Stakes (v1 Must-Have)
- **Infinite Canvas with Pan/Zoom**: Smooth 60fps pan, pinch zoom, coordinate conversion (screen to canvas coordinates).
- **Basic Shape Creation via CanvasManager**: Deterministic addition of sticky notes, cards, mindmap nodes, and countdown timers.
- **Voice Recognition with Live Interim Feedback**: Real-time transcript preview pill with pulsing audio indicator (<50ms feedback).
- **Zod Tool Execution**: Structured function calling for `create_mindmap`, `create_node`, `connect_nodes`, and `set_countdown_timer`.
- **Spatial Viewport Injection**: Supplying canvas bounding boxes and node IDs to LLM to prevent node overlap collisions.
- **Network Healthz & Edge Fallback**: Automatic detection of offline status with seamless routing to local Ollama instance.
- **WebSocket Room Synchronization**: Teacher broadcast of delta diffs to read-only student viewers (<120ms latency).
- **Local Persistence via IndexedDB**: Automatic debounced snapshotting to local storage for instant recovery on page reload.

### Differentiators (v1+ Competitive Edge)
- **Visual "Thinking" Agent Cursor**: Synthetic avatar animating along a cubic Bezier curve to the target spawn location before rendering nodes.
- **Voice Confidence Meter**: Numerical confidence score calculation before command dispatch.
- **Dual-Engine Speech Fallback**: Automatic failover to chunked audio recording when Web Speech API fails or is noisy.
- **Mindmap Radial/Horizontal Tree Layout**: Heuristic auto-spacing algorithms that structure branch nodes hierarchically.

### Deferred (v2 Scope)
- **Bidirectional Collaborative Editing**: Multi-teacher write access with Conflict-Free Replicated Data Types (CRDTs) or Operational Transformation.
- **Custom User Authentication & Cloud Document Store**: Multi-tenant database, project folder hierarchy, and permissions.
- **Audio/Video Conferencing Stream**: WebRTC video channels integrated alongside canvas.
- **Multi-lingual Voice Recognition**: Automatic translation and voice command execution across non-English languages.
