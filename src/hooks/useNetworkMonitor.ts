"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NetworkOverrideMode = "auto" | "cloud" | "edge";
export type EffectiveEngineMode = "cloud" | "edge";

export interface UseNetworkMonitorReturn {
  isOnline: boolean;
  latencyMs: number | null;
  effectiveMode: EffectiveEngineMode;
  manualOverride: NetworkOverrideMode;
  lastChecked: number;
  checkHealth: () => Promise<boolean>;
  setManualOverride: (mode: NetworkOverrideMode) => void;
  toggleOverride: () => void;
}

export function useNetworkMonitor(): UseNetworkMonitorReturn {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [manualOverride, setManualOverride] = useState<NetworkOverrideMode>("auto");
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const checkingRef = useRef(false);

  // Check health against /api/healthz with 600ms abort threshold
  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;
    if (checkingRef.current) return isOnline;

    checkingRef.current = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const start = performance.now();

    try {
      // If browser native navigator.onLine is false, immediately mark offline (sub-1000ms ROUT-01)
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setIsOnline(false);
        setLatencyMs(null);
        setLastChecked(Date.now());
        clearTimeout(timeoutId);
        checkingRef.current = false;
        return false;
      }

      const res = await fetch(`/api/healthz?_t=${Date.now()}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - start);

      if (res.ok) {
        setIsOnline(true);
        setLatencyMs(elapsed);
        setLastChecked(Date.now());
        checkingRef.current = false;
        return true;
      } else {
        setIsOnline(false);
        setLatencyMs(null);
        setLastChecked(Date.now());
        checkingRef.current = false;
        return false;
      }
    } catch {
      clearTimeout(timeoutId);
      setIsOnline(false);
      setLatencyMs(null);
      setLastChecked(Date.now());
      checkingRef.current = false;
      return false;
    }
  }, [isOnline]);

  // Window event listeners for instant online/offline transitions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      checkHealth();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLatencyMs(null);
      setLastChecked(Date.now());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkHealth();

    // Periodic heartbeat check every 2500ms
    const interval = setInterval(() => {
      checkHealth();
    }, 2500);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkHealth]);

  // Determine effective inference mode
  const effectiveMode: EffectiveEngineMode =
    manualOverride === "cloud"
      ? "cloud"
      : manualOverride === "edge"
      ? "edge"
      : isOnline
      ? "cloud"
      : "edge";

  const toggleOverride = useCallback(() => {
    setManualOverride((current) => {
      if (current === "auto") return "cloud";
      if (current === "cloud") return "edge";
      return "auto";
    });
  }, []);

  return {
    isOnline,
    latencyMs,
    effectiveMode,
    manualOverride,
    lastChecked,
    checkHealth,
    setManualOverride,
    toggleOverride,
  };
}
