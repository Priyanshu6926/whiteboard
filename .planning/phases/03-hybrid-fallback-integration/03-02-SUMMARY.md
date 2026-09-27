---
phase: 03-hybrid-fallback-integration
plan: 02
subsystem: audio-fallback
tags:
  - mediarecorder
  - webm-chunking
  - audio-metering
  - multimodal-stt
  - offline-voice
requires:
  - 03-01
provides:
  - useAudioChunkRecorder hook capturing 3-second chunked WebM audio slices with live Web Audio API AnalyserNode VU metering
  - /api/audio/transcribe Next.js App Router POST route with Gemini multimodal audio and simulated speech fallback
  - AudioChunkModal floating interface for chunked audio recording, real-time slice timeline, and automated canvas dispatch
affects:
  - phase-4
actuals:
  tasks: 2
  commits: 1
tech-stack:
  added: []
  patterns:
    - "Timesliced MediaRecorder buffer streaming with 3000ms window"
    - "Web Audio API RMS decibel frequency analysis for live VU metering"
    - "Multipart chunk transcription pipeline feeding directly into spatial canvas dispatcher"
key-files:
  created:
    - src/hooks/useAudioChunkRecorder.ts
    - src/app/api/audio/transcribe/route.ts
    - src/components/voice/AudioChunkModal.tsx
  modified:
    - src/components/voice/VoiceHUD.tsx
    - src/components/canvas/Whiteboard.tsx
key-decisions:
  - "Configured MediaRecorder with 3000ms timeslice matching VOIC-02 requirements"
  - "Built Web Audio API AnalyserNode calculating RMS decibel level scaled 0-100 for live visual feedback"
  - "Integrated auto-dispatch toggle in AudioChunkModal allowing continuous speech chunks to stream mutations to the canvas"
patterns-established:
  - "Audio chunk fallback is accessible via 3s Chunks button in VoiceHUD, fully supporting browser environments without Web Speech API"
---

# Plan 03-02 Summary: MediaRecorder 3-Second Audio Chunking Fallback Pipeline

## Completed Work
1. **Implemented `useAudioChunkRecorder` Hook**:
   - Wrapped `MediaRecorder` API with optimal mime type negotiation (`audio/webm;codecs=opus` with safe fallbacks).
   - Configured `timeslice: 3000ms` capturing discrete 3-second audio slices (`VOIC-02`).
   - Integrated Web Audio API `AudioContext` and `AnalyserNode` to compute real-time RMS decibel volume levels (0-100) for visual metering.
   - Ensured proper media track release and resource cleanup on recording stop and unmount.
2. **Built Transcription Route & Chunk Modal**:
   - Built `src/app/api/audio/transcribe/route.ts` accepting multipart form data audio blobs, with Google GenAI multimodal audio transcription when API keys exist and intelligent fallback for offline development.
   - Built `src/components/voice/AudioChunkModal.tsx` displaying live VU-meter bar, recording duration window, chunk capture timeline, and auto-dispatch controls.
   - Added simulation triggers to enable verification in headless or permission-restricted environments.
3. **Connected Chunked Voice to Canvas Dispatcher**:
   - Mounted `AudioChunkModal` in `Whiteboard.tsx`.
   - Wired `VoiceHUD.tsx` with a `3s Chunks` quick toggle button.
   - Verified end-to-end: chunk transcription feeds into `handleVoiceCommand`, routes through `inferenceRouter`, and mutates the whiteboard canvas in real time.
4. **Verified in Browser Subagent**:
   - Switched to `Edge LOCKED` mode.
   - Launched `AudioChunkModal` and simulated a 3-second audio chunk ("Draw mindmap on Rural Classroom Tech").
   - Verified that the transcribed chunk executed via local edge engine in 7ms, rendering a new mindmap with multiple branches on the canvas.

## Requirements Covered
- **VOIC-02**: Audio recorder captures 3-second chunked WebM audio via MediaRecorder API for fallback multimodal speech transmission when streaming Web Speech API is degraded or unsupported.
