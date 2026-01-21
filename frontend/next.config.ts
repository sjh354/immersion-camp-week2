import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '',  // 필요 시 추가
  assetPrefix: '',  // 필요 시 추가
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,  // 환경 변수 강제 전달
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:80/api/:path*',
      },
    ];
  },
};

export default nextConfig;
