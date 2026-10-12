import { generateOpenRouterText, parseJsonFromText } from "@/lib/openrouter";
import { getCached, setCached } from "@/lib/redis";
import type {
  CodeReviewResult,
  RoadmapPlan,
  TutorResponse,
} from "@/types";

export class AIService {
  async generateRoadmap(
    currentRating: number,
    targetRating: number,
    weakTopics: string[],
    duration: 4 | 8 | 12
  ): Promise<RoadmapPlan> {
    const cacheKey = `roadmap:${currentRating}:${targetRating}:${duration}:${weakTopics.join(",")}`;
    const cached = await getCached<RoadmapPlan>(cacheKey);
    if (cached) return cached;

    const prompt = `You are an expert competitive programming coach. Generate a ${duration}-week training roadmap.

Current Rating: ${currentRating}
Target Rating: ${targetRating}
Weak Topics: ${weakTopics.join(", ")}

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "duration": ${duration},
  "targetRating": ${targetRating},
  "weakTopics": ["topic1"],
  "weeks": [
    {
      "week": 1,
      "topics": ["topic"],
      "learningObjectives": ["objective"],
      "practiceProblems": [{"name": "problem", "platform": "Codeforces", "url": "https://..."}],
      "contestGoals": ["goal"],
      "estimatedHours": 10
    }
  ]
}`;

    const text = await generateOpenRouterText(prompt, true);
    const plan = parseJsonFromText<RoadmapPlan>(text);
    await setCached(cacheKey, plan);
    return plan;
  }

  async tutorExplain(topic: string): Promise<TutorResponse> {
    const prompt = `You are an expert competitive programming tutor. Explain "${topic}" comprehensively.

Return ONLY valid JSON:
{
  "intuition": "clear intuition",
  "theory": "detailed theory",
  "complexity": "time and space complexity",
  "codeExample": "C++ code example",
  "commonMistakes": ["mistake1"],
  "practiceProblems": [{"name": "problem", "platform": "Codeforces", "url": "https://..."}]
}`;

    const text = await generateOpenRouterText(prompt, true);
    return parseJsonFromText<TutorResponse>(text);
  }

  async reviewCode(
    sourceCode: string,
    language: string
  ): Promise<CodeReviewResult> {
    const prompt = `You are an expert code reviewer for competitive programming. Review this ${language} code:

\`\`\`${language}
${sourceCode}
\`\`\`

Return ONLY valid JSON:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "edgeCases": ["case1"],
  "optimizations": ["opt1"],
  "alternatives": ["approach1"],
  "bugs": ["bug1 or empty"],
  "codeQuality": "assessment",
  "summary": "overall summary"
}`;

    const text = await generateOpenRouterText(prompt, true);
    return parseJsonFromText<CodeReviewResult>(text);
  }

  async chat(
    message: string,
    history: Array<{ role: string; content: string }>
  ): Promise<string> {
    const context = history
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `You are AlgoMentor AI, an expert competitive programming tutor.

Previous conversation:
${context}

User: ${message}

Provide a helpful, detailed response about competitive programming. Include examples when relevant.`;

    return generateOpenRouterText(prompt);
  }
}

export const aiService = new AIService();
