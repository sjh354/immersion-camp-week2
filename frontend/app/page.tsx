'use client' // 클라이언트 사이드에서 작동한다는 선언
import { useEffect, useState } from 'react'

export default function Home() {
  const [data, setData] = useState({ message: '백엔드 응답 대기 중...' })

  useEffect(() => {
    // 백엔드 서버(5000번 포트)에 데이터를 달라고 요청합니다.
    // ※ 주의: 나중에는 localhost 대신 K-Cloud 실제 IP를 써야 할 수도 있습니다.
    fetch('http://192.168.0.196:3000')
      .then((res) => res.json())
      .then((result) => {
        setData(result)
      })
      .catch((err) => {
        console.error(err)
        setData({ message: '연결 실패 (서버가 꺼져있거나 방화벽 문제)' })
      })
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-500px items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">🎉 억빠 프로젝트 테스트</h1>
        <div className="p-10 border-2 border-dashed border-blue-500 rounded-xl bg-blue-50">
          <p className="text-xl text-center text-blue-800 font-semibold">
            {data.message}
          </p>
        </div>
      </div>
    </main>
  )
}