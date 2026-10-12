"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingChart, TopicRadar, WeaknessHeatmap } from "@/components/charts/dashboard-charts";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: analyticsApi.dashboard,
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load dashboard"}
            </p>
            <Link href="/profile">
              <Button>Link your profile first</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data?.stats as Record<string, number>;
  const ratingChart = (data?.rating_chart as Array<Record<string, unknown>>) || [];
  const topicRadar = (data?.topic_radar as Array<Record<string, number>>) || [];
  const heatmap = (data?.weakness_heatmap as Array<Record<string, unknown>>) || [];

  const statCards = [
    { label: "Total Solved", value: stats?.total_solved ?? 0 },
    { label: "CF Rating", value: stats?.codeforces_rating ?? "—" },
    { label: "LC Rating", value: stats?.leetcode_rating ?? "—" },
    { label: "Contests", value: stats?.contest_count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your competitive programming analytics overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Rating History</CardTitle>
            <CardDescription>Codeforces and LeetCode rating over time</CardDescription>
          </CardHeader>
          <CardContent>
            <RatingChart data={ratingChart as never} />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Topic Radar</CardTitle>
            <CardDescription>Strength vs weakness by topic</CardDescription>
          </CardHeader>
          <CardContent>
            <TopicRadar data={topicRadar as never} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Solved Problems</CardTitle>
            <CardDescription>Breakdown by difficulty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Easy", value: stats?.easy_solved ?? 0, total: stats?.total_solved ?? 1 },
              { label: "Medium", value: stats?.medium_solved ?? 0, total: stats?.total_solved ?? 1 },
              { label: "Hard", value: stats?.hard_solved ?? 0, total: stats?.total_solved ?? 1 },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <Progress value={(item.value / Math.max(item.total, 1)) * 100} />
              </div>
            ))}
            <div className="pt-2">
              <div className="flex justify-between text-sm">
                <span>Consistency Score</span>
                <span>{stats?.consistency_score?.toFixed?.(1) ?? 0}%</span>
              </div>
              <Progress value={stats?.consistency_score ?? 0} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Weakness Heatmap</CardTitle>
            <CardDescription>Topic gaps by difficulty level</CardDescription>
          </CardHeader>
          <CardContent>
            <WeaknessHeatmap data={heatmap as never} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
