import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
        <PostHogProvider>
          <Header />
          <main>
            {children}
          </main>
        </PostHogProvider>

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />
      </body>

      {/* Google Analytics 4 */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
