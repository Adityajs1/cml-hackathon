import { NextResponse } from "next/server";
import { db } from "../../../memory-server/db.js";

export async function GET() {
  const users = db.getUsers();
  return NextResponse.json({ ok: true, status: "Local DB Online", totalUsers: users.length });
}
