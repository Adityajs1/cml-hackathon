import { db } from "../memory-server/db.js";
import { chroma } from "@/lib/chroma";
import { embedText } from "@/lib/embedding";
import { classifyImportance } from "@/lib/memoryClassifier";

export type ExtractionResult = {
  store: boolean;
  importance_score?: number;
  category?: string;
  reason?: string;
  memoryRow?: any;
};

/**
 * Decide whether to store a piece of text as a memory.
 * - Runs LLM classifier
 * - Applies "do_not_store" heuristics (private fields, ephemeral messages)
 * - If store=true, inserts into local DB + chroma and returns the created row
 */
export async function autoStoreMemoryIfNeeded(opts: {
  text: string;
  user_id: string;
  source?: string; // e.g. "chat", "upload", "import"
  forceStore?: boolean; // bypass heuristics
}): Promise<ExtractionResult> {
  const { text, user_id, source = "chat", forceStore = false } = opts;
  void source;

  // quick guard: blank or extremely short messages are transient
  if (!text || text.trim().length < 6) {
    return { store: false, reason: "too short" };
  }

  // run classifier
  const cls = await classifyImportance(text);

  // policy heuristics: don't store private tokens / credentials
  const privatePatterns = [/password\s*[:=]/i, /ssn/i, /passport/i, /credit card/i, /otp/i];
  if (privatePatterns.some(rx => rx.test(text))) {
    return { store: false, reason: "contains private sensitive pattern", category: "private" };
  }

  // if category is transient and low importance, skip unless forced
  if (!forceStore && (cls.category === "transient" || cls.importance_score < 0.1)) {
    return { store: false, importance_score: cls.importance_score, category: cls.category, reason: "low importance" };
  }

  // otherwise store
  const embedding = await embedText(text);

  // insert into local DB
  const memoryRow = db.insertMemory({
    user_id,
    text,
    embedding,
    importance_score: cls.importance_score ?? 0,
    pinned: false,
    do_not_store_again: false,
  });

  // insert into chroma
  try {
    const collection = await chroma.getOrCreateCollection({ name: "memories" });
    await collection.add({
      ids: [String(memoryRow.id)],
      embeddings: [embedding],
      documents: [text],
      metadatas: [{ memory_id: memoryRow.id, user_id }]
    });
  } catch (e) {
    console.error("autoStore: chroma insert failed", e);
    // continue; DB row exists — you might want to retry chroma sync later
  }

  return { store: true, importance_score: cls.importance_score, category: cls.category, reason: cls.reason, memoryRow };
}
