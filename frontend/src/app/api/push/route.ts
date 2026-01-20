// src/app/api/push/route.ts
import { NextResponse } from "next/server";
import webpush from "web-push";

declare global {
  // eslint-disable-next-line no-var
  var __pushSubs: any[] | undefined;
}

function ensureEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const VAPID_PUBLIC_KEY = ensureEnv("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = ensureEnv("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const payload = {
    title: body?.title ?? "테스트 알림",
    body: body?.body ?? "푸시가 도착했어요!",
    url: body?.url ?? "/",
  };

  const subs = global.__pushSubs || [];
  if (subs.length === 0) {
    return NextResponse.json({ ok: false, error: "no subscriptions" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification(s, JSON.stringify(payload)))
  );

  // 만료된 구독 정리(410 Gone 등)
  const alive: any[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") alive.push(subs[i]);
    else {
      const code = (r.reason && (r.reason.statusCode || r.reason.status)) ?? null;
      if (code !== 410 && code !== 404) alive.push(subs[i]); // 그 외는 일단 유지
    }
  });
  global.__pushSubs = alive;

  return NextResponse.json({
    ok: true,
    sent: results.length,
    alive: alive.length,
    results: results.map((r) => (r.status === "fulfilled" ? "ok" : "fail")),
  });
}
