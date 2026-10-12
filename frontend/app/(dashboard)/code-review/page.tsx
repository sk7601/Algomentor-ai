"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { codeReviewApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export default function CodeReviewPage() {
  const [code, setCode] = useState(
    `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`
  );
  const [language, setLanguage] = useState("python");
  const [problemTitle, setProblemTitle] = useState("Two Sum");

  const { data: history } = useQuery({
    queryKey: ["code-review-history"],
    queryFn: codeReviewApi.history,
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      codeReviewApi.review({
        source_code: code,
        language,
        problem_title: problemTitle,
      }),
  });

  const analysis = reviewMutation.data?.analysis as Record<string, unknown> | undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Code Review</h1>
        <p className="text-muted-foreground">Get complexity analysis, bug detection, and optimization suggestions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Submit Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Problem Title</Label>
              <Input value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Source Code</Label>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <Button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? "Analyzing..." : "Review Code"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Analysis</CardTitle>
            <CardDescription>AI-powered code review results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!analysis && (
              <p className="text-muted-foreground">Submit code to see analysis</p>
            )}
            {analysis && (
              <>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Overall Score</span>
                    <span>{String(analysis.overall_score)}/100</span>
                  </div>
                  <Progress value={Number(analysis.overall_score) || 0} />
                </div>
                <div>
                  <p className="text-sm font-medium">Time Complexity</p>
                  <p className="text-sm text-muted-foreground">{String(analysis.time_complexity)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Space Complexity</p>
                  <p className="text-sm text-muted-foreground">{String(analysis.space_complexity)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Summary</p>
                  <p className="text-sm text-muted-foreground">{String(analysis.summary)}</p>
                </div>
                {((analysis.bugs as string[]) || []).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-400">Bugs</p>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {((analysis.bugs as string[]) || []).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {((analysis.edge_cases as string[]) || []).length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Edge Cases</p>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {((analysis.edge_cases as string[]) || []).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {((analysis.better_approaches as string[]) || []).length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Better Approaches</p>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {((analysis.better_approaches as string[]) || []).map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.optimized_solution ? (
                  <div>
                    <p className="text-sm font-medium">Optimized Solution</p>
                    <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                      {String(analysis.optimized_solution)}
                    </pre>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {(history || []).length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Review History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(history || []).slice(0, 5).map((r) => (
                <div key={r.id as string} className="flex justify-between rounded-md border border-border p-3 text-sm">
                  <span>{String(r.problem_title || "Untitled")}</span>
                  <span className="text-muted-foreground">
                    Score: {String((r.analysis as Record<string, unknown>)?.overall_score ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
