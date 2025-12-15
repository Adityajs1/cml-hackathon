import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { embedText } from "@/lib/embedding";
import { chroma } from "@/lib/chroma";
import { generateText } from "@/lib/gemini";

export async function POST(req: Request) {

  const { ids, user_id } = await req.json();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] is required" }, { status: 400 });
  }

  try {
    // 1️⃣ Fetch memories
    const { data: memories } = await supabase
      .from("memories")
      .select("id, text")
      .in("id", ids);

    if (!memories || memories.length === 0) {
      return NextResponse.json({ error: "No memories found" }, { status: 404 });
    }

    // 2️⃣ Merge using LLM
    const mergePrompt = `
Merge the following memory texts into 1 clean, concise memory.
Do NOT add new information.

Memories:
${memories.map((m) => `- ${m.text}`).join("\n")}
    `;

    const mergedText = await generateText(mergePrompt);

    // 3️⃣ Embed merged text
    const mergedEmbedding = await embedText(mergedText);

    // 4️⃣ Insert merged record into Supabase
    const { data: newMem, error: supaError } = await supabase
      .from("memories")
      .insert({
        text: mergedText,
        user_id,
        embedding: mergedEmbedding,
        importance_score: 0.5, // mid importance
        pinned: false,
        do_not_store_again: false
      })
      .select()
      .single();

    if (supaError) {
      console.error("Supabase insert error:", supaError);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    // 5️⃣ Insert into Chroma
    try {
      const collection = await chroma.getOrCreateCollection({ name: "memories" });

      await collection.add({
        ids: [String(newMem.id)],
        embeddings: [mergedEmbedding],
        documents: [mergedText],
        metadatas: [{ memory_id: newMem.id, user_id }]
      });
    } catch (e) {
      console.error("Chroma error:", e);
    }

    // 6️⃣ Delete old memories
    await supabase.from("memories").delete().in("id", ids);

    try {
      const collection = await chroma.getOrCreateCollection({ name: "memories" });
      await collection.delete({ ids: ids.map(String) });
    } catch (e) {
      console.error("Chroma delete failed:", e);
    }

    return NextResponse.json({
      success: true,
      new_memory: newMem,
    });
  } catch (err) {
    console.error("Merge failed:", err);
    return NextResponse.json({ error: "Merge failed" }, { status: 500 });
  }
}

