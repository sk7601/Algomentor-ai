import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Code2, Map, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: BarChart3,
    title: "Profile Analytics",
    description: "Sync Codeforces and LeetCode profiles. Track ratings, submissions, and solved problems.",
  },
  {
    icon: Target,
    title: "Topic Analysis",
    description: "Identify strengths and weaknesses across DP, Graphs, Trees, Greedy, and more.",
  },
  {
    icon: Map,
    title: "Personalized Roadmaps",
    description: "Generate 4, 8, or 12-week plans tailored to your rating and weak topics.",
  },
  {
    icon: Brain,
    title: "AI Tutor",
    description: "Ask about DSU Rollback, Digit DP, Centroid Decomposition — get explanations and practice problems.",
  },
  {
    icon: Code2,
    title: "Code Review",
    description: "Upload solutions for complexity analysis, bug detection, and optimized alternatives.",
  },
  {
    icon: Sparkles,
    title: "Rating Predictions",
    description: "ML-powered contest rating forecasts and interview readiness scores for top companies.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">AlgoMentor AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="grid-bg relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium text-primary">AI-Powered Competitive Programming Coach</p>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
            Master CP with <span className="gradient-text">AlgoMentor AI</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Analyze your LeetCode and Codeforces profiles, discover weaknesses, get personalized roadmaps,
            AI tutoring, and code reviews — all in one platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Demo Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">Everything you need to level up</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        AlgoMentor AI — Built for competitive programmers
      </footer>
    </div>
  );
}
