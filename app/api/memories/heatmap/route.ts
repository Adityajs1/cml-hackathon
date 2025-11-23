import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseClient";
import { embedText } from "@/lib/embedding";
import { chroma } from "@/lib/chroma";
import { classifyImportance } from "@/lib/memoryClassifier";

export async function POST(req: Request) {
  const supabase = createClient();
  const { text, user_id } = await req.json();

  if (!text || !user_id) {
    return NextResponse.json(
      { error: "text and user_id are required." },
      { status: 400 }
    );
  }

  try {
    // 1️⃣ EMBEDDING (Gemini Embedding 004 - 768 dims)
    const embedding = await embedText(text);

    // 2️⃣ CLASSIFY IMPORTANCE (0–1 + category)
    const importance = await classifyImportance(text);

    // 3️⃣ INSERT INTO SUPABASE
    const { data: memory, error } = await supabase
      .from("memories")
      .insert({
        text,
        user_id,
        embedding,
        importance_score: importance.importance_score,
        pinned: false,
        do_not_store_again: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Supabase insertion failed" },
        { status: 500 }
      );
    }

    // 4️⃣ INSERT INTO CHROMA VECTOR STORE
    try {
      const collection = await chroma.getOrCreateCollection({
        name: "memories",
      });

      await collection.add({
        ids: [String(memory.id)],
        embeddings: [embedding],
        documents: [text],
        metadatas: [
          {
            memory_id: memory.id,
            user_id,
            importance_score: importance.importance_score,
            category: importance.category,
          },
        ],
      });
    } catch (chromaError) {
      console.error("Chroma insert error:", chromaError);
      // Memory still exists in Supabase; do not break request
    }

    return NextResponse.json(
      {
        success: true,
        memory,
        importance: importance.importance_score,
        category: importance.category,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Memory creation error:", err);
    return NextResponse.json(
      { error: "Memory creation failed" },
      { status: 500 }
    );
  }
}

