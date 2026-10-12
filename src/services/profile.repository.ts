import { prisma } from "@/lib/prisma";
import type { ProfileAnalytics, TopicAnalysis } from "@/types";

export class ProfileRepository {
  async getByUserId(userId: string) {
    return prisma.profile.findUnique({ where: { userId } });
  }

  async upsert(
    userId: string,
    data: {
      codeforcesHandle?: string;
      leetcodeUsername?: string;
      currentRating?: number;
      peakRating?: number;
      contestsParticipated?: number;
      problemsSolved?: number;
      accuracy?: number;
      targetRating?: number;
      bio?: string;
      geminiApiKey?: string;
      theme?: string;
    }
  ) {
    return prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async syncContestHistory(
    userId: string,
    contests: Array<{
      platform: string;
      contestId: string;
      contestName: string;
      rank?: number;
      ratingBefore?: number;
      ratingAfter?: number;
      ratingChange?: number;
      problemsSolved: number;
      contestDate: Date;
    }>
  ) {
    for (const c of contests) {
      await prisma.contestHistory.upsert({
        where: {
          userId_platform_contestId: {
            userId,
            platform: c.platform,
            contestId: c.contestId,
          },
        },
        create: { userId, ...c },
        update: c,
      });
    }
  }

  async syncSubmissions(
    userId: string,
    submissions: Array<{
      platform: string;
      problemId: string;
      problemName: string;
      problemRating?: number;
      tags: string[];
      verdict: string;
      language?: string;
      submittedAt: Date;
    }>
  ) {
    for (const s of submissions) {
      await prisma.submission.upsert({
        where: {
          userId_platform_problemId_submittedAt: {
            userId,
            platform: s.platform,
            problemId: s.problemId,
            submittedAt: s.submittedAt,
          },
        },
        create: { userId, ...s },
        update: s,
      });
    }
  }

  async syncTopicStats(userId: string, topics: TopicAnalysis[]) {
    for (const t of topics) {
      await prisma.topicStats.upsert({
        where: { userId_topic: { userId, topic: t.topic } },
        create: {
          userId,
          topic: t.topic,
          strengthScore: t.strengthScore,
          weaknessScore: t.weaknessScore,
          acceptanceRate: t.acceptanceRate,
          problemsSolved: t.problemsSolved,
          problemsAttempted: t.problemsAttempted,
          trend: t.trend,
        },
        update: {
          strengthScore: t.strengthScore,
          weaknessScore: t.weaknessScore,
          acceptanceRate: t.acceptanceRate,
          problemsSolved: t.problemsSolved,
          problemsAttempted: t.problemsAttempted,
          trend: t.trend,
        },
      });
    }
  }

  async getTopicStats(userId: string) {
    return prisma.topicStats.findMany({ where: { userId } });
  }

  async getContestHistory(userId: string) {
    return prisma.contestHistory.findMany({
      where: { userId },
      orderBy: { contestDate: "desc" },
    });
  }

  async getSubmissions(userId: string, limit = 100) {
    return prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take: limit,
    });
  }

  async saveAnalyticsSnapshot(
    userId: string,
    analytics: ProfileAnalytics,
    advanced: {
      learningVelocity: number;
      contestConsistency: number;
      topicDistribution: unknown;
      activityHeatmap: unknown;
      ratingForecast: unknown;
      masteryCurves: unknown;
    }
  ) {
    return prisma.analyticsSnapshot.create({
      data: {
        userId,
        learningVelocity: advanced.learningVelocity,
        contestConsistency: advanced.contestConsistency,
        topicDistribution: advanced.topicDistribution as object,
        activityHeatmap: advanced.activityHeatmap as object,
        ratingForecast: advanced.ratingForecast as object,
        masteryCurves: advanced.masteryCurves as object,
      },
    });
  }

  async getLatestSnapshot(userId: string) {
    return prisma.analyticsSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const profileRepository = new ProfileRepository();
