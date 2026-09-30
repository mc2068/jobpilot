import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // The designs use Inter's optical sizes, which tighten large text
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "JobPilot",
  description:
    "JobPilot finds the jobs, researches the companies, and gives you everything you need to stand out.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
