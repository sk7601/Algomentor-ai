"use client";

import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RatingChartProps {
  data: Array<{ date: string; codeforces: number | null; leetcode: number | null }>;
}

export function RatingChart({ data }: RatingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} />
        <YAxis stroke="#888" fontSize={12} tickLine={false} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }}
          labelStyle={{ color: "#fff" }}
        />
        <Line type="monotone" dataKey="codeforces" stroke="#6366f1" strokeWidth={2} dot={false} name="Codeforces" />
        <Line type="monotone" dataKey="leetcode" stroke="#22c55e" strokeWidth={2} dot={false} name="LeetCode" />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface TopicRadarProps {
  data: Array<{ topic: string; strength: number; weakness: number }>;
}

export function TopicRadar({ data }: TopicRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#333" />
        <PolarAngleAxis dataKey="topic" stroke="#888" fontSize={11} />
        <Radar name="Strength" dataKey="strength" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
        <Radar name="Weakness" dataKey="weakness" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
        <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

interface HeatmapProps {
  data: Array<{ topic: string; difficulty: string; gap_score: number }>;
}

export function WeaknessHeatmap({ data }: HeatmapProps) {
  const topics = [...new Set(data.map((d) => d.topic))];
  const difficulties = ["easy", "medium", "hard"];

  const getColor = (score: number) => {
    const intensity = Math.min(100, score) / 100;
    return `rgba(239, 68, 68, ${intensity * 0.8 + 0.1})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left text-muted-foreground">Topic</th>
            {difficulties.map((d) => (
              <th key={d} className="p-2 capitalize text-muted-foreground">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr key={topic}>
              <td className="p-2 font-medium">{topic}</td>
              {difficulties.map((diff) => {
                const cell = data.find((d) => d.topic === topic && d.difficulty === diff);
                const score = cell?.gap_score ?? 0;
                return (
                  <td key={diff} className="p-2">
                    <div
                      className="flex h-10 items-center justify-center rounded-md text-xs font-medium"
                      style={{ backgroundColor: getColor(score) }}
                      title={`Gap: ${score.toFixed(1)}`}
                    >
                      {score.toFixed(0)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
