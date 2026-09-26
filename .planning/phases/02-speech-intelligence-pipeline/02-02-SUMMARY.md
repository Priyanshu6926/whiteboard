---
phase: 02-speech-intelligence-pipeline
plan: 02
subsystem: ai-pipeline
tags:
  - zod
  - gemini-api
  - spatial-intelligence
  - collision-avoidance
  - action-dispatcher
  - nextjs-api
requires:
  - 02-01
provides:
  - Strict Zod discriminated union schema CanvasActionSchema for all canvas operations
  - Dynamic /api/llm/cloud Next.js App Router POST endpoint integrating Google Gemini with deterministic heuristic fallback
  - Spatial context prompt injection and quadrant collision avoidance heuristic in layoutUtils
  - actionDispatcher service bridging validated Zod actions to CanvasManager methods
affects:
  - phase-3
  - phase-4
actuals:
  tasks: 3
  commits: 1
tech-stack:
  added:
    - zod
    - "@google/genai"
  patterns:
    - "Discriminated union action validation schema rejecting freeform markdown hallucinations"
    - "Dynamic spatial context injection passing visible shapes and bounds to AI"
    - "Quadrant collision avoidance spiral search guaranteeing non-overlapping node placement"
key-files:
  created:
    - src/types/actions.ts
    - src/services/ai/cloudGemini.ts
    - src/services/ai/actionDispatcher.ts
    - src/app/api/llm/cloud/route.ts
  modified:
    - package.json
    - src/services/canvas/layoutUtils.ts
    - src/services/canvas/CanvasManager.ts
    - src/components/canvas/Whiteboard.tsx
    - src/components/voice/VoiceHUD.tsx
key-decisions:
  - "Used Zod discriminated union on action field to guarantee compile-time and runtime type safety"
  - "Implemented dual-mode AI inference in cloudGemini: native Google GenAI SDK when GEMINI_API_KEY is present, with intelligent deterministic pattern matching fallback when running locally/offline"
  - "Added quadrant collision avoidance heuristic (findNonOverlappingPosition) checking 2D bounding boxes with radial spiral search to eliminate card overlapping"
patterns-established:
  - "Voice transcripts pass to /api/llm/cloud with spatial context, validated through CanvasActionSchema, then routed through dispatchCanvasAction to mutate tldraw store"
---

# Plan 02-02 Summary: Spatial Zod Engine, Gemini LLM Route & Action Dispatcher

## Completed Work
1. **Installed Dependencies & Defined Action Schemas**:
   - Installed `zod` and `@google/genai`.
   - Defined `CanvasActionSchema` as a discriminated union on `"action"`:
     - `create_mindmap`: rootTitle, branches (1-8 items), suggestedLayout (`horizontal` | `radial`).
     - `create_node`: label, nodeType (`note` | `card` | `quiz_block`), relativeToNodeId, placement (`right` | `bottom` | `left` | `top`).
     - `connect_nodes`: sourceNodeId, targetNodeId, label.
     - `set_countdown_timer`: durationSeconds (1-3600), title.
   - Exported `LLMRequest` and `LLMResponse` contracts.
2. **Built Cloud AI Inference Service & Route**:
   - Built `src/services/ai/cloudGemini.ts` with `generateCloudAction`:
     - Dynamic spatial prompt injection serializing visible node bounds, labels, and viewport.
     - `@google/genai` integration with `responseMimeType: "application/json"`.
     - Deterministic pattern-matching fallback parser for offline/development mode.
   - Built Next.js App Router POST route `src/app/api/llm/cloud/route.ts`:
     - Parses request body, extracts spatial context, runs inference, and enforces `CanvasActionSchema.safeParse`.
     - Rejects malformed or freeform inputs with HTTP 400.
3. **Implemented Action Dispatcher & Spatial Collision Avoidance**:
   - Implemented `src/services/ai/actionDispatcher.ts` mapping each validated action to `CanvasManager` methods.
   - Enhanced `src/services/canvas/layoutUtils.ts` with `boxesOverlap` and `findNonOverlappingPosition` implementing quadrant spiral collision checks.
   - Wired `CanvasManager.addNode` and `CanvasManager.setTimer` to automatically place shapes into collision-free quadrant positions.
4. **Wired End-to-End Voice Pipeline**:
   - Connected `Whiteboard.tsx` `handleVoiceCommand` to `/api/llm/cloud` and `dispatchCanvasAction`.
   - Enhanced `VoiceHUD.tsx` with an accessible quick command palette and manual text input drawer for environments without live microphones.
5. **Verified with Browser Testing**:
   - Verified via Playwright browser subagent: mindmap generation, timer widget, and note placement rendered cleanly without overlapping.

## Requirements Covered
- **SPAT-01**: Real-time `CanvasSpatialContext` extractor (viewport bounds, zoom, existing node positions).
- **SPAT-02**: Quadrant collision avoidance heuristics preventing node overlap.
- **TOOL-01**: Strict Zod discriminated union schema (`CanvasActionSchema`) for `create_mindmap`, `create_node`, `connect_nodes`, and `set_countdown_timer`.
- **TOOL-02**: Boundary validation rejecting freeform LLM markdown.
