"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TopicRadarChartProps {
  data: Array<{ topic: string; score: number }>;
}

export function TopicRadarChart({ data }: TopicRadarChartProps) {
  const chartData = data.map((d) => ({
    topic: d.topic.length > 12 ? d.topic.slice(0, 10) + "…" : d.topic,
    score: Math.round(d.score),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#3f3f46" />
        <PolarAngleAxis dataKey="topic" stroke="#a1a1aa" fontSize={11} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#71717a" />
        <Radar
          name="Strength"
          dataKey="score"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.3}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
