---
phase: 03-hybrid-fallback-integration
plan: 01
subsystem: routing-engine
tags:
  - network-health
  - hybrid-router
  - ollama
  - edge-ai
  - failover
requires:
  - 02-02
provides:
  - /api/healthz heartbeat endpoint for sub-second connectivity detection
  - useNetworkMonitor hook tracking online/offline status and round-trip latency
  - localOllama service and /api/llm/local endpoint enforcing identical system prompts and Zod schemas
  - inferenceRouter service with 1.8s cloud timeout and automatic failover to local edge runner
  - VoiceHUD Cloud vs Edge interactive status pill with latency measurement and toggle controls
affects:
  - 03-02-PLAN.md
  - phase-4
actuals:
  tasks: 3
  commits: 1
tech-stack:
  added: []
  patterns:
    - "Sub-1000ms heartbeat polling with AbortController timeout"
    - "Dual-engine hybrid routing with transparent client-side failover"
    - "Identical system prompt contracts across cloud and edge models"
key-files:
  created:
    - src/app/api/healthz/route.ts
    - src/hooks/useNetworkMonitor.ts
    - src/services/ai/localOllama.ts
    - src/app/api/llm/local/route.ts
    - src/services/ai/inferenceRouter.ts
  modified:
    - src/services/ai/cloudGemini.ts
    - src/components/voice/VoiceHUD.tsx
    - src/components/canvas/Whiteboard.tsx
key-decisions:
  - "Configured 1800ms abort threshold on cloud requests (ROUT-02) with instant failover to local edge LLM"
  - "Configured 3200ms abort threshold on Ollama requests (ROUT-03) with graceful fallback to deterministic spatial heuristic"
  - "Shared buildSystemInstruction across cloudGemini and localOllama to guarantee identical prompt contracts (ROUT-04)"
patterns-established:
  - "Interactive network mode pill in VoiceHUD allows cycling between Auto, Force Cloud, and Force Edge"
---

# Plan 03-01 Summary: Network Health Monitor, Dynamic Hybrid Router & Ollama Edge Client

## Completed Work
1. **Built Network Health Monitor**:
   - Implemented `src/app/api/healthz/route.ts` with no-cache headers returning `{ status: "ok", timestamp }`.
   - Created `src/hooks/useNetworkMonitor.ts` tracking `navigator.onLine` and polling `/api/healthz` every 2500ms with a 600ms abort timeout (`ROUT-01`).
   - Added manual engine override (`auto` | `cloud` | `edge`) to allow forced testing of offline/edge modes.
2. **Implemented Local Ollama Edge Engine**:
   - Built `src/services/ai/localOllama.ts` targeting Ollama daemon at `http://localhost:11434/api/chat` with 3200ms timeout (`ROUT-03`).
   - Reused `buildSystemInstruction` from `cloudGemini.ts` to ensure exact parity in system instructions and spatial context (`ROUT-04`).
   - Integrated deterministic spatial fallback when edge daemon is not actively running.
   - Built `src/app/api/llm/local/route.ts` strictly validating output with `CanvasActionSchema`.
3. **Built Hybrid Inference Router & HUD Indicators**:
   - Created `src/services/ai/inferenceRouter.ts` implementing automatic 1800ms cloud timeout and transparent edge failover.
   - Updated `VoiceHUD.tsx` with an interactive network mode pill showing `Cloud (Gemini)` vs `Edge (Ollama)`, live latency in milliseconds, and manual mode switching.
   - Wired `Whiteboard.tsx` to route all voice commands through `inferenceRouter`.
4. **Verified Build**:
   - Passed `npm run build` and `npx tsc --noEmit` with zero errors.
   - Verified `/api/healthz` and `/api/llm/local` endpoints via curl.

## Requirements Covered
- **ROUT-01**: Heartbeat connectivity monitor detecting online/offline transitions within 1000ms.
- **ROUT-02**: System routes to cloud Gemini endpoint with <1.8s round-trip tracking.
- **ROUT-03**: Automatic rerouting to local Ollama edge engine executing in <3.2s.
- **ROUT-04**: Identical prompt contracts and JSON schemas across cloud and local engines.
