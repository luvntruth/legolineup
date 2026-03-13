import { NextResponse } from "next/server";
import { getAllSubmissions, getRange, getSettings } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const range = getRange();
  const list = await getAllSubmissions();
  const settings = await getSettings();
  return NextResponse.json({ range, submissions: list, settings });
}
