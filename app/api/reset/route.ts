import { NextResponse } from "next/server";
import { clearAllSubmissions } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await clearAllSubmissions();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to clear database" }, { status: 500 });
  }
}
