// components/PushEnableButton.tsx
"use client";

import { useState } from "react";
import { urlBase64ToUint8Array } from "@/utils/base64";

export default function PushEnableButton() {
  const [status, setStatus] = useState<string>("");

  const enablePush = async () => {
    try {
      setStatus("권한 요청 중...");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("알림 권한이 거부됨");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        setStatus("이 브라우저는 Service Worker를 지원하지 않음");
        return;
      }

      const reg = await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setStatus("NEXT_PUBLIC_VAPID_PUBLIC_KEY 누락");
        return;
      }

      setStatus("구독 생성 중...");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      setStatus("서버에 구독 저장 중...");
      const res = await fetch("/api/subscribe", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`subscribe api failed: ${res.status} ${text}`);
      }

      setStatus("✅ 푸시 알림 설정 완료");
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ 실패: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div>
      <button
        onClick={enablePush}
        style={{
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid #ddd",
        }}
      >
        푸시 알림 켜기
      </button>
      {status ? <p style={{ marginTop: 8 }}>{status}</p> : null}
    </div>
  );
}
