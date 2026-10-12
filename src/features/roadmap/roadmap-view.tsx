"use client";

import { useEffect, useState } from "react";
import { generateRoadmapAction, getRoadmapsAction } from "@/actions/roadmap.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { RoadmapPlan } from "@/types";

export function RoadmapView() {
  const [targetRating, setTargetRating] = useState(1600);
  const [plan, setPlan] = useState<RoadmapPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; title: string; duration: number; createdAt: Date }>>([]);

  useEffect(() => {
    getRoadmapsAction().then((r) => {
      if (r.success) setHistory(r.data);
    });
  }, []);

  async function generate(duration: 4 | 8 | 12) {
    setLoading(true);
    const result = await generateRoadmapAction({ targetRating, duration });
    setLoading(false);
    if (result.success) {
      setPlan(result.data);
      toast.success("Roadmap generated!");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DashboardShell title="Roadmap Generator" description="AI-powered training plans">
      <Card className="mb-6">
        <CardHeader><CardTitle>Generate Plan</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Target Rating</Label>
              <Input
                type="number"
                value={targetRating}
                onChange={(e) => setTargetRating(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <Tabs defaultValue="8">
              <TabsList>
                <TabsTrigger value="4" onClick={() => generate(4)}>4 Weeks</TabsTrigger>
                <TabsTrigger value="8" onClick={() => generate(8)}>8 Weeks</TabsTrigger>
                <TabsTrigger value="12" onClick={() => generate(12)}>12 Weeks</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => generate(8)} disabled={loading}>
              {loading ? "Generating..." : "Generate 8-Week Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-100">{plan.title}</h2>
          {plan.weeks.map((week) => (
            <Card key={week.week}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Week {week.week}
                  <Badge>{week.estimatedHours}h</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Topics</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {week.topics.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Objectives</p>
                  <ul className="list-disc list-inside text-sm text-zinc-400">
                    {week.learningObjectives.map((o) => <li key={o}>{o}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Practice Problems</p>
                  <div className="space-y-1">
                    {week.practiceProblems.map((p) => (
                      <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-violet-400 hover:underline">
                        {p.name} ({p.platform})
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Contest Goals</p>
                  <ul className="list-disc list-inside text-sm text-zinc-400">
                    {week.contestGoals.map((g) => <li key={g}>{g}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Previous Roadmaps</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {history.map((r) => (
              <div key={r.id} className="flex justify-between text-sm text-zinc-400">
                <span>{r.title}</span>
                <span>{r.duration} weeks · {new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
