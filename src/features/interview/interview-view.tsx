"use client";

import { useEffect, useState } from "react";
import { getInterviewReadinessAction } from "@/actions/analytics.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { InterviewReadiness } from "@/types";

const COMPANY_COLORS: Record<string, string> = {
  Amazon: "text-orange-400",
  Google: "text-blue-400",
  Microsoft: "text-cyan-400",
  Atlassian: "text-sky-400",
  Uber: "text-emerald-400",
};

export function InterviewView() {
  const [readiness, setReadiness] = useState<InterviewReadiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviewReadinessAction().then((r) => {
      if (r.success) setReadiness(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Interview Readiness">
        <Skeleton className="h-96" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Interview Readiness" description="Company-specific preparation scores">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {readiness.map((r) => (
          <Card key={r.company}>
            <CardHeader>
              <CardTitle className={COMPANY_COLORS[r.company] || "text-zinc-100"}>
                {r.company}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Readiness Score</span>
                  <span className="font-semibold text-zinc-100">{r.score}%</span>
                </div>
                <Progress value={r.score} />
              </div>
              {r.missingTopics.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Missing Topics</p>
                  <div className="flex flex-wrap gap-1">
                    {r.missingTopics.map((t) => (
                      <Badge key={t} variant="warning">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Suggestions</p>
                <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                  {r.suggestions.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
