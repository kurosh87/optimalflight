import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "FlightOptima - Smart Flight Search with Jetlag Optimization",
  description: "Find the best flights optimized for your health and schedule. Visual route planning with circadian rhythm optimization.",
  keywords: ["flight search", "route planning", "jetlag optimization", "business travel", "flight comparison"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
