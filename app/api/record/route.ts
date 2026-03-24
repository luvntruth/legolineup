import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertRecord, deleteRecord, updateRecord, getRange } from "@/lib/db";

const recordSchema = z.object({
  id: z.number().int(),
  record: z.string().min(1),
});

const deleteSchema = z.object({
  id: z.number().int(),
  recordIndex: z.number().int().min(0),
});

const updateSchema = z.object({
  id: z.number().int(),
  recordIndex: z.number().int().min(0),
  record: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = recordSchema.parse(json);
    const { min, max } = getRange();
    if (parsed.id < min || parsed.id > max) {
      return NextResponse.json({ error: `ID는 ${min}~${max} 범위만 허용됩니다.` }, { status: 400 });
    }
    const saved = await upsertRecord(parsed.id, parsed.record);
    return NextResponse.json({ ok: true, submission: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const json = await req.json();
    const parsed = deleteSchema.parse(json);
    await deleteRecord(parsed.id, parsed.recordIndex);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid payload" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const json = await req.json();
    const parsed = updateSchema.parse(json);
    await updateRecord(parsed.id, parsed.recordIndex, parsed.record);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid payload" }, { status: 400 });
  }
}
