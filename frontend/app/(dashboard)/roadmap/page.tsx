"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { roadmapApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RoadmapPage() {
  const queryClient = useQueryClient();
  const [targetRating, setTargetRating] = useState(1600);
  const [duration, setDuration] = useState(8);

  const { data: roadmaps, isLoading } = useQuery({
    queryKey: ["roadmaps"],
    queryFn: roadmapApi.list,
  });

  const generateMutation = useMutation({
    mutationFn: () => roadmapApi.generate({ duration_weeks: duration, target_rating: targetRating }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
  });

  const latest = roadmaps?.[0] as Record<string, unknown> | undefined;
  const plan = (latest?.plan as { weeks?: Array<Record<string, unknown>> })?.weeks || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Roadmap Generator</h1>
        <p className="text-muted-foreground">Personalized study plans based on your weaknesses and target rating</p>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Generate New Roadmap</CardTitle>
          <CardDescription>Choose duration and target rating</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <TabsList>
              <TabsTrigger value="4">4 Weeks</TabsTrigger>
              <TabsTrigger value="8">8 Weeks</TabsTrigger>
              <TabsTrigger value="12">12 Weeks</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-2">
            <Label htmlFor="target">Target Rating</Label>
            <Input
              id="target"
              type="number"
              value={targetRating}
              onChange={(e) => setTargetRating(Number(e.target.value))}
              min={800}
              max={3500}
            />
          </div>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? "Generating..." : "Generate Roadmap"}
          </Button>
        </CardContent>
      </Card>

      {isLoading && <p className="text-muted-foreground">Loading roadmaps...</p>}

      {latest && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>
              {String(latest.duration_weeks)}-Week Plan → {String(latest.target_rating)} rating
            </CardTitle>
            <CardDescription>
              Current: {String(latest.current_rating)} | Weak topics:{" "}
              {((latest.weak_topics as string[]) || []).join(", ") || "General"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.map((week) => (
              <div key={String(week.week)} className="rounded-lg border border-border p-4">
                <h3 className="font-semibold">Week {String(week.week)}</h3>
                <p className="text-sm text-primary">
                  Focus: {((week.focus_topics as string[]) || []).join(", ")}
                </p>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  {((week.goals as string[]) || []).map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  ~{String(week.estimated_hours)} hours estimated
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
