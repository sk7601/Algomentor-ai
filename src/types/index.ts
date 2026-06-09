export const TOPICS = [
  "Dynamic Programming",
  "Graphs",
  "Trees",
  "Greedy",
  "Binary Search",
  "Math",
  "Strings",
  "Implementation",
  "Number Theory",
  "Data Structures",
  "Bit Manipulation",
  "Constructive Algorithms",
] as const;

export type Topic = (typeof TOPICS)[number];

export const COMPANIES = [
  "Amazon",
  "Google",
  "Microsoft",
  "Atlassian",
  "Uber",
] as const;

export type Company = (typeof COMPANIES)[number];

export interface CodeforcesUser {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  contribution: number;
}

export interface CodeforcesContest {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
  problemsSolved: number;
}

export interface CodeforcesSubmission {
  id: number;
  problemName: string;
  problemRating: number;
  tags: string[];
  verdict: string;
  programmingLanguage: string;
  creationTimeSeconds: number;
}

export interface LeetCodeProfile {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  submissionStats: Array<{
    difficulty: string;
    count: number;
    submissions: number;
  }>;
}

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export interface ProfileAnalytics {
  currentRating: number;
  peakRating: number;
  contestsParticipated: number;
  problemsSolved: number;
  accuracy: number;
  activityTrend: Array<{ date: string; count: number }>;
  ratingHistory: Array<{ date: string; rating: number }>;
}

export interface TopicAnalysis {
  topic: string;
  strengthScore: number;
  weaknessScore: number;
  acceptanceRate: number;
  problemsSolved: number;
  problemsAttempted: number;
  trend: number;
}

export interface RoadmapWeek {
  week: number;
  topics: string[];
  learningObjectives: string[];
  practiceProblems: Array<{ name: string; platform: string; url: string }>;
  contestGoals: string[];
  estimatedHours: number;
}

export interface RoadmapPlan {
  title: string;
  duration: number;
  targetRating: number;
  weakTopics: string[];
  weeks: RoadmapWeek[];
}

export interface ProblemRecommendation {
  problemName: string;
  platform: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  rating?: number;
  url: string;
  reason: string;
}

export interface ContestPrediction {
  nextContestRating: number;
  threeMonthRating: number;
  sixMonthRating: number;
  confidence: number;
  history: Array<{ month: string; rating: number; predicted: boolean }>;
  factors: Record<string, number>;
}

export interface InterviewReadiness {
  company: string;
  score: number;
  missingTopics: string[];
  suggestions: string[];
}

export interface CodeReviewResult {
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
  optimizations: string[];
  alternatives: string[];
  bugs: string[];
  codeQuality: string;
  summary: string;
}

export interface TutorResponse {
  intuition: string;
  theory: string;
  complexity: string;
  codeExample: string;
  commonMistakes: string[];
  practiceProblems: Array<{ name: string; platform: string; url: string }>;
}

export interface AdvancedAnalytics {
  learningVelocity: number;
  contestConsistency: number;
  topicDistribution: Array<{ topic: string; value: number }>;
  activityHeatmap: Array<{ day: string; hour: number; value: number }>;
  ratingForecast: Array<{ date: string; rating: number }>;
  masteryCurves: Array<{ topic: string; data: Array<{ week: number; score: number }> }>;
}

export interface DashboardData {
  analytics: ProfileAnalytics;
  topics: TopicAnalysis[];
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
  insights: string[];
}
