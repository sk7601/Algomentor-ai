"use client";

import { useEffect, useState } from "react";
import { getPredictionsAction } from "@/actions/analytics.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/charts/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ContestPrediction } from "@/types";
import { formatPercent } from "@/lib/utils";

export function PredictionsView() {
  const [prediction, setPrediction] = useState<ContestPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPredictionsAction().then((r) => {
      if (r.success) setPrediction(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Contest Predictor">
        <Skeleton className="h-96" />
      </DashboardShell>
    );
  }

  if (!prediction) {
    return (
      <DashboardShell title="Contest Predictor">
        <Card><CardContent className="py-12 text-center text-zinc-500">Sync your profile to generate predictions.</CardContent></Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Contest Predictor" description="Rating forecasts based on your performance">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Next Contest" value={prediction.nextContestRating} icon={TrendingUp} />
        <StatCard title="3 Month Forecast" value={prediction.threeMonthRating} icon={Calendar} />
        <StatCard title="6 Month Forecast" value={prediction.sixMonthRating} icon={Target} description={`Confidence: ${formatPercent(prediction.confidence)}`} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Rating Forecast</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={prediction.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
              <ReferenceLine x={prediction.history.find((h) => h.predicted)?.month} stroke="#71717a" strokeDasharray="5 5" label="Now" />
              <Line type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Prediction Factors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(prediction.factors).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-zinc-800 p-4">
                <p className="text-xs text-zinc-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="text-lg font-semibold text-zinc-100">{typeof value === "number" ? value.toFixed(1) : value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
