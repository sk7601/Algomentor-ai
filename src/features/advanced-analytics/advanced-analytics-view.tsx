"use client";

import { useEffect, useState } from "react";
import { getAdvancedAnalyticsAction } from "@/actions/analytics.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/charts/stat-card";
import { Heatmap } from "@/components/charts/heatmap";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Trophy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import type { AdvancedAnalytics } from "@/types";

export function AdvancedAnalyticsView() {
  const [data, setData] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdvancedAnalyticsAction().then((r) => {
      if (r.success) setData(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Advanced Analytics">
        <Skeleton className="h-96" />
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell title="Advanced Analytics">
        <Card><CardContent className="py-12 text-center text-zinc-500">No analytics data. Sync your profile first.</CardContent></Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Advanced Analytics" description="Learning velocity, heatmaps, and mastery curves">
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Learning Velocity" value={`${data.learningVelocity.toFixed(1)}/wk`} icon={Zap} description="Problems per week" />
        <StatCard title="Contest Consistency" value={`${data.contestConsistency.toFixed(0)}%`} icon={Trophy} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Topic Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topicDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="topic" stroke="#71717a" fontSize={10} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#71717a" />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Problem Solving Heatmap</CardTitle></CardHeader>
          <CardContent>
            <Heatmap data={data.activityHeatmap} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Rating Growth Forecast</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.ratingForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Topic Mastery Curves</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="week" type="number" stroke="#71717a" allowDuplicatedCategory={false} />
                <YAxis stroke="#71717a" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
                {data.masteryCurves.map((curve, i) => (
                  <Line
                    key={curve.topic}
                    data={curve.data}
                    type="monotone"
                    dataKey="score"
                    name={curve.topic}
                    stroke={["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"][i % 6]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
