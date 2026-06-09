"use client";

import { useEffect, useState } from "react";
import { getRecommendationsAction } from "@/actions/analytics.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import type { ProblemRecommendation } from "@/types";

export function RecommendationsView() {
  const [recs, setRecs] = useState<{
    easy: ProblemRecommendation[];
    medium: ProblemRecommendation[];
    hard: ProblemRecommendation[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const result = await getRecommendationsAction();
    setLoading(false);
    if (result.success) setRecs(result.data);
    else toast.error(result.error);
  }

  useEffect(() => { load(); }, []);

  return (
    <DashboardShell title="Problem Recommendations" description="Personalized problems based on your profile">
      <div className="mb-4">
        <Button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh Recommendations"}
        </Button>
      </div>

      {loading && !recs ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : recs ? (
        <div className="grid gap-6 md:grid-cols-3">
          <RecommendationColumn title="Easy" difficulty="success" problems={recs.easy} />
          <RecommendationColumn title="Medium" difficulty="warning" problems={recs.medium} />
          <RecommendationColumn title="Hard" difficulty="destructive" problems={recs.hard} />
        </div>
      ) : null}
    </DashboardShell>
  );
}

function RecommendationColumn({
  title,
  difficulty,
  problems,
}: {
  title: string;
  difficulty: "success" | "warning" | "destructive";
  problems: ProblemRecommendation[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant={difficulty}>{problems.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {problems.map((p) => (
          <div key={p.url} className="rounded-lg border border-zinc-800 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">{p.problemName}</p>
                <p className="text-xs text-zinc-500">{p.platform} · {p.topic}</p>
                <p className="text-xs text-zinc-500 mt-1">{p.reason}</p>
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 text-violet-400" />
              </a>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
