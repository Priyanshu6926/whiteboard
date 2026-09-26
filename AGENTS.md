<!-- GSD:project-start source:PROJECT.md -->

## Project

**VoxCanvas (Voice-First Spatial Intelligence Platform)**

VoxCanvas is an accessibility-first, voice-directed collaborative whiteboard platform designed for users with motor disabilities and educators in physical and bandwidth-constrained classrooms. It translates natural, unstructured spoken language into deterministic spatial canvas mutations (nodes, edges, mindmaps, timers) with real-time WebSocket synchronization (<150ms latency) and full offline resilience via local IndexedDB and edge LLMs.

**Core Value:** Deterministic, sub-second translation of spoken natural language into precise, non-overlapping spatial canvas actions, seamlessly executing online or offline without losing state or teacher-student synchronization.

### Constraints

- **Tech Stack**: Next.js (TypeScript), `@tldraw/tldraw`, Socket.IO, Web Speech API, Google Gemini/Gemma API, Ollama (Local LLM), IndexedDB, Tailwind CSS
- **Performance**:
  - STT Interim preview: < 100ms
  - Cloud inference round-trip: < 1.8s
  - Local edge inference (8GB RAM host): < 3.2s
  - WebSocket delta broadcast: < 120ms for 30+ concurrent viewers
  - Client memory footprint: < 250MB heap on 500+ canvas nodes
- **Deployment**: Next.js frontend on Vercel; Socket.IO state server on Render/Railway; Edge runner on local Ollama daemon

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Executive Summary

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

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
