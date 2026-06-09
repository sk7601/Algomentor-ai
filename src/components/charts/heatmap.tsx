"use client";

interface HeatmapProps {
  data: Array<{ day: string; hour: number; value: number }>;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

export function Heatmap({ data }: HeatmapProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  const getValue = (day: string, hour: number) => {
    const entry = data.find((d) => d.day === day && d.hour === hour);
    return entry?.value ?? 0;
  };

  const getColor = (value: number) => {
    const intensity = value / max;
    if (intensity === 0) return "bg-zinc-900";
    if (intensity < 0.25) return "bg-violet-950";
    if (intensity < 0.5) return "bg-violet-900";
    if (intensity < 0.75) return "bg-violet-700";
    return "bg-violet-500";
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
        <div />
        {HOURS.map((h) => (
          <div key={h} className="text-center text-xs text-zinc-500">
            {h}h
          </div>
        ))}
        {DAYS.map((day) => (
          <div key={day} className="contents">
            <div className="text-xs text-zinc-500 flex items-center">
              {day}
            </div>
            {HOURS.map((hour) => {
              const value = getValue(day, hour);
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`h-8 w-8 rounded ${getColor(value)}`}
                  title={`${day} ${hour}:00 - ${value} submissions`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
