"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { predictionsApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function ProblemList({ problems, color }: { problems: Array<Record<string, unknown>>; color: string }) {
  return (
    <div className="space-y-3">
      {problems.map((p) => (
        <div key={`${p.platform}-${p.slug}`} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{String(p.title)}</p>
              <p className="text-xs text-muted-foreground">
                {String(p.platform)} · {String(p.difficulty)} · {((p.topics as string[]) || []).join(", ")}
              </p>
            </div>
            {Boolean(p.url) && (
              <a href={String(p.url)} target="_blank" rel="noopener noreferrer" className="text-primary">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span>Success Probability</span>
              <span className={color}>{Math.round(Number(p.success_probability) * 100)}%</span>
            </div>
            <Progress value={Number(p.success_probability) * 100} className="mt-1 h-1" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{String(p.reason)}</p>
        </div>
      ))}
    </div>
  );
}

export default function RecommendationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recommendations"],
    queryFn: predictionsApi.recommendations,
  });

  if (isLoading) return <p className="text-muted-foreground">Loading recommendations...</p>;
  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="mt-4 text-muted-foreground">
          {error instanceof Error ? error.message : "Link your profile first"}
        </p>
      </div>
    );
  }

  const easy = (data?.easy as Array<Record<string, unknown>>) || [];
  const medium = (data?.medium as Array<Record<string, unknown>>) || [];
  const hard = (data?.hard as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Problem Recommendations</h1>
        <p className="text-muted-foreground">Personalized problems based on weak topics and rating</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-green-400">Easy</CardTitle>
            <CardDescription>Build confidence on weak topics</CardDescription>
          </CardHeader>
          <CardContent>
            <ProblemList problems={easy} color="text-green-400" />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-yellow-400">Medium</CardTitle>
            <CardDescription>Rating-appropriate challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <ProblemList problems={medium} color="text-yellow-400" />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-red-400">Hard</CardTitle>
            <CardDescription>Push your limits</CardDescription>
          </CardHeader>
          <CardContent>
            <ProblemList problems={hard} color="text-red-400" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
