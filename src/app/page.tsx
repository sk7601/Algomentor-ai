import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, BarChart3, Brain, Target } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-zinc-100">AlgoMentor AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-8">
          <Zap className="h-4 w-4" />
          AI-Powered Competitive Programming Intelligence
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-100 sm:text-6xl">
          Master Competitive Programming
          <br />
          <span className="text-violet-400">With AI Precision</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Analyze your Codeforces and LeetCode profiles, get personalized roadmaps,
          AI tutoring, code reviews, and interview readiness scores — all in one platform.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Start Free</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: "Profile Analytics",
              desc: "Deep insights from Codeforces & LeetCode with rating trends and accuracy metrics.",
            },
            {
              icon: Brain,
              title: "AI Tutor & Reviews",
              desc: "Learn advanced algorithms and get expert code reviews powered by OpenRouter.",
            },
            {
              icon: Target,
              title: "Interview Ready",
              desc: "Company-specific readiness scores for Google, Amazon, Microsoft, and more.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <feature.icon className="h-8 w-8 text-violet-400 mb-4" />
              <h3 className="text-lg font-semibold text-zinc-100">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
