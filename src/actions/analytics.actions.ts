"use server";

import { auth } from "@/lib/auth";
import { failure, success, type ActionResult } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { analyticsService } from "@/services/analytics.service";
import { profileRepository } from "@/services/profile.repository";
import { profileService } from "@/services/profile.service";
import { recommendationService } from "@/services/recommendation.service";
import { getCached, setCached } from "@/lib/redis";
import type {
  AdvancedAnalytics,
  ContestPrediction,
  DashboardData,
  InterviewReadiness,
  ProblemRecommendation,
} from "@/types";

export async function getDashboardAction(): Promise<ActionResult<DashboardData>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const data = await profileService.getDashboardData(session.user.id);
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to load dashboard");
  }
}

export async function getPredictionsAction(): Promise<ActionResult<ContestPrediction>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const cacheKey = `predictions:${session.user.id}`;
    const cached = await getCached<ContestPrediction>(cacheKey);
    if (cached) return success(cached);

    const profile = await profileRepository.getByUserId(session.user.id);
    const topics = await profileRepository.getTopicStats(session.user.id);
    const contests = await profileRepository.getContestHistory(session.user.id);

    const analytics = {
      currentRating: profile?.currentRating ?? 0,
      peakRating: profile?.peakRating ?? 0,
      contestsParticipated: profile?.contestsParticipated ?? 0,
      problemsSolved: profile?.problemsSolved ?? 0,
      accuracy: profile?.accuracy ?? 0,
      activityTrend: [],
      ratingHistory: contests.map((c) => ({
        date: c.contestDate.toISOString().split("T")[0],
        rating: c.ratingAfter ?? 0,
      })),
    };

    const topicAnalysis = topics.map((t) => ({
      topic: t.topic,
      strengthScore: t.strengthScore,
      weaknessScore: t.weaknessScore,
      acceptanceRate: t.acceptanceRate,
      problemsSolved: t.problemsSolved,
      problemsAttempted: t.problemsAttempted,
      trend: t.trend,
    }));

    const cfContests = contests.map((c) => ({
      contestId: parseInt(c.contestId, 10),
      contestName: c.contestName,
      rank: c.rank ?? 0,
      ratingUpdateTimeSeconds: Math.floor(c.contestDate.getTime() / 1000),
      oldRating: c.ratingBefore ?? 0,
      newRating: c.ratingAfter ?? 0,
      problemsSolved: c.problemsSolved,
    }));

    const prediction = analyticsService.predictRatings(analytics, topicAnalysis, cfContests);

    await prisma.prediction.create({
      data: {
        userId: session.user.id,
        nextContestRating: prediction.nextContestRating,
        threeMonthRating: prediction.threeMonthRating,
        sixMonthRating: prediction.sixMonthRating,
        confidence: prediction.confidence,
        factors: prediction.factors as object,
        history: prediction.history as object,
      },
    });

    await setCached(cacheKey, prediction);
    return success(prediction);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Prediction failed");
  }
}

export async function getRecommendationsAction(): Promise<
  ActionResult<{ easy: ProblemRecommendation[]; medium: ProblemRecommendation[]; hard: ProblemRecommendation[] }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const profile = await profileRepository.getByUserId(session.user.id);
    const topics = await profileRepository.getTopicStats(session.user.id);
    const submissions = await profileRepository.getSubmissions(session.user.id);

    const topicAnalysis = topics.map((t) => ({
      topic: t.topic,
      strengthScore: t.strengthScore,
      weaknessScore: t.weaknessScore,
      acceptanceRate: t.acceptanceRate,
      problemsSolved: t.problemsSolved,
      problemsAttempted: t.problemsAttempted,
      trend: t.trend,
    }));

    const solved = new Set(submissions.filter((s) => s.verdict === "OK").map((s) => s.problemName));
    const recs = await recommendationService.generate(
      profile?.currentRating ?? 1200,
      topicAnalysis,
      solved
    );

    for (const difficulty of ["Easy", "Medium", "Hard"] as const) {
      const list = recs[difficulty.toLowerCase() as "easy" | "medium" | "hard"];
      for (const rec of list) {
        await prisma.recommendation.create({
          data: {
            userId: session.user.id,
            difficulty,
            problemName: rec.problemName,
            platform: rec.platform,
            topic: rec.topic,
            rating: rec.rating,
            url: rec.url,
            reason: rec.reason,
          },
        });
      }
    }

    return success(recs);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Recommendations failed");
  }
}

