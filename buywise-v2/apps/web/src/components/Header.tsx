"use client";

import React from "react";
import Link from "next/link";
import { Compass, Heart, Bell, Globe } from "lucide-react";

interface HeaderProps {
  currentLang?: string;
  onLanguageChange?: (lang: string) => void;
  wishlistCount?: number;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang = "en",
  onLanguageChange,
  wishlistCount = 0,
  onOpenAlerts
}) => {
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी (Hindi)" },
    { code: "ta", label: "தமிழ் (Tamil)" },
    { code: "te", label: "తెలుగు (Telugu)" },
    { code: "bn", label: "বাংলা (Bengali)" },
    { code: "mr", label: "मराठी (Marathi)" }
  ];

  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-brand-green text-surface flex items-center justify-center font-serif font-bold text-lg shadow-sm">
            B
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-ink group-hover:text-brand-green transition-colors">
              BuyWise
            </span>
            <span className="text-[10px] tracking-wider uppercase text-ink-muted -mt-1 font-mono">
              Neutral Buying Guide
            </span>
          </div>
        </Link>

        {/* Right navigation utilities */}
        <div className="flex items-center gap-3 sm:gap-5 text-sm">
          {/* Currency indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded border border-border text-xs text-ink-secondary bg-background font-mono">
            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            <span>INR (₹) India</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 text-ink-secondary hover:text-ink">
            <Globe className="w-4 h-4 text-ink-muted" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange?.(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer py-1"
              aria-label="Select Language"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wishlist */}
          <Link
            href="/account#wishlist"
            className="flex items-center gap-1.5 text-ink-secondary hover:text-ink transition-colors relative py-1"
            title="Wishlist"
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Saved</span>
            {wishlistCount > 0 && (
              <span className="bg-brand-green text-surface text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Price Alerts */}
          <button
            onClick={onOpenAlerts}
            className="flex items-center gap-1.5 text-ink-secondary hover:text-ink transition-colors text-xs font-medium py-1"
            title="Price Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </button>
        </div>
      </div>
    </header>
  );
};
