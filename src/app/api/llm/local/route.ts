import { NextRequest, NextResponse } from "next/server";
import { CanvasActionSchema, LLMResponse } from "@/types/actions";
import { generateLocalOllamaAction } from "@/services/ai/localOllama";
import { CanvasSpatialContext } from "@/types/canvas";

export async function POST(req: NextRequest): Promise<NextResponse<LLMResponse>> {
  try {
    const body = await req.json();
    const { transcript, spatialContext, model } = body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid 'transcript' in request body.",
        },
        { status: 400 }
      );
    }

    const safeSpatialContext: CanvasSpatialContext = spatialContext || {
      viewport: { x: 0, y: 0, width: 1920, height: 1080, zoom: 1 },
      existingNodes: [],
    };

    // Edge inference runner via Ollama daemon / fallback
    const rawAction = await generateLocalOllamaAction(
      transcript.trim(),
      safeSpatialContext,
      model
    );

    // Schema validation guard (TOOL-01, TOOL-02, ROUT-04)
    const validation = CanvasActionSchema.safeParse(rawAction);

    if (!validation.success) {
      console.error("[API:LLM:Local] Schema validation rejected edge action:", validation.error);
      return NextResponse.json(
        {
          success: false,
          error: `Schema validation failed: ${validation.error.issues.map((i) => i.message).join(", ")}`,
          raw: rawAction,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action: validation.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local inference execution failed";
    console.error("[API:LLM:Local] Unhandled error:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
