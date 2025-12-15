import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { embedText } from "@/lib/embedding";
import { chroma } from "@/lib/chroma";
import { rankMemories } from "@/lib/ranking";
import { generateText } from "@/lib/gemini";
import { autoStoreMemoryIfNeeded } from "@/lib/autoMemoryExtraction";

export async function POST(req: Request) {

  const { message, user_id } = await req.json();

  if (!message || !user_id) {
    return NextResponse.json(
      { error: "message and user_id required" },
      { status: 400 }
    );
  }

  try {
    // 1️⃣ Embed user query
    const queryEmbedding = await embedText(message);

    // 2️⃣ Chroma semantic search
    const collection = await chroma.getOrCreateCollection({ name: "memories" });

    const chromaResults = await collection.query({
      nResults: 15,
      queryEmbeddings: [queryEmbedding],
      where: { user_id }
    });

    // Extract Supabase memory IDs
    const memoryIds = chromaResults.metadatas?.[0]?.map((m: any) => m.memory_id) || [];

    // 3️⃣ Fetch memory rows
    let memories: any[] = [];
    if (memoryIds.length > 0) {
      const { data } = await supabase
        .from("memories")
        .select("*")
        .in("id", memoryIds);
      memories = data || [];
    }

    // 4️⃣ Rank memories
    const ranked = rankMemories(queryEmbedding, memories);
    const topContext = ranked.slice(0, 6);

    // 5️⃣ Build context string
    const contextString = topContext
      .map((m) => `• ${m.text}  (importance: ${m.importance_score})`)
      .join("\n");

    const prompt = `
You are an AI assistant with long-term memory.
Use the context below to answer naturally.

User Memory Context:
${contextString}

User Query:
"${message}"
`;

    // 6️⃣ Call Gemini
    const aiResponse = await generateText(prompt);

    // 7️⃣ Auto-store the user message (optional)
    await autoStoreMemoryIfNeeded({ text: message, user_id });

    return NextResponse.json({
      success: true,
      response: aiResponse,
      used_memories: topContext,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Chat processing failed" },
      { status: 500 }
    );
  }
}
