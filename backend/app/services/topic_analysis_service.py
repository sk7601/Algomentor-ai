from app.services.topic_constants import DIFFICULTY_WEIGHTS, TOPICS, normalize_topics


class TopicAnalysisService:
    def compute_scores(self, submissions: list[dict]) -> list[dict]:
        stats: dict[str, dict] = {
            topic: {"solved": 0, "attempted": 0, "weighted": 0.0} for topic in TOPICS
        }

        for sub in submissions:
            topics = normalize_topics(sub.get("topics", []))
            difficulty = sub.get("difficulty", "medium").lower()
            weight = DIFFICULTY_WEIGHTS.get(difficulty, 2.0)
            accepted = sub.get("verdict", "").lower() in {"accepted", "ok"}

            for topic in topics:
                stats[topic]["attempted"] += 1
                if accepted:
                    stats[topic]["solved"] += 1
                    stats[topic]["weighted"] += weight

        max_weighted = max((s["weighted"] for s in stats.values()), default=1.0) or 1.0
        results = []
        for topic in TOPICS:
            s = stats[topic]
            strength = min(100.0, (s["weighted"] / max_weighted) * 100)
            attempt_ratio = s["attempted"] / max(len(submissions), 1)
            solve_ratio = s["solved"] / max(s["attempted"], 1) if s["attempted"] else 0
            weakness = max(0.0, 100.0 - strength) * (1.0 - attempt_ratio * 0.3) + (1 - solve_ratio) * 20
            weakness = min(100.0, weakness)
            results.append(
                {
                    "topic": topic,
                    "strength_score": round(strength, 2),
                    "weakness_score": round(weakness, 2),
                    "problems_solved": s["solved"],
                    "problems_attempted": s["attempted"],
                }
            )
        return results

    def get_weak_topics(self, topic_scores: list[dict], limit: int = 3) -> list[str]:
        sorted_topics = sorted(topic_scores, key=lambda x: x["weakness_score"], reverse=True)
        return [t["topic"] for t in sorted_topics[:limit] if t["weakness_score"] > 30]
