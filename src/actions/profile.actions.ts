"use server";

import { auth } from "@/lib/auth";
import { failure, success, type ActionResult } from "@/lib/errors";
import { profileService } from "@/services/profile.service";
import { profileRepository } from "@/services/profile.repository";
import { z } from "zod";

const syncSchema = z.object({
  codeforcesHandle: z.string().optional(),
  leetcodeUsername: z.string().optional(),
});

const settingsSchema = z.object({
  codeforcesHandle: z.string().optional(),
  leetcodeUsername: z.string().optional(),
  targetRating: z.coerce.number().min(800).max(3500).optional(),
  bio: z.string().max(500).optional(),
  geminiApiKey: z.string().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
});

export async function syncProfileAction(
  input: z.infer<typeof syncSchema>
): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const parsed = syncSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid input");

    await profileService.syncProfile(
      session.user.id,
      parsed.data.codeforcesHandle,
      parsed.data.leetcodeUsername
    );

    return success({ message: "Profile synced successfully" });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Sync failed");
  }
}

export async function updateSettingsAction(
  input: z.infer<typeof settingsSchema>
): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid settings");

    await profileRepository.upsert(session.user.id, parsed.data);
    return success({ message: "Settings updated" });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Update failed");
  }
}
