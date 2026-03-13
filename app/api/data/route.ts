import { NextResponse } from "next/server";
import { getAllSubmissions, getRange } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const range = getRange();
  const list = await getAllSubmissions();
  return NextResponse.json({ range, submissions: list });
}
