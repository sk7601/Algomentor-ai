import { format, subDays, startOfDay } from "date-fns";
import { TOPICS } from "@/types";
import type {
  AdvancedAnalytics,
  CodeforcesContest,
  CodeforcesSubmission,
  ContestPrediction,
  DashboardData,
  InterviewReadiness,
  LeetCodeProfile,
  ProfileAnalytics,
  TopicAnalysis,
} from "@/types";
import type { CodeforcesUser } from "@/types";

const TOPIC_ALIASES: Record<string, string> = {
  dp: "Dynamic Programming",
  "dynamic programming": "Dynamic Programming",
  graphs: "Graphs",
  graph: "Graphs",
  trees: "Trees",
  tree: "Trees",
  greedy: "Greedy",
  "binary search": "Binary Search",
  math: "Math",
  strings: "Strings",
  string: "Strings",
  implementation: "Implementation",
  "number theory": "Number Theory",
  "data structures": "Data Structures",
  "bit manipulation": "Bit Manipulation",
  "constructive algorithms": "Constructive Algorithms",
  "constructive": "Constructive Algorithms",
  dfs: "Graphs",
  bfs: "Graphs",
  "dsu": "Data Structures",
  "segment tree": "Data Structures",
};

function normalizeTopic(tag: string): string {
  const lower = tag.toLowerCase();
  return TOPIC_ALIASES[lower] || tag;
}

export class AnalyticsService {
  buildProfileAnalytics(
    cfUser: CodeforcesUser | null,
    contests: CodeforcesContest[],
    submissions: CodeforcesSubmission[],
    lcProfile: LeetCodeProfile | null
  ): ProfileAnalytics {
    const accepted = submissions.filter((s) => s.verdict === "OK");
    const totalAttempts = submissions.length;
    const accuracy = totalAttempts > 0 ? accepted.length / totalAttempts : 0;

    const ratingHistory = contests.map((c) => ({
      date: format(new Date(c.ratingUpdateTimeSeconds * 1000), "yyyy-MM-dd"),
      rating: c.newRating,
    }));

    const activityMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      activityMap.set(d, 0);
    }
    for (const s of submissions) {
      const d = format(new Date(s.creationTimeSeconds * 1000), "yyyy-MM-dd");
      if (activityMap.has(d)) {
        activityMap.set(d, (activityMap.get(d) ?? 0) + 1);
      }
    }

    const activityTrend = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse();

    const cfSolved = new Set(accepted.map((s) => s.problemName)).size;
    const lcSolved = lcProfile?.totalSolved ?? 0;

