import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "억빠를 부탁해",
  description: "무조건 편들어주고 억지로라도 응원해주는 재미있는 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
