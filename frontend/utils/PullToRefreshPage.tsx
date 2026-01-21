'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const THRESHOLD = 80; // 당김 임계치(px)
const MAX_PULL = 140; // UI 최대 당김(px)
const MIN_LOADING_MS = 700; // 로딩 최소 노출 시간

interface PullToRefreshPageProps {
  triggerFunction: () => Promise<void>;
}

export default function PullToRefreshPage({ triggerFunction }: PullToRefreshPageProps) {
  const router = useRouter();

  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const triggered = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // 스크롤 최상단에서만 시작
      if (window.scrollY !== 0) return;

      startY.current = e.touches[0].clientY;
      pulling.current = true;
      triggered.current = false;
      setPullDistance(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || startY.current === null) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // 위로 밀면 무시
      if (diff <= 0) {
        setPullDistance(0);
        return;
      }

      // 당기는 동안 브라우저 기본 동작(상단 바운스/기본 새로고침) 방지
      e.preventDefault();

      // 감쇠 적용(당길수록 덜 늘어나게)
      const damped = Math.min(MAX_PULL, diff * 0.6);
      setPullDistance(damped);

      if (damped >= THRESHOLD && !triggered.current) {
        triggered.current = true;
        navigator.vibrate?.(10);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;

      pulling.current = false;

      // 임계치 미만이면 원상복귀
      if (pullDistance < THRESHOLD) {
        setPullDistance(0);
        startY.current = null;
        return;
      }

      // 임계치 이상이면 새로고침
      setIsLoading(true);

      const startedAt = Date.now();
      try {
        await triggerFunction();
        router.refresh(); // App Router 서버 컴포넌트 재요청
      } finally {
        // 로딩 너무 깜빡이지 않게 최소 시간 보장
        const elapsed = Date.now() - startedAt;
        const remain = Math.max(0, MIN_LOADING_MS - elapsed);

        window.setTimeout(() => {
          setIsLoading(false);
          setPullDistance(0);
          startY.current = null;
        }, remain);
      }
    };

    // passive: false 필수 (preventDefault 쓰려면)
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [router, pullDistance]);

  const ready = pullDistance >= THRESHOLD;

  return (<div
    style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 0,
        transform: `translateY(${pullDistance}px)`,
        transition: isLoading ? 'transform 120ms ease' : 'none',
        zIndex: 50,
        pointerEvents: 'none',
    }}
    className='md:hidden'
    >
    <div
        style={{
        margin: '0 auto',
        width: 220,
        height: 44,
        marginTop: 10,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.06)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 13,
        }}
    >
        {isLoading ? (
        <>
            <Spinner />
            <span>새로고침 중…</span>
        </>
        ) : (
        <>
            <Arrow rotated={ready} />
            <span>{ready ? '놓으면 새로고침' : '아래로 당겨 새로고침'}</span>
        </>
        )}
    </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-label="loading"
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '2px solid rgba(0,0,0,0.25)',
        borderTopColor: 'rgba(0,0,0,0.7)',
        display: 'inline-block',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

function Arrow({ rotated }: { rotated: boolean }) {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 120ms ease',
        fontSize: 16,
        opacity: 0.75,
      }}
    >
      ↓
    </span>
  );
}
