import { getCached, setCached } from "@/lib/redis";
import { sleep } from "@/lib/utils";
import type {
  CodeforcesContest,
  CodeforcesSubmission,
  CodeforcesUser,
} from "@/types";

const BASE_URL = "https://codeforces.com/api";

async function fetchWithRetry<T>(
  url: string,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const data = await res.json();
      if (data.status === "OK") return data.result as T;
      if (data.comment?.includes("Call limit")) {
        await sleep(2000 * (i + 1));
        continue;
      }
      throw new Error(data.comment || "Codeforces API error");
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error("Failed to fetch from Codeforces");
}

export class CodeforcesService {
  async getUserInfo(handle: string): Promise<CodeforcesUser> {
    const cacheKey = `cf:user:${handle}`;
    const cached = await getCached<CodeforcesUser>(cacheKey);
    if (cached) return cached;

    const users = await fetchWithRetry<Array<{
      handle: string;
      rating?: number;
      maxRating?: number;
      rank?: string;
      contribution?: number;
    }>>(`${BASE_URL}/user.info?handles=${handle}`);

    const user = users[0];
    if (!user) throw new Error(`Codeforces user "${handle}" not found`);

    const result: CodeforcesUser = {
      handle: user.handle,
      rating: user.rating ?? 0,
      maxRating: user.maxRating ?? user.rating ?? 0,
      rank: user.rank ?? "unrated",
      contribution: user.contribution ?? 0,
    };

    await setCached(cacheKey, result);
    return result;
  }

  async getContestHistory(handle: string): Promise<CodeforcesContest[]> {
    const cacheKey = `cf:contests:${handle}`;
    const cached = await getCached<CodeforcesContest[]>(cacheKey);
    if (cached) return cached;

    const ratingHistory = await fetchWithRetry<Array<{
      contestId: number;
      contestName: string;
      rank: number;
      ratingUpdateTimeSeconds: number;
      oldRating: number;
      newRating: number;
      problemsSolved?: number;
    }>>(`${BASE_URL}/user.rating?handle=${handle}`);

    const result: CodeforcesContest[] = ratingHistory.map((c) => ({
      contestId: c.contestId,
      contestName: c.contestName,
      rank: c.rank,
      ratingUpdateTimeSeconds: c.ratingUpdateTimeSeconds,
      oldRating: c.oldRating,
      newRating: c.newRating,
      problemsSolved: c.problemsSolved ?? 0,
    }));

    await setCached(cacheKey, result);
    return result;
  }

  async getSubmissions(handle: string, count = 500): Promise<CodeforcesSubmission[]> {
    const cacheKey = `cf:submissions:${handle}:${count}`;
    const cached = await getCached<CodeforcesSubmission[]>(cacheKey);
    if (cached) return cached;

    const submissions = await fetchWithRetry<Array<{
      id: number;
      problem: { name: string; rating?: number; tags?: string[] };
      verdict: string;
      programmingLanguage: string;
      creationTimeSeconds: number;
    }>>(`${BASE_URL}/user.status?handle=${handle}&from=1&count=${count}`);

    const result: CodeforcesSubmission[] = submissions.map((s) => ({
      id: s.id,
      problemName: s.problem.name,
      problemRating: s.problem.rating ?? 0,
      tags: s.problem.tags ?? [],
      verdict: s.verdict,
      programmingLanguage: s.programmingLanguage,
      creationTimeSeconds: s.creationTimeSeconds,
    }));

    await setCached(cacheKey, result);
    return result;
  }
}

export const codeforcesService = new CodeforcesService();
