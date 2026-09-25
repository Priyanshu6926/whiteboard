# Stack Research: VoxCanvas

**Researched:** 2026-09-25
**Confidence:** HIGH

## Executive Summary

VoxCanvas integrates a voice-driven spatial canvas with hybrid AI inference (Cloud Gemini ↔ Local Ollama) and real-time WebSocket state broadcasting. The chosen stack couples Next.js (App Router, TypeScript) with `@tldraw/tldraw` for infinite vector canvas operations, Web Speech API (`webkitSpeechRecognition`) + `MediaRecorder` for dual-engine audio, Socket.IO for sub-120ms delta broadcasting, Zod for strict JSON schema enforcement, and IndexedDB for zero-loss offline client persistence.

## Core Technologies

### Frontend & Application Layer
- **Next.js (App Router, TypeScript)**: Server components for SEO/landing, client components for reactive canvas and speech listeners, strict end-to-end type safety.
- **`@tldraw/tldraw`**: Production-ready infinite canvas SDK offering headless store abstractions, atomic shape mutations, camera management, and event hooks (`store.listen`).
- **Tailwind CSS**: High-performance utility styling for clean modal overlays, speech preview pill, room connection indicators, and HUD tools.

### Speech & Audio Processing
- **Web Speech API (`webkitSpeechRecognition`)**: Native browser streaming STT providing zero-latency interim transcripts with low overhead.
- **MediaRecorder API (Chunked WebM)**: Fallback audio capture for noisy environments, transmitting 3-second audio slices to multimodal transcription APIs.

### AI Inference & Routing
- **Google Gemini / Gemma API (`@google/genai` / REST)**: Cloud LLM for complex semantic spatial layout reasoning and fast structured JSON generation with guaranteed tool schema adherence.
- **Ollama (`gemma:2b` / `qwen2.5:3b`)**: Local edge LLM inference accessible via HTTP (`http://localhost:11434/api/chat`) with strict system prompts for deterministic JSON output in air-gapped scenarios.
- **Zod**: Discriminated union validation boundary preventing freeform LLM hallucination and enforcing valid action contracts.

### Real-Time & Persistence
- **Socket.IO**: WebSocket protocol server facilitating low-latency room-based state sync, broadcasting sequence-stamped `CanvasDeltaPayload` records.
- **IndexedDB (`idb` wrapper)**: High-capacity browser-side key-value database persisting local canvas mutations every 3 seconds for offline durability.

## Alternatives Considered

| Category | Option | Reason Rejected | Selected |
|---|---|---|---|
| Canvas | Fabric.js / Konva | Lacks modern infinite canvas zoom/pan mechanics and headless store architecture | `@tldraw/tldraw` |
| Realtime | WebRTC DataChannels | Mesh networking complexity exceeds single-master requirements; excessive signaling overhead | Socket.IO WebSockets |
| Schema | JSON Schema / Joi | Lacks seamless TypeScript type inference and discriminated union ergonomics | Zod |
| Local LLM | WebLLM (in-browser) | High VRAM/GPU variance on client devices, slow model initialization | Ollama local daemon |

## Installation & Environment Requirements
- Node.js 18+ / 20+ LTS
- Ollama runtime installed locally with `gemma:2b` or `qwen2.5:3b` pulled
- Gemini API Key (`GEMINI_API_KEY`) for cloud inference
