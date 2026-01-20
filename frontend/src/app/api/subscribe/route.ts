// src/app/api/subscribe/route.ts
import { NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __pushSubs: any[] | undefined;
}
global.__pushSubs = global.__pushSubs || [];

export async function POST(req: Request) {
  const sub = await req.json();

  // 아주 간단한 중복 제거(endpoint 기준)
  const endpoint = sub?.endpoint;
  if (!endpoint) return NextResponse.json({ ok: false, error: "no endpoint" }, { status: 400 });

  const exists = global.__pushSubs!.some((s) => s?.endpoint === endpoint);
  if (!exists) global.__pushSubs!.push(sub);

  return NextResponse.json({ ok: true, count: global.__pushSubs!.length }, { status: 201 });
}
