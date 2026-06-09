import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { profileService } from "@/services/profile.service";
import { z } from "zod";

const schema = z.object({
  codeforcesHandle: z.string().optional(),
  leetcodeUsername: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await profileService.syncProfile(
      session.user.id,
      parsed.data.codeforcesHandle,
      parsed.data.leetcodeUsername
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
