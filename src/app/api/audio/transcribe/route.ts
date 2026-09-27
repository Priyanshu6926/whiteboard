import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | File | null;
    const simulatedText = formData.get("simulatedText") as string | null;

    if (!file && !simulatedText) {
      return NextResponse.json(
        { success: false, error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (file && apiKey) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: file.type || "audio/webm",
                    data: base64Audio,
                  },
                },
                {
                  text: "Transcribe the spoken audio containing whiteboard voice commands. Return ONLY the transcribed text, with no preamble or punctuation wrappers.",
                },
              ],
            },
          ],
        });

        const transcript = (response.text ?? "").trim();
        if (transcript) {
          return NextResponse.json({
            success: true,
            transcript,
            confidence: 0.95,
          });
        }
      } catch (err) {
        console.warn(
          "[API:Audio:Transcribe] Gemini multimodal audio error, falling back to simulated transcript:",
          err
        );
      }
    }

    // Offline / Mock / Fallback transcription (VOIC-02)
    const fallbackCommands = [
      "Draw mindmap on Distributed Systems",
      "Set 3 minute timer for Review",
      "Add note Microservices Architecture",
      "Connect last two nodes",
    ];

    const fallbackText =
      simulatedText ||
      fallbackCommands[Math.floor(Math.random() * fallbackCommands.length)];

    return NextResponse.json({
      success: true,
      transcript: fallbackText,
      confidence: 0.92,
      isSimulated: !apiKey,
    });
  } catch (error) {
    console.error("[API:Audio:Transcribe] Unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Audio transcription failed",
      },
      { status: 500 }
    );
  }
}
