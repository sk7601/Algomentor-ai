"use client";

import { useEffect, useState } from "react";
import { getDashboardAction } from "@/actions/analytics.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TopicAnalysis } from "@/types";
import { formatPercent } from "@/lib/utils";

export function TopicsView() {
  const [topics, setTopics] = useState<TopicAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardAction().then((result) => {
      if (result.success) setTopics(result.data.topics);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Topic Analysis">
        <Skeleton className="h-96" />
      </DashboardShell>
    );
  }

  const chartData = topics.map((t) => ({
    topic: t.topic.length > 15 ? t.topic.slice(0, 13) + "…" : t.topic,
    strength: Math.round(t.strengthScore),
    weakness: Math.round(t.weaknessScore),
  }));

  return (
    <DashboardShell title="Topic Analysis" description="Strength, weakness, and acceptance rates">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Topic Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="topic" stroke="#71717a" fontSize={10} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#71717a" />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
                <Bar dataKey="strength" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Topic Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {topics.map((t) => (
              <div key={t.topic} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200">{t.topic}</span>
                  <Badge variant={t.strengthScore >= 50 ? "success" : "warning"}>
                    {t.problemsSolved} solved
                  </Badge>
                </div>
                <Progress value={t.strengthScore} />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Acceptance: {formatPercent(t.acceptanceRate)}</span>
                  <span>Trend: {t.trend > 0 ? "+" : ""}{t.trend}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
