from datetime import UTC, datetime, timedelta

import httpx

from app.services.topic_constants import normalize_topics


class CodeforcesClient:
    BASE_URL = "https://codeforces.com/api"

    async def fetch_profile(self, handle: str) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            info_resp = await client.get(f"{self.BASE_URL}/user.info", params={"handles": handle})
            info_resp.raise_for_status()
            info_data = info_resp.json()
            if info_data.get("status") != "OK" or not info_data.get("result"):
                raise ValueError(f"Codeforces handle '{handle}' not found")

            user = info_data["result"][0]

            rating_resp = await client.get(f"{self.BASE_URL}/user.rating", params={"handle": handle})
            rating_resp.raise_for_status()
            rating_data = rating_resp.json()
            rating_history = rating_data.get("result", []) if rating_data.get("status") == "OK" else []

            status_resp = await client.get(f"{self.BASE_URL}/user.status", params={"handle": handle})
            status_resp.raise_for_status()
            status_data = status_resp.json()
            submissions = status_data.get("result", []) if status_data.get("status") == "OK" else []

        return {
            "handle": handle,
            "rating": user.get("rating"),
            "max_rating": user.get("maxRating"),
            "rank": user.get("rank"),
            "rating_history": rating_history,
            "submissions": submissions[:500],
        }

    def parse_submissions(self, raw_submissions: list[dict]) -> list[dict]:
        solved: dict[str, dict] = {}
        for sub in raw_submissions:
            if sub.get("verdict") != "OK":
                continue
            problem = sub.get("problem", {})
            key = f"{problem.get('contestId', '')}-{problem.get('index', problem.get('name', ''))}"
            if key in solved:
                continue
            tags = normalize_topics(problem.get("tags", []))
            rating = problem.get("rating")
            difficulty = "easy" if rating and rating < 1200 else "medium" if rating and rating < 1800 else "hard"
            solved[key] = {
                "platform": "codeforces",
                "problem_slug": key,
                "problem_title": problem.get("name", key),
                "difficulty": difficulty,
                "topics": tags,
                "verdict": "Accepted",
                "submitted_at": datetime.fromtimestamp(sub.get("creationTimeSeconds", 0), tz=UTC),
            }
        return list(solved.values())

    def parse_rating_history(self, raw_history: list[dict]) -> list[dict]:
        entries = []
        for item in raw_history:
            entries.append(
                {
                    "platform": "codeforces",
                    "rating": item.get("newRating", 0),
                    "contest_name": item.get("contestName"),
                    "recorded_at": datetime.fromtimestamp(item.get("ratingUpdateTimeSeconds", 0), tz=UTC),
                }
            )
        return entries


class LeetCodeClient:
    GRAPHQL_URL = "https://leetcode.com/graphql"
    STATS_URL = "https://leetcode-stats-api.herokuapp.com/{username}"

    async def fetch_profile(self, username: str) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            stats_resp = await client.get(self.STATS_URL.format(username=username))
            if stats_resp.status_code == 404:
                raise ValueError(f"LeetCode username '{username}' not found")
            stats_resp.raise_for_status()
            stats = stats_resp.json()

            query = """
            query userProfile($username: String!) {
              matchedUser(username: $username) {
                submitStatsGlobal {
                  acSubmissionNum { difficulty count }
                }
                profile { ranking reputation }
              }
              userContestRanking(username: $username) {
                rating
                globalRanking
              }
            }
            """
            gql_resp = await client.post(
                self.GRAPHQL_URL,
                json={"query": query, "variables": {"username": username}},
            )
            gql_data = gql_resp.json() if gql_resp.status_code == 200 else {}

        matched = (gql_data.get("data") or {}).get("matchedUser") or {}
        contest = (gql_data.get("data") or {}).get("userContestRanking") or {}

        return {
            "username": username,
            "stats": stats,
            "matched_user": matched,
            "contest_ranking": contest,
        }

    def parse_profile_stats(self, profile_data: dict) -> dict:
        stats = profile_data.get("stats", {})
        matched = profile_data.get("matched_user", {})
        contest = profile_data.get("contest_ranking", {})

        ac_nums = matched.get("submitStatsGlobal", {}).get("acSubmissionNum", [])
        easy = next((x["count"] for x in ac_nums if x["difficulty"] == "Easy"), stats.get("easySolved", 0))
        medium = next((x["count"] for x in ac_nums if x["difficulty"] == "Medium"), stats.get("mediumSolved", 0))
        hard = next((x["count"] for x in ac_nums if x["difficulty"] == "Hard"), stats.get("hardSolved", 0))

        return {
            "leetcode_rating": int(contest.get("rating") or stats.get("contestRating") or 1500),
            "easy_solved": easy,
            "medium_solved": medium,
            "hard_solved": hard,
            "total_solved": easy + medium + hard,
            "ranking": matched.get("profile", {}).get("ranking"),
        }

    def parse_submissions_from_stats(self, profile_data: dict) -> list[dict]:
        stats = profile_data.get("stats", {})
        submissions = []
        for item in stats.get("recentSubmissions", []) or []:
            title = item.get("title", "Unknown")
            slug = title.lower().replace(" ", "-")
            difficulty = (item.get("titleSlug") and "medium") or "medium"
            submissions.append(
                {
                    "platform": "leetcode",
                    "problem_slug": slug,
                    "problem_title": title,
                    "difficulty": difficulty,
                    "topics": normalize_topics([item.get("topicTags", "")] if item.get("topicTags") else []),
                    "verdict": "Accepted" if item.get("statusDisplay") == "Accepted" else item.get("statusDisplay", ""),
                    "submitted_at": datetime.now(tz=UTC) - timedelta(days=len(submissions)),
                }
            )
        return submissions

    def build_synthetic_rating_history(self, rating: int) -> list[dict]:
        now = datetime.now(tz=UTC)
        return [
            {
                "platform": "leetcode",
                "rating": max(800, rating - 200 + i * 40),
                "contest_name": f"Weekly Contest {i + 1}",
                "recorded_at": now - timedelta(weeks=10 - i),
            }
            for i in range(6)
        ] + [
            {
                "platform": "leetcode",
                "rating": rating,
                "contest_name": "Latest Contest",
                "recorded_at": now,
            }
        ]
