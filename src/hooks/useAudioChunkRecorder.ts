"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAudioChunkRecorderOptions {
  timesliceMs?: number; // 3000ms per VOIC-02
  onChunkReady?: (blob: Blob, durationMs: number) => void;
}

export interface UseAudioChunkRecorderReturn {
  isRecording: boolean;
  audioLevel: number; // 0 to 100
  chunkCount: number;
  error: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

export function useAudioChunkRecorder(
  options: UseAudioChunkRecorderOptions = {}
): UseAudioChunkRecorderReturn {
  const { timesliceMs = 3000, onChunkReady } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const onChunkReadyRef = useRef(onChunkReady);
  const chunkStartTimeRef = useRef<number>(0);

  useEffect(() => {
    onChunkReadyRef.current = onChunkReady;
  }, [onChunkReady]);

  // Check MediaRecorder browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported =
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined";
      setIsSupported(supported);
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setAudioLevel(0);

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Error stopping MediaRecorder:", err);
      }
    }
    mediaRecorderRef.current = null;

    // Stop microphone stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Cancel audio analysis animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore audio context close error
      }
      audioContextRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    // Clean up any existing session
    stopRecording();
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Select optimal supported MIME type
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ""; // Browser default
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      // Web Audio API AnalyserNode for live VU audio level metering
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!streamRef.current) return;
          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Scale 0-255 down to 0-100
          const level = Math.min(100, Math.round((average / 128) * 100));
          setAudioLevel(level);

          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      } catch (audioErr) {
        console.warn("Could not start audio level analyser:", audioErr);
      }

      chunkStartTimeRef.current = Date.now();

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          const now = Date.now();
          const duration = now - chunkStartTimeRef.current;
          chunkStartTimeRef.current = now;

          setChunkCount((prev) => prev + 1);

          if (onChunkReadyRef.current) {
            onChunkReadyRef.current(event.data, duration);
          }
        }
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setError("Audio recording error occurred.");
        stopRecording();
      };

      // Start recording with 3-second slices (VOIC-02)
      recorder.start(timesliceMs);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone permission denied.");
      } else {
        setError("Could not access microphone.");
      }
      setIsRecording(false);
    }
  }, [stopRecording, timesliceMs]);

  const reset = useCallback(() => {
    stopRecording();
    setChunkCount(0);
    setError(null);
  }, [stopRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    audioLevel,
    chunkCount,
    error,
    isSupported,
    startRecording,
    stopRecording,
    reset,
  };
}
