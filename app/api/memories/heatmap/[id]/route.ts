import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { chroma } from "@/lib/chroma";
import { embedText } from "@/lib/embedding";

export async function PATCH(req: Request, { params }: any) {

  const id = params.id;
  const body = await req.json();

  let updateData: any = {};

  // 1️⃣ If text changed → re-embed it
  if (body.text) {
    updateData.text = body.text;
    updateData.embedding = await embedText(body.text);
  }

  // 2️⃣ pinned toggle
  if (body.pinned !== undefined) {
    updateData.pinned = body.pinned;
  }

  // 3️⃣ "do not store again" flag
  if (body.do_not_store_again !== undefined) {
    updateData.do_not_store_again = body.do_not_store_again;
  }

  updateData.updated_at = new Date().toISOString();

  // 4️⃣ Update Supabase record
  const { error } = await supabase
    .from("memories")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json(
      { error: "Memory update failed" },
      { status: 500 }
    );
  }

  // 5️⃣ Update Chroma (only if embedding or text changed)
  if (body.text) {
    try {
      const collection = await chroma.getOrCreateCollection({
        name: "memories",
      });

      await collection.update({
        ids: [String(id)],
        embeddings: [updateData.embedding],
        documents: [updateData.text],
      });
    } catch (chromaError) {
      console.error("Chroma update failed:", chromaError);
      // memory still exists in Supabase → don't fail the request
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: any) {

  const id = params.id;

  // 1️⃣ Delete from Supabase
  await supabase.from("memories").delete().eq("id", id);

  // 2️⃣ Delete from Chroma
  try {
    const collection = await chroma.getOrCreateCollection({
      name: "memories",
    });

    await collection.delete({
      ids: [String(id)],
    });
  } catch (err) {
    console.error("Chroma delete failure:", err);
  }

  return NextResponse.json({ success: true });
}
