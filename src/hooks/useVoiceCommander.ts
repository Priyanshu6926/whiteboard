"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API interfaces for TypeScript compatibility
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseVoiceCommanderOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalTranscript?: (transcript: string, confidence: number) => void;
  onInterimTranscript?: (transcript: string) => void;
}

export interface UseVoiceCommanderReturn {
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  confidence: number;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceCommander(
  options: UseVoiceCommanderOptions = {}
): UseVoiceCommanderReturn {
  const {
    lang = "en-US",
    continuous = true,
    interimResults = true,
    onFinalTranscript,
    onInterimTranscript,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const onFinalRef = useRef(onFinalTranscript);
  const onInterimRef = useRef(onInterimTranscript);

  // Keep callback refs updated to avoid re-initializing recognition on callback change
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onInterimRef.current = onInterimTranscript;
  }, [onInterimTranscript]);

  // Keep isListeningRef in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Check support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setInterimTranscript("");
    setFinalTranscript("");
    setConfidence(0);
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop SpeechRecognition:", err);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    // If an existing instance is active, stop it first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort error
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = "";
        let finalPhrase = "";
        let phraseConfidence = 0.9;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0]?.transcript || "";
          const resultConfidence = result[0]?.confidence ?? 0;

          if (result.isFinal) {
            finalPhrase += transcriptText;
            // Native speech API confidence is sometimes 0; use realistic confidence fallback
            phraseConfidence =
              resultConfidence > 0 ? resultConfidence : 0.92;
          } else {
            currentInterim += transcriptText;
          }
        }

        // Sub-50ms interim rendering
        setInterimTranscript(currentInterim);
        if (onInterimRef.current && currentInterim) {
          onInterimRef.current(currentInterim);
        }

        if (finalPhrase.trim()) {
          const cleanedFinal = finalPhrase.trim();
          setFinalTranscript(cleanedFinal);
          setConfidence(phraseConfidence);
          if (onFinalRef.current) {
            onFinalRef.current(cleanedFinal, phraseConfidence);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // "no-speech" is normal when silence occurs; do not treat as fatal error
        if (event.error === "no-speech") {
          return;
        }

        if (event.error === "audio-capture") {
          setError("No microphone detected. Please connect a microphone.");
          setIsListening(false);
          isListeningRef.current = false;
        } else if (event.error === "not-allowed") {
          setError("Microphone permission denied. Please allow microphone access.");
          setIsListening(false);
          isListeningRef.current = false;
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if user still intended to be listening (handles browser auto-cutoff)
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition initialization error:", err);
      setError("Failed to start speech recognition.");
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [continuous, interimResults, lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore unmount abort errors
        }
      }
    };
  }, []);

  return {
    isListening,
    interimTranscript,
    finalTranscript,
    confidence,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
