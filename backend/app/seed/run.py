import asyncio
import uuid

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import ProblemCatalog, User


PROBLEMS = [
    ("leetcode", "two-sum", "Two Sum", "easy", ["Implementation"], 800, "https://leetcode.com/problems/two-sum"),
    ("leetcode", "climbing-stairs", "Climbing Stairs", "easy", ["DP"], 900, "https://leetcode.com/problems/climbing-stairs"),
    ("leetcode", "coin-change", "Coin Change", "medium", ["DP"], 1400, "https://leetcode.com/problems/coin-change"),
    ("leetcode", "number-of-islands", "Number of Islands", "medium", ["Graphs"], 1400, "https://leetcode.com/problems/number-of-islands"),
    ("leetcode", "course-schedule", "Course Schedule", "medium", ["Graphs"], 1500, "https://leetcode.com/problems/course-schedule"),
    ("leetcode", "binary-tree-max-path-sum", "Binary Tree Maximum Path Sum", "hard", ["Trees"], 1800, "https://leetcode.com/problems/binary-tree-max-path-sum"),
    ("leetcode", "word-break", "Word Break", "medium", ["DP"], 1500, "https://leetcode.com/problems/word-break"),
    ("leetcode", "search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "medium", ["Binary Search"], 1400, "https://leetcode.com/problems/search-in-rotated-sorted-array"),
    ("leetcode", "minimum-window-substring", "Minimum Window Substring", "hard", ["Strings"], 1900, "https://leetcode.com/problems/minimum-window-substring"),
    ("leetcode", "jump-game", "Jump Game", "medium", ["Greedy"], 1300, "https://leetcode.com/problems/jump-game"),
    ("codeforces", "4A", "Watermelon", "easy", ["Math"], 800, "https://codeforces.com/problemset/problem/4/A"),
    ("codeforces", "977F", "Consecutive Subsequence", "hard", ["DP"], 2000, "https://codeforces.com/problemset/problem/977/F"),
    ("codeforces", "580C", "Kefa and Park", "medium", ["Trees", "Graphs"], 1500, "https://codeforces.com/problemset/problem/580/C"),
    ("codeforces", "466C", "Number of Ways", "medium", ["DP"], 1600, "https://codeforces.com/problemset/problem/466/C"),
    ("codeforces", "919D", "Substring", "medium", ["Graphs"], 1700, "https://codeforces.com/problemset/problem/919/D"),
    ("leetcode", "longest-increasing-subsequence", "Longest Increasing Subsequence", "medium", ["DP", "Binary Search"], 1500, "https://leetcode.com/problems/longest-increasing-subsequence"),
    ("leetcode", "implement-trie-prefix-tree", "Implement Trie", "medium", ["Trees", "Strings"], 1400, "https://leetcode.com/problems/implement-trie-prefix-tree"),
    ("leetcode", "subarray-sum-equals-k", "Subarray Sum Equals K", "medium", ["Implementation"], 1400, "https://leetcode.com/problems/subarray-sum-equals-k"),
    ("leetcode", "merge-k-sorted-lists", "Merge k Sorted Lists", "hard", ["Greedy"], 1800, "https://leetcode.com/problems/merge-k-sorted-lists"),
    ("leetcode", "trapping-rain-water", "Trapping Rain Water", "hard", ["Greedy", "Binary Search"], 1700, "https://leetcode.com/problems/trapping-rain-water"),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "demo@algomentor.ai"))
        if result.scalar_one_or_none() is None:
            demo_user = User(
                id=uuid.uuid4(),
                email="demo@algomentor.ai",
                username="demo",
                hashed_password=hash_password("Demo1234!"),
                full_name="Demo User",
                is_active=True,
            )
            db.add(demo_user)
            print("Created demo user: demo@algomentor.ai / Demo1234!")

        result = await db.execute(select(ProblemCatalog))
        existing = list(result.scalars().all())
        if not existing:
            for p in PROBLEMS:
                db.add(
                    ProblemCatalog(
                        id=uuid.uuid4(),
                        platform=p[0],
                        slug=p[1],
                        title=p[2],
                        difficulty=p[3],
                        topics=p[4],
                        rating=p[5],
                        url=p[6],
                    )
                )
            print(f"Seeded {len(PROBLEMS)} problems into catalog")

        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
