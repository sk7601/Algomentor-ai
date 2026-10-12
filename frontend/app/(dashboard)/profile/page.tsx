"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [cfHandle, setCfHandle] = useState("");
  const [lcUsername, setLcUsername] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      profileApi.sync({
        codeforces_handle: cfHandle || undefined,
        leetcode_username: lcUsername || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const p = profile as Record<string, unknown> | null;
  const topicScores = (syncMutation.data?.topic_scores as Array<Record<string, number>>) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile Analytics</h1>
        <p className="text-muted-foreground">Link and sync your Codeforces and LeetCode profiles</p>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Connect Profiles</CardTitle>
          <CardDescription>Enter your handles to fetch contest history, ratings, and submissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cf">Codeforces Handle</Label>
              <Input
                id="cf"
                placeholder="e.g. tourist"
                value={cfHandle || (p?.codeforces_handle as string) || ""}
                onChange={(e) => setCfHandle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc">LeetCode Username</Label>
              <Input
                id="lc"
                placeholder="e.g. lee215"
                value={lcUsername || (p?.leetcode_username as string) || ""}
                onChange={(e) => setLcUsername(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || (!cfHandle && !lcUsername && !p)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync Profiles"}
          </Button>
          {syncMutation.error && (
            <p className="text-sm text-red-400">
              {syncMutation.error instanceof Error ? syncMutation.error.message : "Sync failed"}
            </p>
          )}
          {syncMutation.isSuccess && (
            <p className="text-sm text-green-400">Profile synced successfully!</p>
          )}
        </CardContent>
      </Card>

      {!isLoading && p && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Current Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">CF Rating</p>
                <p className="text-2xl font-bold">{String(p.codeforces_rating ?? "—")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">LC Rating</p>
                <p className="text-2xl font-bold">{String(p.leetcode_rating ?? "—")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Solved</p>
                <p className="text-2xl font-bold">{String(p.total_solved ?? 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contests</p>
                <p className="text-2xl font-bold">{String(p.contest_count ?? 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle>Topic Analysis</CardTitle>
              <CardDescription>Strength and weakness scores by topic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(topicScores.length ? topicScores : []).map((t) => (
                <div key={t.topic} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{t.topic}</span>
                    <span className="text-muted-foreground">
                      S: {t.strength_score?.toFixed?.(0)} / W: {t.weakness_score?.toFixed?.(0)}
                    </span>
                  </div>
                  <Progress value={t.strength_score ?? 0} />
                </div>
              ))}
              {!topicScores.length && (
                <p className="text-sm text-muted-foreground">Sync your profile to see topic analysis</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
