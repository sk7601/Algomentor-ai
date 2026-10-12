"use client";

import { useEffect, useState } from "react";
import { getDashboardAction } from "@/actions/analytics.actions";
import { syncProfileAction } from "@/actions/profile.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/charts/stat-card";
import { RatingChart } from "@/components/charts/rating-chart";
import { ActivityChart } from "@/components/charts/activity-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, CheckCircle, Percent } from "lucide-react";
import { toast } from "sonner";
import { formatPercent } from "@/lib/utils";
import type { DashboardData } from "@/types";

export function AnalyticsView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [cfHandle, setCfHandle] = useState("");
  const [lcUser, setLcUser] = useState("");

  const loadData = () => {
    getDashboardAction().then((result) => {
      if (result.success) setData(result.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  async function handleSync() {
    setSyncing(true);
    const result = await syncProfileAction({
      codeforcesHandle: cfHandle || undefined,
      leetcodeUsername: lcUser || undefined,
    });
    setSyncing(false);
    if (result.success) {
      toast.success(result.data.message);
      loadData();
    } else {
      toast.error(result.error);
    }
  }

  if (loading) {
    return (
      <DashboardShell title="Profile Analytics">
        <Skeleton className="h-64" />
      </DashboardShell>
    );
  }

  const analytics = data?.analytics;

  return (
    <DashboardShell title="Profile Analytics" description="Codeforces & LeetCode insights">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sync Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Codeforces Handle</Label>
              <Input value={cfHandle} onChange={(e) => setCfHandle(e.target.value)} placeholder="tourist" />
            </div>
            <div className="space-y-2">
              <Label>LeetCode Username</Label>
              <Input value={lcUser} onChange={(e) => setLcUser(e.target.value)} placeholder="username" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSync} disabled={syncing} className="w-full">
                {syncing ? "Syncing..." : "Sync Profile Data"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Current Rating" value={analytics.currentRating} icon={Trophy} />
            <StatCard title="Peak Rating" value={analytics.peakRating} icon={Target} />
            <StatCard title="Problems Solved" value={analytics.problemsSolved} icon={CheckCircle} />
            <StatCard title="Accuracy" value={formatPercent(analytics.accuracy)} icon={Percent} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Rating History</CardTitle></CardHeader>
              <CardContent><RatingChart data={analytics.ratingHistory} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Activity Trends (30 days)</CardTitle></CardHeader>
              <CardContent><ActivityChart data={analytics.activityTrend} /></CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
