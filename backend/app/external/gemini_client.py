import json
import re

import google.generativeai as genai

from app.core.config import settings


class GeminiClient:
    def __init__(self) -> None:
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None

    async def generate(self, prompt: str) -> str:
        if self.model is None:
            return self._fallback_response(prompt)
        response = await self.model.generate_content_async(prompt)
        return response.text or self._fallback_response(prompt)

    def _fallback_response(self, prompt: str) -> str:
        if "code review" in prompt.lower() or "analyze this code" in prompt.lower():
            return json.dumps(
                {
                    "time_complexity": "O(n) - linear scan based on input size",
                    "space_complexity": "O(1) - constant extra space",
                    "bugs": ["Verify boundary conditions at index 0 and n-1"],
                    "edge_cases": ["Empty input", "Single element", "All equal elements"],
                    "better_approaches": ["Use hash map for O(n) lookup", "Consider two-pointer technique"],
                    "optimized_solution": "# Optimized approach using hash map\n# See analysis above for details",
                    "overall_score": 72,
                    "summary": "Solid approach with room for optimization. Focus on edge case handling.",
                }
            )
        return json.dumps(
            {
                "explanation": (
                    "This is a competitive programming concept that combines data structure design "
                    "with algorithmic optimization. The key idea is to reduce redundant work by "
                    "maintaining structured state and applying invariant-based reasoning."
                ),
                "complexity": "Typical time: O(n log n) or O(n α(n)); Space: O(n) for auxiliary structures",
                "examples": [
                    "Use rollback DSU when you need to undo union operations between queries",
                    "Apply digit DP when counting numbers with digit constraints in a range",
                ],
                "practice_problems": [
                    "Codeforces 891C - Envy",
                    "CSES 1143 - Hotel Queries",
                    "LeetCode 2338 - Count the Number of Ideal Arrays",
                ],
            }
        )

    async def tutor_response(self, question: str, history: list[dict] | None = None) -> dict:
        history_text = ""
        if history:
            history_text = "\n".join(f"{m['role']}: {m['content']}" for m in history[-6:])

        prompt = f"""You are AlgoMentor AI, an expert competitive programming coach.

Previous conversation:
{history_text}

Student question: {question}

Respond in JSON with keys:
- explanation (detailed but clear)
- complexity (time and space)
- examples (list of 2-3 concrete examples)
- practice_problems (list of 3 problems with platform and name)
"""
        raw = await self.generate(prompt)
        return self._parse_json(raw)

    async def review_code(self, source_code: str, language: str, problem_title: str | None) -> dict:
        prompt = f"""Analyze this competitive programming solution.

Problem: {problem_title or 'Unknown'}
Language: {language}

Code:
```{language}
{source_code}
```

Respond in JSON with keys:
- time_complexity
- space_complexity
- bugs (list)
- edge_cases (list)
- better_approaches (list)
- optimized_solution (code string)
- overall_score (0-100 integer)
- summary
"""
        raw = await self.generate(prompt)
        return self._parse_json(raw)

    def _parse_json(self, raw: str) -> dict:
        try:
            match = re.search(r"\{[\s\S]*\}", raw)
            if match:
                return json.loads(match.group())
        except json.JSONDecodeError:
            pass
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"raw_response": raw, "explanation": raw}
