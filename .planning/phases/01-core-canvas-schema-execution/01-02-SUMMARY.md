---
phase: 01-core-canvas-schema-execution
plan: 02
subsystem: canvas-service
tags:
  - tldraw
  - canvas-manager
  - layout
  - collision-avoidance
  - keyboard-harness
requires:
  - phase: 01-core-canvas-schema-execution
    provides: "@tldraw/tldraw canvas shell and dynamic CanvasWrapper"
provides:
  - Programmatic CanvasManager service wrapping tldraw Editor instance
  - Collision-free layout utilities for relative positioning and mindmap trees
  - Interactive KeyboardHarness and floating glassmorphism HarnessHUD
affects:
  - phase-2
  - speech-pipeline
actuals:
  tokens: 2800
  tasks: 3
  commits: 1
tech-stack:
  added:
    - "tldraw Editor APIs"
    - "tldraw Shape & Binding primitives"
  patterns:
    - "Service layer abstraction over raw canvas engine for AI & voice dispatchers"
    - "Relative bounding-box math preventing node collisions"
    - "Floating glassmorphism HUD for developer ergonomics and manual verification"
key-files:
  created:
    - src/types/canvas.ts
    - src/services/canvas/layoutUtils.ts
    - src/services/canvas/CanvasManager.ts
    - src/components/canvas/HarnessHUD.tsx
    - src/components/canvas/KeyboardHarness.tsx
  modified:
    - src/components/canvas/Whiteboard.tsx
key-decisions:
  - "Abstracted all tldraw shape and binding mutations into CanvasManager class to isolate external AI tool dispatchers from canvas SDK specifics"
  - "Implemented calculateTreeLayout with horizontal and radial geometry to ensure hierarchical mindmaps never collide with root or branch cards"
patterns-established:
  - "CanvasManager.getSpatialContext() provides structured viewport and node bounding data ready for prompt injection in Phase 2"
---

# Plan 01-02 Summary: CanvasManager & Keyboard Test Harness

## Completed Work
1. **Defined Spatial Types**: Created `src/types/canvas.ts` defining `NodeType`, `Placement`, `NodeBounds`, and `CanvasSpatialContext`.
2. **Collision-Free Geometry Utilities**: Created `src/services/canvas/layoutUtils.ts` with `calculateRelativePosition` and `calculateTreeLayout` (horizontal and radial auto-spacing).
3. **Deterministic CanvasManager**: Created `src/services/canvas/CanvasManager.ts` implementing `addNode`, `createEdge`, `layoutTree`, `setTimer`, `getSpatialContext`, and `clearCanvas`.
4. **Interactive Keyboard Harness & HUD**: Created `HarnessHUD.tsx` with hotkeys (`N`, `M`, `C`, `T`, `Clear`) and `KeyboardHarness.tsx` listening to window keystrokes.
5. **Integrated with Whiteboard**: Mounted `KeyboardHarness` inside `Whiteboard.tsx`.
6. **Browser Verification**: Tested in a real browser session; verified that notes, mindmap tree branches, and countdown timer spawn smoothly and update the node count from 0 to 8 nodes.

## Verification
- `npm run build` succeeds cleanly with zero errors
- Browser subagent verified live shape creation and hotkeys at `http://localhost:3000`
- Requirements `CANV-02` and `CANV-03` fully verified
