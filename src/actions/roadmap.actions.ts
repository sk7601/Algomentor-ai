"use server";

import { auth } from "@/lib/auth";
import { failure, success, type ActionResult } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { aiService } from "@/services/ai.service";
import { profileRepository } from "@/services/profile.repository";
import { analyticsService } from "@/services/analytics.service";
import type { RoadmapPlan } from "@/types";
import { z } from "zod";

const roadmapSchema = z.object({
  targetRating: z.number().min(800).max(3500),
  duration: z.union([z.literal(4), z.literal(8), z.literal(12)]),
});

export async function generateRoadmapAction(
  input: z.infer<typeof roadmapSchema>
): Promise<ActionResult<RoadmapPlan>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const parsed = roadmapSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid input");

    const profile = await profileRepository.getByUserId(session.user.id);
    const topics = await profileRepository.getTopicStats(session.user.id);
    const topicAnalysis = topics.map((t) => ({
      topic: t.topic,
      strengthScore: t.strengthScore,
      weaknessScore: t.weaknessScore,
      acceptanceRate: t.acceptanceRate,
      problemsSolved: t.problemsSolved,
      problemsAttempted: t.problemsAttempted,
      trend: t.trend,
    }));

    const weakTopics = analyticsService.getWeakTopics(topicAnalysis);
    const currentRating = profile?.currentRating ?? 1200;

    const plan = await aiService.generateRoadmap(
      currentRating,
      parsed.data.targetRating,
      weakTopics,
      parsed.data.duration
    );

    await prisma.roadmap.create({
      data: {
        userId: session.user.id,
        title: plan.title,
        duration: plan.duration,
        targetRating: plan.targetRating,
        weakTopics: plan.weakTopics,
        weeks: plan.weeks as object,
      },
    });

    return success(plan);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Roadmap generation failed");
  }
}

export async function getRoadmapsAction(): Promise<ActionResult<Array<{ id: string; title: string; duration: number; createdAt: Date }>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, duration: true, createdAt: true },
    });

    return success(roadmaps);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to fetch roadmaps");
  }
}
