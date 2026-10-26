import type { Metadata, Viewport } from "next";
import "./globals.css";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "BuyWise – Explainable AI Shopping Guide for India",
  description: "Neutral, cross-store buying assistant for Indian e-commerce. Transparent Smart Score, price trend verdicts, and side-by-side comparisons across Amazon, Flipkart, and Croma.",
  keywords: ["buying assistant", "india ecommerce", "price tracker", "gadget reviews", "compare earbuds", "compare smartphones"],
  authors: [{ name: "BuyWise Team" }],
  openGraph: {
    title: "BuyWise – Neutral Buying Assistant for Indian Shoppers",
    description: "Make confident buying decisions with transparent Smart Scores, price history verdicts, and zero invented data.",
    type: "website",
    locale: "en_IN"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-ink antialiased">
        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-border bg-surface mt-16 py-8 text-xs text-ink-secondary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span className="font-serif font-bold text-sm text-ink">BuyWise Shopping Intelligence</span>
              <p className="text-[11px] text-ink-muted text-center sm:text-left max-w-md">
                Neutral, cross-store editorial guide. Prices and review counts are recorded from genuine Indian retail snapshots with timestamp transparency.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-ink-secondary">
              <a href="/account#privacy" className="hover:text-ink transition-colors">Privacy & Data</a>
              <span>&bull;</span>
              <span className="text-ink-muted">Affiliate Disclosure: Outbound links marked sponsored</span>
              <span>&bull;</span>
              <span className="font-mono text-brand-green">100% Open Algorithm</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
