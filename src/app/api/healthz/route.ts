import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: Date.now(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
