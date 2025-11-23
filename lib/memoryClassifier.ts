// lib/memoryClassifier.ts
import { generateText } from "./gemini";

/**
 * Result returned by classifyImportance
 */
export type ImportanceResult = {
  importance_score: number;   // 0..1
  category: string;           // e.g. "preference|fact|task|transient|private"
  reason?: string;            // short justification
};

/**
 * Classify the importance of a memory text using Gemini.
 * Returns a stable JSON-parsed object with safe fallbacks.
 */
export async function classifyImportance(text: string): Promise<ImportanceResult> {
  const prompt = `
You are an assistant that rates how important a short text should be for long-term memory.
Return a single JSON object ONLY with keys:
- importance_score (number between 0 and 1)
- category (one of: preference, fact, task, idea, transient, private, other)
- reason (short text <= 140 chars)

Example output:
{"importance_score":0.78,"category":"preference","reason":"User's long-term preference about UI" }

Now evaluate the following text (do not include any other commentary):

"${text.replace(/\n/g, "\\n")}"
`;

  try {
    const raw = await generateText(prompt);
    // Try to parse JSON from LLM output
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

    const importance_score = clampNumber(parsed.importance_score, 0, 1);
    const category =
      typeof parsed.category === "string" ? parsed.category : "other";
    const reason =
      typeof parsed.reason === "string" ? parsed.reason : "";

    return { importance_score, category, reason };
  } catch (err) {
    // fallback heuristics if LLM fails
    const fallback = heuristicImportance(text);
    return {
      importance_score: fallback.score,
      category: fallback.category,
      reason: "fallback heuristic"
    };
  }
}

/* ----------------- Helpers ----------------- */

function clampNumber(n: any, lo = 0, hi = 1) {
  const v = Number(n);
  if (Number.isFinite(v)) return Math.max(lo, Math.min(hi, v));
  return lo;
}

/**
 * Fallback heuristic:
 * - longer texts and presence of personal keywords -> higher score
 */
function heuristicImportance(text: string) {
  const len = text.trim().length;
  const keywords = ["project", "remember", "important", "preference", "goal", "birthday", "email", "password", "address"];
  const keywordHits = keywords.reduce((s, k) => s + (text.toLowerCase().includes(k) ? 1 : 0), 0);
  const score = Math.min(1, Math.max(0, (Math.log10(Math.max(1, len)) - 0.5) * 0.35 + keywordHits * 0.2));
  const category = keywordHits > 0 ? "fact" : (len < 30 ? "transient" : "idea");
  return { score: parseFloat(score.toFixed(2)), category };
}

