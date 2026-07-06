import "./globals.css";

export const metadata = {
  title: "얌미의 실시간 공유 캘린더",
  description: "우리만의 귀여운 연보라 달력",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-white flex flex-col">{children}</body>
    </html>
  );
}