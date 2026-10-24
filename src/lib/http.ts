import { NextResponse } from "next/server";

export function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Parses a JSON body; malformed JSON is a client error (BUG-05), not a 500. */
export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}