    return {
      currentRating: cfUser?.rating ?? 0,
      peakRating: cfUser?.maxRating ?? cfUser?.rating ?? 0,
      contestsParticipated: contests.length,
      problemsSolved: cfSolved + lcSolved,
      accuracy,
      activityTrend,
      ratingHistory,
    };
  }

  analyzeTopics(submissions: CodeforcesSubmission[]): TopicAnalysis[] {
    const topicMap = new Map<string, { solved: number; attempted: number }>();

    for (const topic of TOPICS) {
      topicMap.set(topic, { solved: 0, attempted: 0 });
    }

    for (const sub of submissions) {
      for (const tag of sub.tags) {
        const topic = normalizeTopic(tag);
        if (!topicMap.has(topic)) continue;
        const entry = topicMap.get(topic)!;
        entry.attempted++;
        if (sub.verdict === "OK") entry.solved++;
      }
    }

    return TOPICS.map((topic) => {
      const { solved, attempted } = topicMap.get(topic) ?? { solved: 0, attempted: 0 };
      const acceptanceRate = attempted > 0 ? solved / attempted : 0;
      const strengthScore = Math.min(100, solved * 8 + acceptanceRate * 20);
      const weaknessScore = Math.max(0, 100 - strengthScore);
      const trend = acceptanceRate > 0.5 ? 5 : acceptanceRate > 0.3 ? 0 : -5;

      return {
        topic,
        strengthScore,
        weaknessScore,
        acceptanceRate,
        problemsSolved: solved,
        problemsAttempted: attempted,
        trend,
      };
    });
  }

  getWeakTopics(topics: TopicAnalysis[], threshold = 40): string[] {
    return topics
      .filter((t) => t.strengthScore < threshold)
      .sort((a, b) => a.strengthScore - b.strengthScore)
      .slice(0, 5)
      .map((t) => t.topic);
  }

  buildDashboardData(
    analytics: ProfileAnalytics,
    topics: TopicAnalysis[],
    submissions: CodeforcesSubmission[]
  ): DashboardData {
    const recentActivity = submissions.slice(0, 10).map((s) => ({
      id: String(s.id),
      type: s.verdict === "OK" ? "solved" : "attempt",
      title: s.problemName,
      description: `${s.verdict} · ${s.programmingLanguage}`,
      timestamp: new Date(s.creationTimeSeconds * 1000).toISOString(),
    }));

    const weakTopics = this.getWeakTopics(topics);
    const insights: string[] = [];

    if (analytics.accuracy < 0.4) {
      insights.push("Focus on accuracy — review failed submissions before attempting new problems.");
    }
    if (weakTopics.length > 0) {
      insights.push(`Strengthen weak areas: ${weakTopics.slice(0, 3).join(", ")}.`);
    }
    if (analytics.contestsParticipated < 5) {
      insights.push("Increase contest participation to accelerate rating growth.");
    }
    if (analytics.activityTrend.slice(-7).every((d) => d.count === 0)) {
      insights.push("No recent activity detected — maintain daily practice for consistency.");
    }
    if (insights.length === 0) {
      insights.push("Great progress! Keep maintaining your current study rhythm.");
    }

    return { analytics, topics, recentActivity, insights };
  }

  predictRatings(
    analytics: ProfileAnalytics,
    topics: TopicAnalysis[],
    contests: CodeforcesContest[]
  ): ContestPrediction {
    const current = analytics.currentRating || 1200;
    const recentChanges = contests.slice(-5).map((c) => c.newRating - c.oldRating);
    const avgChange = recentChanges.length
      ? recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length
      : 15;

    const contestFreq = contests.length / Math.max(1, 6);
    const topicStrength =
      topics.reduce((sum, t) => sum + t.strengthScore, 0) / topics.length;
    const velocity = analytics.problemsSolved / Math.max(1, 30);

    const boost = Math.min(50, contestFreq * 10 + velocity * 2 + topicStrength * 0.1);
    const nextContestRating = Math.round(current + avgChange * 0.8);
    const threeMonthRating = Math.round(current + boost * 1.5);
    const sixMonthRating = Math.round(current + boost * 3);

    const history = [];
    const now = new Date();
    for (let i = -3; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const predicted = i > 0;
      const rating = predicted
        ? Math.round(current + (boost * i) / 2)
        : analytics.ratingHistory[analytics.ratingHistory.length + i - 1]?.rating ?? current;
      history.push({
        month: format(date, "MMM yyyy"),
        rating,
        predicted,
      });
    }

    return {
      nextContestRating,
      threeMonthRating,
      sixMonthRating,
      confidence: Math.min(0.95, 0.6 + contestFreq * 0.05 + velocity * 0.02),
      history,
      factors: {
        contestFrequency: contestFreq,
        topicStrength,
        problemVelocity: velocity,
        avgRatingChange: avgChange,
      },
    };
  }

  computeInterviewReadiness(
    analytics: ProfileAnalytics,
    topics: TopicAnalysis[]
  ): InterviewReadiness[] {
    const companyRequirements: Record<string, { minRating: number; topics: string[] }> = {
      Amazon: { minRating: 1400, topics: ["Dynamic Programming", "Trees", "Graphs", "Greedy"] },
      Google: { minRating: 1800, topics: ["Dynamic Programming", "Graphs", "Binary Search", "Math"] },
      Microsoft: { minRating: 1500, topics: ["Dynamic Programming", "Trees", "Strings", "Greedy"] },
      Atlassian: { minRating: 1300, topics: ["Data Structures", "Strings", "Greedy", "Implementation"] },
      Uber: { minRating: 1600, topics: ["Graphs", "Dynamic Programming", "Greedy", "Binary Search"] },
    };

    return Object.entries(companyRequirements).map(([company, req]) => {
      const ratingScore = Math.min(100, (analytics.currentRating / req.minRating) * 70);
      const solvedScore = Math.min(30, analytics.problemsSolved / 5);
      const topicCoverage = req.topics.filter((t) => {
        const stat = topics.find((ts) => ts.topic === t);
        return stat && stat.strengthScore >= 50;
      });
      const topicScore = (topicCoverage.length / req.topics.length) * 30;
      const score = Math.round(ratingScore * 0.5 + solvedScore + topicScore);

      const missingTopics = req.topics.filter((t) => {
        const stat = topics.find((ts) => ts.topic === t);
        return !stat || stat.strengthScore < 50;
      });

      const suggestions: string[] = [];
      if (analytics.currentRating < req.minRating) {
        suggestions.push(`Reach ${req.minRating} rating (currently ${analytics.currentRating})`);
      }
      if (missingTopics.length > 0) {
        suggestions.push(`Practice: ${missingTopics.join(", ")}`);
      }
      if (analytics.contestsParticipated < 10) {
        suggestions.push("Participate in more contests for interview stamina");
      }

      return { company, score: Math.min(100, score), missingTopics, suggestions };
    });
  }

  buildAdvancedAnalytics(
    analytics: ProfileAnalytics,
    topics: TopicAnalysis[],
    submissions: CodeforcesSubmission[],
    contests: CodeforcesContest[]
  ): AdvancedAnalytics {
    const learningVelocity = analytics.problemsSolved / Math.max(1, 4);
    const contestConsistency =
      contests.length > 0
        ? Math.min(100, (contests.length / 12) * 100)
        : 0;

    const topicDistribution = topics.map((t) => ({
      topic: t.topic,
      value: t.problemsSolved,
    }));

    const activityHeatmap: Array<{ day: string; hour: number; value: number }> = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const day of days) {
      for (let hour = 0; hour < 24; hour += 3) {
        activityHeatmap.push({ day, hour, value: Math.floor(Math.random() * 5) });
      }
    }
    for (const sub of submissions.slice(0, 100)) {
      const d = new Date(sub.creationTimeSeconds * 1000);
      const day = days[d.getDay()];
      const hour = Math.floor(d.getHours() / 3) * 3;
      const entry = activityHeatmap.find((h) => h.day === day && h.hour === hour);
      if (entry) entry.value++;
    }

    const ratingForecast = analytics.ratingHistory.slice(-6).map((r, i) => ({
      date: r.date,
      rating: r.rating + i * 10,
    }));

    const masteryCurves = topics.slice(0, 6).map((t) => ({
      topic: t.topic,
      data: Array.from({ length: 8 }, (_, week) => ({
        week: week + 1,
        score: Math.min(100, t.strengthScore * (week + 1) / 8),
      })),
    }));

    return {
      learningVelocity,
      contestConsistency,
      topicDistribution,
      activityHeatmap,
      ratingForecast,
      masteryCurves,
    };
  }
}

export const analyticsService = new AnalyticsService();
