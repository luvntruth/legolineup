import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "The Play Company - Color & T Picker",
  description: "색상 순서와 T값을 제출하는 폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${plusJakartaSans.variable}`}>
      <body className="font-plus-jakarta antialiased bg-[#F8F9FA] text-[#1A1A1A]">{children}</body>
    </html>
  );
}
