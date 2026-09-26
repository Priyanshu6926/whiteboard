import { GoogleGenAI } from "@google/genai";
import { CanvasAction, CanvasActionSchema } from "@/types/actions";
import { CanvasSpatialContext } from "@/types/canvas";

/**
 * Builds the system instruction with spatial grounding and schema constraints.
 */
function buildSystemInstruction(spatialContext: CanvasSpatialContext): string {
  const visibleNodes = spatialContext.existingNodes.map((n) => ({
    id: n.id,
    type: n.type,
    text: n.text,
    bounds: n.bounds,
  }));

  return `You are the Spatial Intelligence Engine for VoxCanvas, a voice-directed collaborative whiteboard.
Your job is to translate natural speech transcripts into deterministic canvas mutations.

CURRENT SPATIAL CANVAS CONTEXT:
- Viewport: ${JSON.stringify(spatialContext.viewport)}
- Existing Canvas Nodes (${visibleNodes.length} visible):
${JSON.stringify(visibleNodes, null, 2)}

SUPPORTED TOOL ACTIONS (Output ONE valid JSON object only):
1. create_mindmap:
   {
     "action": "create_mindmap",
     "rootTitle": "Topic name (max 80 chars)",
     "branches": ["Subtopic 1", "Subtopic 2", "Subtopic 3", ...], // 1-8 items
     "suggestedLayout": "horizontal" | "radial"
   }

2. create_node:
   {
     "action": "create_node",
     "label": "Content text for node",
     "nodeType": "note" | "card" | "quiz_block",
     "relativeToNodeId": "optional existing node id to anchor near",
     "placement": "right" | "bottom" | "left" | "top"
   }

3. connect_nodes:
   {
     "action": "connect_nodes",
     "sourceNodeId": "id of source node",
     "targetNodeId": "id of target node",
     "label": "optional edge label"
   }

4. set_countdown_timer:
   {
     "action": "set_countdown_timer",
     "durationSeconds": number (1-3600),
     "title": "optional timer title"
   }

SPATIAL COLLISION AVOIDANCE RULES:
- When placing new nodes near existing content, set "relativeToNodeId" to the nearest relevant node id and select a "placement" ('right' | 'bottom' | 'left' | 'top') where space is unpopulated.
- For connect_nodes, find the most semantically relevant node ids from the list of existing canvas nodes.
- You must strictly output ONLY valid JSON adhering to one of these schemas. No conversational filler, no markdown wrappers (do NOT use \`\`\`json).`;
}

/**
 * Deterministic fallback parser for local development and offline mode when GEMINI_API_KEY is not configured.
 */
export function generateMockFallbackAction(
  transcript: string,
  spatialContext: CanvasSpatialContext
): CanvasAction {
  const lower = transcript.toLowerCase().trim();

  // 1. Mindmap detection
  if (
    lower.includes("mindmap") ||
    lower.includes("mind map") ||
    lower.includes("branches") ||
    lower.includes("brainstorm")
  ) {
    let topic = "Main Topic";
    const onMatch = lower.match(/(?:on|about|for)\s+([^,.]+)/i);
    if (onMatch && onMatch[1]) {
      topic = onMatch[1].trim();
      topic = topic.charAt(0).toUpperCase() + topic.slice(1);
    }

    const branches = [
      "Key Concept A",
      "Key Concept B",
      "Analysis & Metrics",
      "Future Strategy",
    ];

    return {
      action: "create_mindmap",
      rootTitle: topic,
      branches,
      suggestedLayout: "horizontal",
    };
  }

  // 2. Timer detection
  if (
    lower.includes("timer") ||
    lower.includes("countdown") ||
    lower.includes("seconds") ||
    lower.includes("minutes")
  ) {
    let seconds = 60;
    const minMatch = lower.match(/(\d+)\s*(?:minute|min)/i);
    const secMatch = lower.match(/(\d+)\s*(?:second|sec)/i);

    if (minMatch && minMatch[1]) {
      seconds = parseInt(minMatch[1], 10) * 60;
    } else if (secMatch && secMatch[1]) {
      seconds = parseInt(secMatch[1], 10);
    }

    let title = "Focus Timer";
    const forMatch = lower.match(/(?:for|named|called)\s+([^,.]+)/i);
    if (forMatch && forMatch[1] && !forMatch[1].includes("minute") && !forMatch[1].includes("second")) {
      title = forMatch[1].trim();
    }

    return {
      action: "set_countdown_timer",
      durationSeconds: Math.min(Math.max(seconds, 5), 3600),
      title,
    };
  }

  // 3. Connect nodes detection
  if (lower.includes("connect") || lower.includes("link") || lower.includes("arrow")) {
    const existing = spatialContext.existingNodes;
    if (existing.length >= 2) {
      const source = existing[existing.length - 2];
      const target = existing[existing.length - 1];
      return {
        action: "connect_nodes",
        sourceNodeId: source.id,
        targetNodeId: target.id,
        label: "relates to",
      };
    }
  }

  // 4. Default / Create Node
  let label = transcript.replace(/^(create|add|draw|put|new)\s+(a\s+)?(note|card|idea)?\s*(about|on|called)?\s*/i, "").trim();
  if (!label) {
    label = transcript;
  }
  label = label.charAt(0).toUpperCase() + label.slice(1);

  const nodeType = lower.includes("quiz") ? "quiz_block" : lower.includes("card") ? "card" : "note";

  // Check collision / relative placement
  const lastNode = spatialContext.existingNodes[spatialContext.existingNodes.length - 1];

  return {
    action: "create_node",
    label: label.length > 80 ? label.slice(0, 80) : label,
    nodeType,
    relativeToNodeId: lastNode ? lastNode.id : undefined,
    placement: "right",
  };
}

/**
 * Strips markdown code block formatting if returned by an LLM.
 */
function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    // Remove opening ```json or ```
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "");
    // Remove closing ```
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  return cleaned.trim();
}

/**
 * Main inference dispatcher calling Google Gemini or falling back to deterministic heuristic.
 */
export async function generateCloudAction(
  transcript: string,
  spatialContext: CanvasSpatialContext
): Promise<CanvasAction> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn(
      "[VoxCanvas:AI] GEMINI_API_KEY not found in environment. Using deterministic spatial fallback."
    );
    return generateMockFallbackAction(transcript, spatialContext);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildSystemInstruction(spatialContext);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nUSER SPOKEN VOICE COMMAND:\n"${transcript}"\n\nGenerate structured JSON:`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawOutput = response.text ?? "";
    if (!rawOutput) {
      throw new Error("Empty response received from Gemini model.");
    }

    const cleaned = cleanJsonResponse(rawOutput);
    const parsed = JSON.parse(cleaned);

    const validationResult = CanvasActionSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.error("[VoxCanvas:AI] Schema validation failed:", validationResult.error.issues);
      throw new Error(`Invalid action schema: ${validationResult.error.message}`);
    }

    return validationResult.data;
  } catch (err) {
    console.error("[VoxCanvas:AI] Gemini API error, falling back to heuristic:", err);
    return generateMockFallbackAction(transcript, spatialContext);
  }
}
