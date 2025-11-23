"use client";

import React, { useEffect, useState } from "react";

type DayPoint = { date: string; count: number };

interface HeatmapProps {
  userId: string;
  sessionId?: string;
  weeks?: number; // default 12
  className?: string;
}

const colorForCount = (n: number) => {
  if (n <= 0) return "heat-0";
  if (n === 1) return "heat-1";
  if (n <= 3) return "heat-2";
  if (n <= 6) return "heat-3";
  return "heat-4";
};

export default function Heatmap({
  userId,
  sessionId = "default-session",
  weeks = 12,
  className = "",
}: HeatmapProps) {
  const [data, setData] = useState<DayPoint[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    fetch(
      `http://localhost:5050/memories/heatmap?userId=${encodeURIComponent(
        userId
      )}&sessionId=${encodeURIComponent(sessionId)}&weeks=${weeks}`
    )
      .then((r) => r.json())
      .then((json) => {
        setData(json.data || []);
      })
      .catch((e) => {
        console.error("Heatmap fetch error", e);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [userId, sessionId, weeks]);

  if (loading || !data) {
    return (
      <div
        className={`p-4 rounded border border-[#1e2b4a] bg-[#0a1322] ${className}`}
      >
        <div className="text-sm text-blue-300/60">Loading activity...</div>
      </div>
    );
  }

  const totalDays = data.length;
  const cols = Math.ceil(totalDays / 7);

  const columns: DayPoint[][] = [];
  for (let c = 0; c < cols; c++) {
    columns.push([]);
    for (let r = 0; r < 7; r++) {
      const idx = c * 7 + r;
      const day = data[idx];
      columns[c].push(day || { date: "1970-01-01", count: 0 });
    }
  }

  return (
    <div
      className={`p-4 rounded border border-[#1e2b4a] bg-[#0E1523]/80 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-blue-300/70">
          Activity Heatmap ({weeks} weeks)
        </div>
        <div className="text-xs text-blue-400/60">
          {data.reduce((s, d) => s + d.count, 0)} items
        </div>
      </div>

      <div style={{ overflowX: "auto" }} aria-hidden>
        <div style={{ display: "flex", gap: 6, padding: "6px 2px" }}>
          {columns.map((col, ci) => (
            <div
              key={ci}
              style={{ display: "grid", gridTemplateRows: "repeat(7, 14px)", gap: 6 }}
            >
              {col.map((day, ri) => {
                const title = `${day.date} — ${day.count} item${
                  day.count === 1 ? "" : "s"
                }`;
                const cls = colorForCount(day.count);
                return (
                  <div
                    key={ri}
                    title={title}
                    className={`rounded-sm ${cls}`}
                    style={{
                      width: 12,
                      height: 14,
                      boxSizing: "border-box",
                      border: "1px solid rgba(255,255,255,0.02)",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-blue-300/60 flex items-center gap-2">
        <div className="inline-flex items-center gap-1">
          <div className="w-3 h-3 heat-0 rounded-sm border border-white/5" /> none
        </div>
        <div className="inline-flex items-center gap-1 ml-3">
          <div className="w-3 h-3 heat-1 rounded-sm" /> 1
        </div>
        <div className="inline-flex items-center gap-1 ml-2">
          <div className="w-3 h-3 heat-2 rounded-sm" /> 2–3
        </div>
        <div className="inline-flex items-center gap-1 ml-2">
          <div className="w-3 h-3 heat-3 rounded-sm" /> 4–6
        </div>
        <div className="inline-flex items-center gap-1 ml-2">
          <div className="w-3 h-3 heat-4 rounded-sm" /> 7+
        </div>
      </div>

      <style jsx>{`
        .heat-0 {
          background: rgba(255, 255, 255, 0.03);
        }
        .heat-1 {
          background: rgba(59, 130, 246, 0.35);
        }
        .heat-2 {
          background: rgba(59, 130, 246, 0.55);
        }
        .heat-3 {
          background: rgba(59, 130, 246, 0.75);
        }
        .heat-4 {
          background: rgba(59, 130, 246, 1);
        }
      `}</style>
    </div>
  );
}
