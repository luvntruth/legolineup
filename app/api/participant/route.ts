import { NextResponse } from "next/server";
import { getSubmission, getRange } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idStr = searchParams.get("id");
  const range = getRange();
  if (!idStr) return NextResponse.json({ error: "id required" }, { status: 400 });
  const id = Number(idStr);
  if (Number.isNaN(id) || id < range.min || id > range.max) {
    return NextResponse.json({ error: `ID must be ${range.min}~${range.max}` }, { status: 400 });
  }
  const data = getSubmission(id);
  return NextResponse.json({ range, submission: data ?? null });
}
