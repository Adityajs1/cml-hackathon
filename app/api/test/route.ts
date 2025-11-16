import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  return NextResponse.json({ data, error });
}
