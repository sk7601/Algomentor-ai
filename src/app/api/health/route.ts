import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "AlgoMentor AI",
    timestamp: new Date().toISOString(),
  });
}
