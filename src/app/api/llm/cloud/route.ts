import { NextRequest, NextResponse } from "next/server";
import { CanvasActionSchema, LLMResponse } from "@/types/actions";
import { generateCloudAction } from "@/services/ai/cloudGemini";
import { CanvasSpatialContext } from "@/types/canvas";

export async function POST(req: NextRequest): Promise<NextResponse<LLMResponse>> {
  try {
    const body = await req.json();
    const { transcript, spatialContext } = body;

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

    // Generate action from AI or spatial heuristic fallback
    const rawAction = await generateCloudAction(
      transcript.trim(),
      safeSpatialContext
    );

    // Strict schema boundary validation (TOOL-01, TOOL-02)
    const validation = CanvasActionSchema.safeParse(rawAction);

    if (!validation.success) {
      console.error("[API:LLM:Cloud] Schema validation rejected action:", validation.error);
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
    const message = error instanceof Error ? error.message : "Unknown inference error";
    console.error("[API:LLM:Cloud] Unhandled error:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
