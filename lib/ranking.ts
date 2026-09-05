// lib/ranking.ts
export type MemoryRow = {
  id: number;
  text: string;
  embedding: number[];            // vector embedding array
  created_at: string | Date;
  updated_at?: string | Date;
  importance_score?: number;
  pinned?: boolean;
  user_id?: string;
  [k: string]: any;
};

export type RankedMemory = MemoryRow & { score: number };

/**
 * rankMemories - returns the memories sorted descending by computed score
 * Weights:
 *  - similarity: 0.45
 *  - recency:     0.25
 *  - importance:  0.2
 *  - pinned:      0.1
 *
 * Tune weights to suit your product. Similarity uses cosine similarity.
 */
export function rankMemories(queryEmbedding: number[], memories: MemoryRow[], opts?: { similarityWeight?: number, recencyWeight?: number, importanceWeight?: number, pinnedWeight?: number }): RankedMemory[] {
  const w = {
    similarityWeight: opts?.similarityWeight ?? 0.45,
    recencyWeight: opts?.recencyWeight ?? 0.25,
    importanceWeight: opts?.importanceWeight ?? 0.20,
    pinnedWeight: opts?.pinnedWeight ?? 0.10,
  };

  const simNormFactor = 1.0; // cosine already -1..1 but embeddings should be non-negative cosine ~ 0..1 for typical models

  return memories
    .map(m => {
      const similarity = safeCosine(queryEmbedding, m.embedding || []);
      const days = daysSince(m.created_at);
      const recency = Math.exp(-days / 30); // 30-day decay
      const importance = typeof m.importance_score === "number" ? clamp(m.importance_score, 0, 1) : 0;
      const pinned = m.pinned ? 1 : 0;

      const score =
        w.similarityWeight * (similarity * simNormFactor) +
        w.recencyWeight * recency +
        w.importanceWeight * importance +
        w.pinnedWeight * pinned;

      return { ...(m as MemoryRow), score };
    })
    .sort((a, b) => b.score - a.score);
}

/* ---------- Helpers ---------- */

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += a[i] * b[i];
  return s;
}
function mag(a: number[]) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}

function safeCosine(a: number[], b: number[]) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return 0;
  const d = dot(a, b);
  const ma = mag(a) || 1e-9;
  const mb = mag(b) || 1e-9;
  const val = d / (ma * mb);
  // normalize to 0..1 range (cosine can be -1..1). Typically embeddings produce >0 similarity.
  return (val + 1) / 2;
}

function daysSince(date: string | Date) {
  const ts = typeof date === "string" ? Date.parse(date) : (date as Date).getTime();
  return Math.max(0, (Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

