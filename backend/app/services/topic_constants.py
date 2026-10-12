TOPICS = [
    "DP",
    "Graphs",
    "Trees",
    "Greedy",
    "Binary Search",
    "Math",
    "Strings",
    "Implementation",
]

TOPIC_ALIASES: dict[str, str] = {
    "dynamic programming": "DP",
    "dynamic-programming": "DP",
    "dp": "DP",
    "graph": "Graphs",
    "graphs": "Graphs",
    "tree": "Trees",
    "trees": "Trees",
    "binary tree": "Trees",
    "greedy": "Greedy",
    "binary search": "Binary Search",
    "binary-search": "Binary Search",
    "math": "Math",
    "mathematics": "Math",
    "number theory": "Math",
    "string": "Strings",
    "strings": "Strings",
    "implementation": "Implementation",
    "simulation": "Implementation",
    "array": "Implementation",
    "hash table": "Implementation",
    "two pointers": "Implementation",
    "stack": "Implementation",
    "queue": "Implementation",
    "heap": "Greedy",
    "sorting": "Implementation",
    "backtracking": "DP",
    "dfs": "Graphs",
    "bfs": "Graphs",
    "union find": "Graphs",
    "disjoint set": "Graphs",
    "shortest path": "Graphs",
    "topological sort": "Graphs",
    "segment tree": "Trees",
    "trie": "Trees",
}

DIFFICULTY_WEIGHTS = {"easy": 1.0, "medium": 2.0, "hard": 3.5}


def normalize_topic(raw: str) -> str | None:
    key = raw.strip().lower()
    if key in TOPIC_ALIASES:
        return TOPIC_ALIASES[key]
    for topic in TOPICS:
        if topic.lower() == key:
            return topic
    return None


def normalize_topics(raw_topics: list[str]) -> list[str]:
    normalized: set[str] = set()
    for raw in raw_topics:
        topic = normalize_topic(raw)
        if topic:
            normalized.add(topic)
    if not normalized:
        normalized.add("Implementation")
    return sorted(normalized)
