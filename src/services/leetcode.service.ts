import { getCached, setCached } from "@/lib/redis";
import type { LeetCodeProfile, LeetCodeSubmission } from "@/types";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

async function leetcodeQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "LeetCode API error");
  }
  return json.data as T;
}

const USER_PROFILE_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking reputation }
      submitStats {
        acSubmissionNum { difficulty count submissions }
        totalSubmissionNum { difficulty count submissions }
      }
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

export class LeetCodeService {
  async getProfile(username: string): Promise<LeetCodeProfile> {
    const cacheKey = `lc:profile:${username}`;
    const cached = await getCached<LeetCodeProfile>(cacheKey);
    if (cached) return cached;

    const data = await leetcodeQuery<{
      matchedUser: {
        username: string;
        profile: { ranking: number; reputation: number };
        submitStats: {
          acSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }>;
          totalSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }>;
        };
      } | null;
    }>(USER_PROFILE_QUERY, { username });

    if (!data.matchedUser) {
      throw new Error(`LeetCode user "${username}" not found`);
    }

    const ac = data.matchedUser.submitStats.acSubmissionNum;
    const easy = ac.find((s) => s.difficulty === "Easy")?.count ?? 0;
    const medium = ac.find((s) => s.difficulty === "Medium")?.count ?? 0;
    const hard = ac.find((s) => s.difficulty === "Hard")?.count ?? 0;

    const result: LeetCodeProfile = {
      username: data.matchedUser.username,
      totalSolved: easy + medium + hard,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
      ranking: data.matchedUser.profile?.ranking ?? 0,
      submissionStats: data.matchedUser.submitStats.totalSubmissionNum,
    };

    await setCached(cacheKey, result);
    return result;
  }

  async getRecentSubmissions(username: string, limit = 50): Promise<LeetCodeSubmission[]> {
    const cacheKey = `lc:submissions:${username}:${limit}`;
    const cached = await getCached<LeetCodeSubmission[]>(cacheKey);
    if (cached) return cached;

    const data = await leetcodeQuery<{
      recentAcSubmissionList: LeetCodeSubmission[];
    }>(RECENT_SUBMISSIONS_QUERY, { username, limit });

    const result = data.recentAcSubmissionList ?? [];
    await setCached(cacheKey, result);
    return result;
  }
}

export const leetcodeService = new LeetCodeService();
