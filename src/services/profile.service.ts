import { codeforcesService } from "@/services/codeforces.service";
import { leetcodeService } from "@/services/leetcode.service";
import { analyticsService } from "@/services/analytics.service";
import { profileRepository } from "@/services/profile.repository";
import type { ProfileAnalytics, TopicAnalysis } from "@/types";

export class ProfileService {
  async syncProfile(
    userId: string,
    codeforcesHandle?: string | null,
    leetcodeUsername?: string | null
  ) {
    let cfUser = null;
    let contests: Awaited<ReturnType<typeof codeforcesService.getContestHistory>> = [];
    let submissions: Awaited<ReturnType<typeof codeforcesService.getSubmissions>> = [];
    let lcProfile = null;

    if (codeforcesHandle) {
      cfUser = await codeforcesService.getUserInfo(codeforcesHandle);
      contests = await codeforcesService.getContestHistory(codeforcesHandle);
      submissions = await codeforcesService.getSubmissions(codeforcesHandle);
    }

    if (leetcodeUsername) {
      lcProfile = await leetcodeService.getProfile(leetcodeUsername);
      const lcSubs = await leetcodeService.getRecentSubmissions(leetcodeUsername);
      for (const sub of lcSubs) {
        submissions.push({
          id: Date.now() + Math.random(),
          problemName: sub.title,
          problemRating: 0,
          tags: [],
          verdict: "OK",
          programmingLanguage: sub.lang,
          creationTimeSeconds: parseInt(sub.timestamp, 10),
        });
      }
    }

    const analytics = analyticsService.buildProfileAnalytics(
      cfUser,
      contests,
      submissions,
      lcProfile
    );

    const topics = analyticsService.analyzeTopics(submissions);

    await profileRepository.upsert(userId, {
      codeforcesHandle: codeforcesHandle ?? undefined,
      leetcodeUsername: leetcodeUsername ?? undefined,
      currentRating: analytics.currentRating,
      peakRating: analytics.peakRating,
      contestsParticipated: analytics.contestsParticipated,
      problemsSolved: analytics.problemsSolved,
      accuracy: analytics.accuracy,
    });

    if (contests.length > 0) {
      await profileRepository.syncContestHistory(
        userId,
        contests.map((c) => ({
          platform: "codeforces",
          contestId: String(c.contestId),
          contestName: c.contestName,
          rank: c.rank,
          ratingBefore: c.oldRating,
          ratingAfter: c.newRating,
          ratingChange: c.newRating - c.oldRating,
          problemsSolved: c.problemsSolved,
          contestDate: new Date(c.ratingUpdateTimeSeconds * 1000),
        }))
      );
    }

    if (submissions.length > 0) {
      await profileRepository.syncSubmissions(
        userId,
        submissions.map((s) => ({
          platform: "codeforces",
          problemId: String(s.id),
          problemName: s.problemName,
          problemRating: s.problemRating,
          tags: s.tags,
          verdict: s.verdict,
          language: s.programmingLanguage,
          submittedAt: new Date(s.creationTimeSeconds * 1000),
        }))
      );
    }

    await profileRepository.syncTopicStats(userId, topics);

    const advanced = analyticsService.buildAdvancedAnalytics(
      analytics,
      topics,
      submissions,
      contests
    );
    await profileRepository.saveAnalyticsSnapshot(userId, analytics, advanced);

    return { analytics, topics };
  }

  async getDashboardData(userId: string) {
    const profile = await profileRepository.getByUserId(userId);
    const topicStats = await profileRepository.getTopicStats(userId);
    const submissions = await profileRepository.getSubmissions(userId);
    const contests = await profileRepository.getContestHistory(userId);

    const topics: TopicAnalysis[] = topicStats.map((t) => ({
      topic: t.topic,
      strengthScore: t.strengthScore,
      weaknessScore: t.weaknessScore,
      acceptanceRate: t.acceptanceRate,
      problemsSolved: t.problemsSolved,
      problemsAttempted: t.problemsAttempted,
      trend: t.trend,
    }));

    const analytics: ProfileAnalytics = {
      currentRating: profile?.currentRating ?? 0,
      peakRating: profile?.peakRating ?? 0,
      contestsParticipated: profile?.contestsParticipated ?? 0,
      problemsSolved: profile?.problemsSolved ?? 0,
      accuracy: profile?.accuracy ?? 0,
      activityTrend: [],
      ratingHistory: contests
        .slice()
        .reverse()
        .map((c) => ({
          date: c.contestDate.toISOString().split("T")[0],
          rating: c.ratingAfter ?? 0,
        })),
    };

    const cfSubmissions = submissions.map((s) => ({
      id: parseInt(s.problemId, 10) || 0,
      problemName: s.problemName,
      problemRating: s.problemRating ?? 0,
      tags: s.tags,
      verdict: s.verdict,
      programmingLanguage: s.language ?? "",
      creationTimeSeconds: Math.floor(s.submittedAt.getTime() / 1000),
    }));

    return analyticsService.buildDashboardData(analytics, topics, cfSubmissions);
  }
}

export const profileService = new ProfileService();
