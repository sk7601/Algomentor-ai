import { describe, it, expect } from "vitest";
import { AnalyticsService } from "@/services/analytics.service";
import { TOPICS } from "@/types";

const service = new AnalyticsService();

describe("AnalyticsService", () => {
  it("analyzes topics from submissions", () => {
    const submissions = [
      {
        id: 1,
        problemName: "A",
        problemRating: 1200,
        tags: ["dp", "graphs"],
        verdict: "OK",
        programmingLanguage: "C++",
        creationTimeSeconds: Date.now() / 1000,
      },
      {
        id: 2,
        problemName: "B",
        problemRating: 1400,
        tags: ["dp"],
        verdict: "WRONG_ANSWER",
        programmingLanguage: "C++",
        creationTimeSeconds: Date.now() / 1000,
      },
    ];

    const topics = service.analyzeTopics(submissions);
    expect(topics).toHaveLength(TOPICS.length);

    const dp = topics.find((t) => t.topic === "Dynamic Programming");
    expect(dp?.problemsSolved).toBe(1);
    expect(dp?.problemsAttempted).toBe(2);
  });

  it("identifies weak topics", () => {
    const topics = TOPICS.map((topic) => ({
      topic,
      strengthScore: topic === "Math" ? 20 : 80,
      weaknessScore: topic === "Math" ? 80 : 20,
      acceptanceRate: 0.5,
      problemsSolved: 1,
      problemsAttempted: 2,
      trend: 0,
    }));

    const weak = service.getWeakTopics(topics);
    expect(weak).toContain("Math");
  });

  it("predicts ratings", () => {
    const analytics = {
      currentRating: 1500,
      peakRating: 1600,
      contestsParticipated: 10,
      problemsSolved: 100,
      accuracy: 0.6,
      activityTrend: [],
      ratingHistory: [{ date: "2024-01-01", rating: 1400 }, { date: "2024-02-01", rating: 1500 }],
    };

    const topics = TOPICS.map((topic) => ({
      topic,
      strengthScore: 50,
      weaknessScore: 50,
      acceptanceRate: 0.5,
      problemsSolved: 5,
      problemsAttempted: 10,
      trend: 0,
    }));

    const contests = [
      { contestId: 1, contestName: "Div 2", rank: 100, ratingUpdateTimeSeconds: 0, oldRating: 1400, newRating: 1500, problemsSolved: 3 },
    ];

    const prediction = service.predictRatings(analytics, topics, contests);
    expect(prediction.nextContestRating).toBeGreaterThan(0);
    expect(prediction.sixMonthRating).toBeGreaterThanOrEqual(prediction.threeMonthRating);
  });
});
