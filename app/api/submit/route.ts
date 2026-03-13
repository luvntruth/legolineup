import { NextResponse } from "next/server";
import { z } from "zod";
import { COLORS, T_VALUES } from "@/lib/constants";
import { upsertSubmission, getRange } from "@/lib/db";

const bodySchema = z.object({
  id: z.number().int(),
  colors: z.array(z.enum(COLORS as unknown as [string, ...string[]])).length(5),
  tValue: z.enum(T_VALUES as unknown as [string, ...string[]]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    const { min, max } = getRange();
    if (parsed.id < min || parsed.id > max) {
      return NextResponse.json({ error: `ID는 ${min}~${max} 범위만 허용됩니다.` }, { status: 400 });
    }
    const saved = await upsertSubmission(parsed.id, parsed.colors, parsed.tValue);
    return NextResponse.json({ ok: true, submission: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Invalid payload" }, { status: 400 });
  }
}
