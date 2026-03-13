import { NextResponse } from "next/server";
import { getAllSubmissions, getRange } from "@/lib/db";

export async function GET() {
  const range = getRange();
  const list = await getAllSubmissions();
  return NextResponse.json({ range, submissions: list });
}
