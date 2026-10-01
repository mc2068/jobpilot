import { Inter } from "next/font/google";

// Shared by the root layout and global-error, which renders its own document.
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // The designs use Inter's optical sizes, which tighten large text
  axes: ["opsz"],
});
