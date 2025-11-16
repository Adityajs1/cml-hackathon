"use client";
import React from "react";

type Item = { metadata?: { ts?: number } };

export default function Heatmap({ items }: { items: Item[] }) {
  // count by day
  const byDay = new Map<string, number>();
  for (const m of items) {
    const ts = m.metadata?.ts || 0;
    if (!ts) continue;
    const key = new Date(ts).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }

  // last 12 weeks
  const days: string[] = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const max = Math.max(1, ...Array.from(byDay.values()));

  return (
    <div className="grid grid-cols-12 gap-1">
      {days.map((d) => {
        const count = byDay.get(d) || 0;
        const level = count === 0 ? 0 : Math.ceil((count / max) * 4);
        const shades = [
          "bg-[#0a1322]/40",
          "bg-blue-500/20",
          "bg-blue-500/40",
          "bg-blue-500/60",
          "bg-blue-500/90",
        ];
        return (
          <div
            key={d}
            title={`${d}: ${count} messages`}
            className={`h-3 w-3 rounded-sm ${shades[level]}`}
          />
        );
      })}
    </div>
  );
}
