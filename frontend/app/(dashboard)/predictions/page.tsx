"use client";

import { useQuery } from "@tanstack/react-query";
import { predictionsApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const COMPANIES = [
  { key: "amazon", label: "Amazon", color: "text-orange-400" },
  { key: "google", label: "Google", color: "text-blue-400" },
  { key: "microsoft", label: "Microsoft", color: "text-cyan-400" },
  { key: "atlassian", label: "Atlassian", color: "text-indigo-400" },
];

export default function PredictionsPage() {
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["rating-predictions"],
    queryFn: predictionsApi.ratings,
  });

  const { data: interview, isLoading: interviewLoading } = useQuery({
    queryKey: ["interview-readiness"],
    queryFn: predictionsApi.interview,
  });

  if (ratingsLoading || interviewLoading) {
    return <p className="text-muted-foreground">Loading predictions...</p>;
  }

  const r = ratings as Record<string, unknown>;
  const i = interview as Record<string, unknown>;

  const ratingCards = [
    { label: "Next Contest", value: r?.next_contest_rating, desc: "Predicted rating after next contest" },
    { label: "3 Month", value: r?.three_month_rating, desc: "Projected rating in 3 months" },
    { label: "6 Month", value: r?.six_month_rating, desc: "Projected rating in 6 months" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Predictions</h1>
        <p className="text-muted-foreground">ML-powered rating forecasts and interview readiness</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ratingCards.map((card) => (
          <Card key={card.label} className="border-border/50 bg-card/50">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-4xl">{String(card.value ?? "—")}</CardTitle>
              <CardDescription>{card.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Model Confidence</CardTitle>
          <CardDescription>
            Based on contest frequency, rating history, and solved count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={Number(r?.confidence) * 100 || 45} />
          <p className="mt-2 text-sm text-muted-foreground">
            Confidence: {Math.round(Number(r?.confidence) * 100 || 45)}%
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            {Object.entries((r?.factors as Record<string, number>) || {}).map(([k, v]) => (
              <div key={k}>
                <p className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</p>
                <p className="font-medium">{String(v)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Interview Readiness</h2>
        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <span>Overall Score</span>
            <span className="font-bold">{String(i?.overall ?? 0)}/100</span>
          </div>
          <Progress value={Number(i?.overall) || 0} className="mt-1" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COMPANIES.map((company) => (
            <Card key={company.key} className="border-border/50 bg-card/50">
              <CardHeader>
                <CardDescription className={company.color}>{company.label}</CardDescription>
                <CardTitle className="text-3xl">{String(i?.[company.key] ?? 0)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={Number(i?.[company.key]) || 0} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
