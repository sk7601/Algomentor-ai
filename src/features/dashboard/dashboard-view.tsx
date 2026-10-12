"use client";

import { useEffect, useState } from "react";
import { getDashboardAction } from "@/actions/analytics.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/charts/stat-card";
import { RatingChart } from "@/components/charts/rating-chart";
import { TopicRadarChart } from "@/components/charts/radar-chart";
import { ActivityChart } from "@/components/charts/activity-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, CheckCircle, Percent, Activity } from "lucide-react";
import type { DashboardData } from "@/types";
import { formatPercent } from "@/lib/utils";

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardAction().then((result) => {
      if (result.success) setData(result.data);
      else setError(result.error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Dashboard" description="Your competitive programming overview">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell title="Dashboard">
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            {error || "No data available. Go to Settings to sync your profile."}
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const { analytics, topics, recentActivity, insights } = data;

  return (
    <DashboardShell title="Dashboard" description="Your competitive programming overview">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Current Rating" value={analytics.currentRating} icon={Trophy} />
        <StatCard title="Peak Rating" value={analytics.peakRating} icon={Target} />
        <StatCard title="Problems Solved" value={analytics.problemsSolved} icon={CheckCircle} />
        <StatCard
          title="Accuracy"
          value={formatPercent(analytics.accuracy)}
          icon={Percent}
          description={`${analytics.contestsParticipated} contests`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rating Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <RatingChart data={analytics.ratingHistory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Topic Strength Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <TopicRadarChart
              data={topics.map((t) => ({ topic: t.topic, score: t.strengthScore }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Problem Solving Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={analytics.activityTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-zinc-400 border-l-2 border-violet-500 pl-3">
                {insight}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-500">No recent activity. Sync your profile in Settings.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{item.title}</p>
                    <p className="text-xs text-zinc-500">{item.description}</p>
                  </div>
                  <Badge variant={item.type === "solved" ? "success" : "warning"}>
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
