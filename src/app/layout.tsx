import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TRANSOPT AI — Public Transport Intelligence Platform",
  description: "AI-Powered Dynamic Public Transport Intelligence & Optimization Platform. Predict, Simulate, Optimize, Explain, Act.",
  keywords: ["transport", "AI", "optimization", "public transport", "simulation", "digital twin"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 font-[var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
