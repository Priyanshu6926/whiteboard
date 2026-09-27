import { CanvasAction, LLMResponse } from "@/types/actions";
import { CanvasSpatialContext } from "@/types/canvas";

export interface RouteInferenceOptions {
  transcript: string;
  spatialContext: CanvasSpatialContext;
  preferredEngine?: "cloud" | "edge";
}

export interface RouteInferenceResult {
  success: boolean;
  action?: CanvasAction;
  engine: "cloud" | "edge";
  latencyMs: number;
  error?: string;
}

/**
 * Dynamic Hybrid Inference Router (ROUT-02, ROUT-03)
 * Attempts cloud Gemini inference with 1.8s timeout, transparently failing over to local Ollama.
 */
export async function routeInference(
  options: RouteInferenceOptions
): Promise<RouteInferenceResult> {
  const { transcript, spatialContext, preferredEngine = "cloud" } = options;
  const startTime = performance.now();

  // If edge is explicitly preferred, route directly to local edge LLM
  if (preferredEngine === "edge") {
    try {
      const localController = new AbortController();
      // 3200ms timeout per ROUT-03
      const timeoutId = setTimeout(() => localController.abort(), 3200);

      const res = await fetch("/api/llm/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, spatialContext }),
        signal: localController.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);
      const data: LLMResponse = await res.json();

      if (res.ok && data.success && data.action) {
        return {
          success: true,
          action: data.action,
          engine: "edge",
          latencyMs: elapsed,
        };
      }

      return {
        success: false,
        engine: "edge",
        latencyMs: elapsed,
        error: data.error || "Edge inference failed to produce valid action.",
      };
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: false,
        engine: "edge",
        latencyMs: elapsed,
        error: err instanceof Error ? err.message : "Edge execution failed.",
      };
    }
  }

  // Otherwise, attempt Cloud Gemini endpoint first with 1.8s timeout (ROUT-02)
  try {
    const cloudController = new AbortController();
    const timeoutId = setTimeout(() => cloudController.abort(), 1800);

    const res = await fetch("/api/llm/cloud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, spatialContext }),
      signal: cloudController.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Math.round(performance.now() - startTime);
    const data: LLMResponse = await res.json();

    if (res.ok && data.success && data.action) {
      return {
        success: true,
        action: data.action,
        engine: "cloud",
        latencyMs: elapsed,
      };
    }

    throw new Error(data.error || "Cloud inference endpoint rejected request");
  } catch (cloudErr) {
    console.warn(
      `[VoxCanvas:Router] Cloud route failed or exceeded 1.8s timeout (${
        cloudErr instanceof Error ? cloudErr.message : String(cloudErr)
      }). Transparently failing over to local edge engine.`
    );

    // Failover to local Ollama edge route (ROUT-03)
    try {
      const edgeStart = performance.now();
      const localController = new AbortController();
      const timeoutId = setTimeout(() => localController.abort(), 3200);

      const res = await fetch("/api/llm/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, spatialContext }),
        signal: localController.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - edgeStart);
      const data: LLMResponse = await res.json();

      if (res.ok && data.success && data.action) {
        return {
          success: true,
          action: data.action,
          engine: "edge",
          latencyMs: elapsed,
        };
      }

      return {
        success: false,
        engine: "edge",
        latencyMs: elapsed,
        error: data.error || "Failover edge inference rejected.",
      };
    } catch (edgeErr) {
      const totalElapsed = Math.round(performance.now() - startTime);
      return {
        success: false,
        engine: "edge",
        latencyMs: totalElapsed,
        error: edgeErr instanceof Error ? edgeErr.message : "Both cloud and edge failed.",
      };
    }
  }
}
