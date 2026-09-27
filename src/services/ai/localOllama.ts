import { CanvasAction, CanvasActionSchema } from "@/types/actions";
import { CanvasSpatialContext } from "@/types/canvas";
import {
  buildSystemInstruction,
  cleanJsonResponse,
  generateMockFallbackAction,
} from "./cloudGemini";

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Local edge LLM inference runner connecting to Ollama daemon (gemma:2b / qwen2.5:3b)
 * Enforces ROUT-04 (identical system prompt contracts and JSON schemas) with 3200ms timeout (ROUT-03).
 */
export async function generateLocalOllamaAction(
  transcript: string,
  spatialContext: CanvasSpatialContext,
  model = process.env.OLLAMA_MODEL || "gemma:2b"
): Promise<CanvasAction> {
  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const endpoint = `${host.replace(/\/$/, "")}/api/chat`;

  // Guaranteed identical system instruction and schema constraints (ROUT-04)
  const systemPrompt = buildSystemInstruction(spatialContext);

  const controller = new AbortController();
  // 3200ms edge execution timeout (ROUT-03)
  const timeoutId = setTimeout(() => controller.abort(), 3200);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        format: "json",
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}: ${res.statusText}`);
    }

    const data: OllamaChatResponse = await res.json();
    const rawContent = data.message?.content || "";

    if (!rawContent) {
      throw new Error("Empty message content returned from Ollama edge model.");
    }

    const cleaned = cleanJsonResponse(rawContent);
    const parsed = JSON.parse(cleaned);

    const validation = CanvasActionSchema.safeParse(parsed);
    if (!validation.success) {
      console.error("[VoxCanvas:Ollama] Schema validation rejected output:", validation.error);
      throw new Error(`Ollama output schema validation failed: ${validation.error.message}`);
    }

    return validation.data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(
      `[VoxCanvas:Ollama] Edge daemon unreachable or timed out at ${endpoint} (${
        err instanceof Error ? err.message : String(err)
      }). Utilizing deterministic spatial fallback.`
    );
    // Offline resilience: deterministic fallback prevents canvas freezing
    return generateMockFallbackAction(transcript, spatialContext);
  }
}
