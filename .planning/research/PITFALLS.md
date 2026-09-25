# Pitfalls Research: VoxCanvas

**Researched:** 2026-09-25
**Confidence:** HIGH

## Critical Pitfalls & Mitigation Strategies

### 1. Shape Overlap & Collision Hallucination
- **Pitfall**: When asked to "create a branch next to idea X", models tend to generate absolute coordinates (e.g., [0, 0] or [100, 100]) causing shapes to stack and obliterate existing visual work.
- **Mitigation**: Do not let the model generate absolute screen coordinates blindly. Instead, pass `CanvasSpatialContext` with existing node bounding boxes and require the model to return relative placement directives (`relativeToNodeId`, `placement: "right" | "bottom" | "left" | "top"`). The local `CanvasManager` computes exact collision-free bounding boxes deterministically.

### 2. Infinite Loop in Speech Recognition & Microphone Permissions
- **Pitfall**: In browser environments, `webkitSpeechRecognition` frequently drops connections after silence, fires repeated `no-speech` errors, or gets throttled by background tab resource management.
- **Mitigation**: Implement robust state-machine retry logic with exponential backoff on fatal errors, explicit visual UI mic toggle buttons, and fallback capture paths.

### 3. Canvas State Echo Loops in WebSocket Sync
- **Pitfall**: If the teacher client applies a local mutation, emits a WebSocket delta, and also listens to server broadcasts, an infinite feedback loop of mutations will freeze the browser.
- **Mitigation**: Tag all local mutations with a unique `sourceClientId` and incremental `sequenceId`. Only student clients subscribe to delta application, while the teacher instance is strictly authoritative.

### 4. Non-Deterministic Local LLM Output (Ollama vs Cloud)
- **Pitfall**: Small edge models (`gemma:2b`, `qwen2.5:3b`) can fail to follow complex nested JSON schemas or return markdown code blocks (e.g. ````json ... ````) that break standard `JSON.parse`.
- **Mitigation**: Strip markdown code fences before parsing, provide strict few-shot examples in system prompts, specify `format: "json"` in Ollama requests, and wrap parsing with Zod `.safeParse()` to trigger automatic retry or graceful error UI.

### 5. IndexedDB Synchronization Latency & Memory Leaks
- **Pitfall**: Serializing the entire 500+ node tldraw store into IndexedDB on every keystroke or drag event causes heavy jank and frame drops.
- **Mitigation**: Debounce IndexedDB writes to 3000ms intervals, or store incremental delta logs with periodic snapshots.
