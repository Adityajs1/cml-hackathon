"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type Item = {
  id: string;
  document: string;
  metadata?: {
    role?: string;
    type?: string;
    ts?: number;
    sessionId?: string;
  };
};

export default function Timeline({
  items,
  onShowContext,
  onRewrite,
  onDelete,
  onEdit,
}: {
  items: Item[];
  onShowContext: (item: Item) => void;
  onRewrite: (item: Item) => void;
  onDelete?: (item: Item) => void;   // now optional
  onEdit?: (item: Item) => void;     // now optional
}) {
  
  const sorted = [...items].sort(
    (a, b) => (a.metadata?.ts || 0) - (b.metadata?.ts || 0)
  );

  if (!sorted.length) {
    return <div className="text-blue-300/60">No timeline events yet.</div>;
  }

  return (
    <div className="space-y-4">
      {sorted.map((m) => {
        const isSummary = m.metadata?.type === "summary";
        const ts = m.metadata?.ts
          ? new Date(m.metadata.ts).toLocaleString()
          : "—";
        const badge = isSummary
          ? "SUMMARY"
          : (m.metadata?.role || "SYSTEM").toUpperCase();

        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex gap-4"
          >
            {/* timeline rail */}
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full ${
                  isSummary ? "bg-yellow-400" : "bg-blue-400"
                }`}
              />
              <div className="w-px flex-1 bg-[#1e2b4a] mt-1" />
            </div>

            {/* card */}
            <Card
              className={`flex-1 p-4 border ${
                isSummary
                  ? "border-yellow-400/40 bg-[#15140b]"
                  : "border-[#1e2b4a] bg-[#071122]"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        isSummary
                          ? "bg-yellow-400/10 text-yellow-300"
                          : "bg-blue-400/5 text-blue-200"
                      }`}
                    >
                      {badge}
                    </span>
                    <span className="text-xs text-blue-400/60">{ts}</span>
                  </div>

                  <div className="text-blue-100 break-words whitespace-pre-wrap leading-relaxed">
                    {m.document}
                  </div>
                </div>

                {/* actions ONLY for summaries */}
                {isSummary ? (
                  <div className="flex flex-col items-end gap-2">

                    {/* show context */}
                    <Button
                      size="sm"
                      onClick={() => onShowContext(m)}
                      className="bg-[#132036] hover:bg-[#18314a] text-xs px-3"
                    >
                      Show context
                    </Button>

                    {/* rewrite */}
                    <Button
                      size="sm"
                      onClick={() => onRewrite(m)}
                      className="bg-[#20361b] hover:bg-[#294825] text-xs px-3"
                    >
                      Rewrite
                    </Button>

                    {/* delete (only if provided) */}
                    {onDelete && (
                      <Button
                        size="sm"
                        onClick={() => onDelete(m)}
                        className="bg-red-700/40 hover:bg-red-700 text-xs px-3"
                      >
                        Delete
                      </Button>
                    )}

                    {/* edit (only if provided) */}
                    {onEdit && (
                      <Button
                        size="sm"
                        onClick={() => onEdit(m)}
                        className="bg-yellow-600/30 hover:bg-yellow-600 text-xs px-3"
                      >
                        Edit
                      </Button>
                    )}

                  </div>
                ) : null}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

