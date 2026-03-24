import { NextResponse } from "next/server";
import { z } from "zod";
import { updateSubmissionData, getRange } from "@/lib/db";

const patchSchema = z.object({
  id: z.number().int(),
  colors: z.array(z.string()).length(5).optional(),
  tValue: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    const json = await req.json();
    const parsed = patchSchema.parse(json);
    const { min, max } = getRange();
    if (parsed.id < min || parsed.id > max) {
      return NextResponse.json({ error: `ID는 ${min}~${max} 범위만 허용됩니다.` }, { status: 400 });
    }
    await updateSubmissionData(parsed.id, parsed.colors, parsed.tValue);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid payload" }, { status: 400 });
  }
}