export async function getInterviewReadinessAction(): Promise<ActionResult<InterviewReadiness[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const profile = await profileRepository.getByUserId(session.user.id);
    const topics = await profileRepository.getTopicStats(session.user.id);

    const analytics = {
      currentRating: profile?.currentRating ?? 0,
      peakRating: profile?.peakRating ?? 0,
      contestsParticipated: profile?.contestsParticipated ?? 0,
      problemsSolved: profile?.problemsSolved ?? 0,
      accuracy: profile?.accuracy ?? 0,
      activityTrend: [],
      ratingHistory: [],
    };

    const topicAnalysis = topics.map((t) => ({
      topic: t.topic,
      strengthScore: t.strengthScore,
      weaknessScore: t.weaknessScore,
      acceptanceRate: t.acceptanceRate,
      problemsSolved: t.problemsSolved,
      problemsAttempted: t.problemsAttempted,
      trend: t.trend,
    }));

    const readiness = analyticsService.computeInterviewReadiness(analytics, topicAnalysis);
    return success(readiness);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Interview readiness failed");
  }
}

export async function getAdvancedAnalyticsAction(): Promise<ActionResult<AdvancedAnalytics>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return failure("Unauthorized");

    const snapshot = await profileRepository.getLatestSnapshot(session.user.id);
    if (snapshot) {
      return success({
        learningVelocity: snapshot.learningVelocity,
        contestConsistency: snapshot.contestConsistency,
        topicDistribution: snapshot.topicDistribution as AdvancedAnalytics["topicDistribution"],
        activityHeatmap: snapshot.activityHeatmap as AdvancedAnalytics["activityHeatmap"],
        ratingForecast: snapshot.ratingForecast as AdvancedAnalytics["ratingForecast"],
        masteryCurves: snapshot.masteryCurves as AdvancedAnalytics["masteryCurves"],
      });
    }

    const profile = await profileRepository.getByUserId(session.user.id);
    const topics = await profileRepository.getTopicStats(session.user.id);
    const submissions = await profileRepository.getSubmissions(session.user.id);
    const contests = await profileRepository.getContestHistory(session.user.id);

    const analytics = {
      currentRating: profile?.currentRating ?? 0,
      peakRating: profile?.peakRating ?? 0,
      contestsParticipated: profile?.contestsParticipated ?? 0,
      problemsSolved: profile?.problemsSolved ?? 0,
      accuracy: profile?.accuracy ?? 0,
      activityTrend: [],
      ratingHistory: [],
    };

    const topicAnalysis = topics.map((t) => ({
      topic: t.topic,
      strengthScore: t.strengthScore,
      weaknessScore: t.weaknessScore,
      acceptanceRate: t.acceptanceRate,
      problemsSolved: t.problemsSolved,
      problemsAttempted: t.problemsAttempted,
      trend: t.trend,
    }));

    const cfSubmissions = submissions.map((s) => ({
      id: 0,
      problemName: s.problemName,
      problemRating: s.problemRating ?? 0,
      tags: s.tags,
      verdict: s.verdict,
      programmingLanguage: s.language ?? "",
      creationTimeSeconds: Math.floor(s.submittedAt.getTime() / 1000),
    }));

    const cfContests = contests.map((c) => ({
      contestId: 0,
      contestName: c.contestName,
      rank: c.rank ?? 0,
      ratingUpdateTimeSeconds: Math.floor(c.contestDate.getTime() / 1000),
      oldRating: c.ratingBefore ?? 0,
      newRating: c.ratingAfter ?? 0,
      problemsSolved: c.problemsSolved,
    }));

    const advanced = analyticsService.buildAdvancedAnalytics(
      analytics,
      topicAnalysis,
      cfSubmissions,
      cfContests
    );

    return success(advanced);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Advanced analytics failed");
  }
}
