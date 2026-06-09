import { getCached, setCached } from "@/lib/redis";
import type { ProblemRecommendation, TopicAnalysis } from "@/types";

const PROBLEM_BANK: Array<{
  name: string;
  platform: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  rating: number;
  url: string;
}> = [
  { name: "Two Sum", platform: "LeetCode", difficulty: "Easy", topic: "Data Structures", rating: 800, url: "https://leetcode.com/problems/two-sum/" },
  { name: "Coin Change", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming", rating: 1400, url: "https://leetcode.com/problems/coin-change/" },
  { name: "Longest Increasing Subsequence", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming", rating: 1500, url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
  { name: "Number of Islands", platform: "LeetCode", difficulty: "Medium", topic: "Graphs", rating: 1300, url: "https://leetcode.com/problems/number-of-islands/" },
  { name: "Word Ladder", platform: "LeetCode", difficulty: "Hard", topic: "Graphs", rating: 1700, url: "https://leetcode.com/problems/word-ladder/" },
  { name: "A - Way Too Long Words", platform: "Codeforces", difficulty: "Easy", topic: "Strings", rating: 800, url: "https://codeforces.com/problemset/problem/71/A" },
  { name: "B - Drinks", platform: "Codeforces", difficulty: "Easy", topic: "Math", rating: 900, url: "https://codeforces.com/problemset/problem/200/B" },
  { name: "C - Array Destruction", platform: "Codeforces", difficulty: "Medium", topic: "Greedy", rating: 1400, url: "https://codeforces.com/problemset/problem/1690/C" },
  { name: "D - Cutting a Tree", platform: "Codeforces", difficulty: "Medium", topic: "Trees", rating: 1600, url: "https://codeforces.com/problemset/problem/792/D" },
  { name: "E - Cubes", platform: "Codeforces", difficulty: "Hard", topic: "Constructive Algorithms", rating: 2000, url: "https://codeforces.com/problemset/problem/128/E" },
  { name: "Binary Search on Answer", platform: "Codeforces", difficulty: "Medium", topic: "Binary Search", rating: 1500, url: "https://codeforces.com/problemset/problem/1201/C" },
  { name: "Segment Tree Basics", platform: "Codeforces", difficulty: "Hard", topic: "Data Structures", rating: 1900, url: "https://codeforces.com/problemset/problem/380/C" },
  { name: "Bitmask DP", platform: "Codeforces", difficulty: "Hard", topic: "Dynamic Programming", rating: 2100, url: "https://codeforces.com/problemset/problem/11/D" },
  { name: "DSU Rollback", platform: "Codeforces", difficulty: "Hard", topic: "Data Structures", rating: 2200, url: "https://codeforces.com/problemset/problem/891/C" },
  { name: "Digit DP", platform: "Codeforces", difficulty: "Hard", topic: "Dynamic Programming", rating: 2000, url: "https://codeforces.com/problemset/problem/628/D" },
];

export class RecommendationService {
  async generate(
    currentRating: number,
    topics: TopicAnalysis[],
    solvedProblems: Set<string>
  ): Promise<{ easy: ProblemRecommendation[]; medium: ProblemRecommendation[]; hard: ProblemRecommendation[] }> {
    const cacheKey = `recs:${currentRating}:${topics.map((t) => t.topic).join(",")}`;
    const cached = await getCached<{ easy: ProblemRecommendation[]; medium: ProblemRecommendation[]; hard: ProblemRecommendation[] }>(cacheKey);
    if (cached) return cached;

    const weakTopics = topics
      .filter((t) => t.strengthScore < 50)
      .map((t) => t.topic);

    const scoreProblem = (p: typeof PROBLEM_BANK[0]) => {
      let score = 0;
      if (weakTopics.includes(p.topic)) score += 30;
      const ratingDiff = Math.abs(p.rating - currentRating);
      score += Math.max(0, 20 - ratingDiff / 50);
      if (solvedProblems.has(p.name)) score -= 100;
      return score;
    };

    const ranked = [...PROBLEM_BANK]
      .filter((p) => !solvedProblems.has(p.name))
      .sort((a, b) => scoreProblem(b) - scoreProblem(a));

    const toRec = (p: typeof PROBLEM_BANK[0]): ProblemRecommendation => ({
      problemName: p.name,
      platform: p.platform,
      difficulty: p.difficulty,
      topic: p.topic,
      rating: p.rating,
      url: p.url,
      reason: weakTopics.includes(p.topic)
        ? `Targets weak topic: ${p.topic}`
        : `Matches your rating range (${currentRating})`,
    });

    const result = {
      easy: ranked.filter((p) => p.difficulty === "Easy").slice(0, 5).map(toRec),
      medium: ranked.filter((p) => p.difficulty === "Medium").slice(0, 5).map(toRec),
      hard: ranked.filter((p) => p.difficulty === "Hard").slice(0, 5).map(toRec),
    };

    await setCached(cacheKey, result);
    return result;
  }
}

export const recommendationService = new RecommendationService();
