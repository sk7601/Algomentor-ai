"use server";

import { auth } from "@/lib/auth";
import { failure, success, type ActionResult } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { geminiService } from "@/services/gemini.service";
import { profileRepository } from "@/services/profile.repository";
import type { CodeReviewResult } from "@/types";
import { z } from "zod";

const reviewSchema = z.object({
  fileName: z.string(),
  language: z.enum(["cpp", "java", "py", "python", "c++"]),
  sourceCode: z.string().min(10).max(50000),
});

export async function reviewCodeAction(
  input: z.infer<typeof reviewSchema>
): Promise<ActionResult<CodeReviewResult & { id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) return failure("Invalid code submission");

    const profile = await profileRepository.getByUserId(session.user.id);
    const lang = parsed.data.language === "py" ? "python" : parsed.data.language;

    const review = await geminiService.reviewCode(
      parsed.data.sourceCode,
      lang,
      profile?.geminiApiKey
    );

    const saved = await prisma.codeReview.create({
      data: {
        userId: session.user.id,
        fileName: parsed.data.fileName,
        language: lang,
        sourceCode: parsed.data.sourceCode,
        timeComplexity: review.timeComplexity,
        spaceComplexity: review.spaceComplexity,
        edgeCases: review.edgeCases,
        optimizations: review.optimizations,
        alternatives: review.alternatives,
        bugs: review.bugs,
        codeQuality: review.codeQuality,
        fullReport: review as object,
      },
    });

    return success({ ...review, id: saved.id });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Code review failed");
  }
}

export async function getCodeReviewsAction(): Promise<
  ActionResult<Array<{ id: string; fileName: string; language: string; createdAt: Date }>>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const reviews = await prisma.codeReview.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true, language: true, createdAt: true },
    });

    return success(reviews);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to fetch reviews");
  }
}
