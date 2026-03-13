import { NextResponse } from "next/server";
import { updateSettings } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { isTurnEntryEnabled } = await req.json();
    if (typeof isTurnEntryEnabled !== "boolean") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await updateSettings(isTurnEntryEnabled);
    return NextResponse.json({ ok: true, isTurnEntryEnabled });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error" }, { status: 400 });
  }
}
