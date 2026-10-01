import type { Metadata } from "next";

import { inter } from "@/app/fonts";
import "./globals.css";

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
