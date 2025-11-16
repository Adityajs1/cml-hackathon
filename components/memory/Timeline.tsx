"use client";
import React from "react";
import { Card } from "@/components/ui/card";

type Item = {
  id: string;
  document: string;
  metadata?: { role?: string; type?: string; ts?: number };
};

export default function Timeline({
  items,
  onShowContext,
  onRewrite,
}: {
  items: Item[];
  onShowContext: (item: Item) => void;
  onRewrite: (item: Item) => void;
}) {
  const sorted = [...items].sort(
    (a, b) => (a.metadata?.ts || 0) - (b.metadata?.ts || 0)
  );

  return (
    <div className="space-y-3">
      {sorted.map((m) => {
        const isSummary = m.metadata?.type === "summary";
        return (
          <div key={m.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full ${
                  isSummary ? "bg-yellow-400" : "bg-blue-400"
                }`}
              />
              <div className="w-0.5 flex-1 bg-[#1e2b4a]" />
            </div>

            <Card
              className={`flex-1 p-3 border ${
                isSummary
                  ? "border-yellow-400/50 bg-[#1a1a0a]"
                  : "border-[#1e2b4a] bg-[#0a1322]"
              }`}
            >
              <div className="text-xs text-blue-400/60 mb-1">
                {(m.metadata?.role || "system").toUpperCase()} •{" "}
                {new Date(m.metadata?.ts || 0).toLocaleString()}
                {isSummary && " • SUMMARY"}
              </div>
              <div className="text-blue-100 whitespace-pre-wrap">{m.document}</div>

              {isSummary && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onShowContext(m)}
                    className="text-xs px-2 py-1 rounded bg-[#132036] hover:bg-[#182a48]"
                  >
                    Show context
                  </button>
                  <button
                    onClick={() => onRewrite(m)}
                    className="text-xs px-2 py-1 rounded bg-[#20361b] hover:bg-[#294825]"
                  >
                    Rewrite
                  </button>
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
