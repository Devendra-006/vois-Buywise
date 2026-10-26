"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "../../components/Header";
import { Heart, Bell, Trash2, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import earbudsFixtures from "../../../../../fixtures/earbuds.json";

export default function AccountPage() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; targetPrice: number; store: string }>>([
    {
      id: "a1",
      title: "OnePlus Nord Buds 2 TWS Earbuds",
      targetPrice: 2200,
      store: "Amazon India"
    }
  ]);
  const [deletedMsg, setDeletedMsg] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("buywise_wishlist");
      if (saved) {
        setWishlistIds(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleRemoveWishlist = (id: string) => {
    const next = wishlistIds.filter(item => item !== id);
    setWishlistIds(next);
    localStorage.setItem("buywise_wishlist", JSON.stringify(next));
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleDeleteAllData = () => {
    if (confirm("Are you sure you want to delete all saved data, search history, and alerts? This cannot be undone.")) {
      localStorage.clear();
      setWishlistIds([]);
      setAlerts([]);
      setDeletedMsg(true);
      setTimeout(() => setDeletedMsg(false), 4000);
    }
  };

  const allProducts: any[] = earbudsFixtures;
  const wishlistedProducts = allProducts.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-background">
      <Header wishlistCount={wishlistIds.length} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink transition-colors font-medium mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Link>
          <h1 className="font-serif font-bold text-3xl text-ink">
            Account, Wishlist & Preferences
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Manage your tracked products, price alerts, and personal data privacy
          </p>
        </div>

        {deletedMsg && (
          <div className="p-4 mb-6 rounded bg-brand-green-light border border-brand-green/30 text-xs text-brand-green flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All local data, cache, and preferences have been permanently deleted.</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Wishlist Section */}
          <section id="wishlist" className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
              <Heart className="w-5 h-5 text-brand-green" />
              <h2 className="font-serif font-bold text-xl text-ink">
                Saved Wishlist ({wishlistedProducts.length})
              </h2>
            </div>

            {wishlistedProducts.length === 0 ? (
              <p className="text-xs text-ink-muted py-4 italic">
                Your wishlist is empty. Click the heart icon on any product recommendation to save it here.
              </p>
            ) : (
              <div className="divide-y divide-border text-xs">
                {wishlistedProducts.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-12 h-12 object-contain rounded bg-background p-1 border border-border"
                      />
                      <div>
                        <span className="font-medium text-ink block line-clamp-1">{p.title}</span>
                        <span className="text-[11px] text-ink-muted">
                          {p.store} &bull; Rating: {p.rating}★
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-ink">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => handleRemoveWishlist(p.id)}
                        className="p-1.5 text-ink-muted hover:text-brand-red transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Price Alerts Section */}
          <section className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
              <Bell className="w-5 h-5 text-brand-green" />
              <h2 className="font-serif font-bold text-xl text-ink">
                Active Price Alerts ({alerts.length})
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              {alerts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded bg-background border border-border">
                  <div>
                    <span className="font-semibold text-ink block">{a.title}</span>
                    <span className="text-[11px] text-ink-muted">
                      Target: ₹{a.targetPrice.toLocaleString("en-IN")} &bull; {a.store}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAlert(a.id)}
                    className="p-1.5 text-ink-muted hover:text-brand-red transition-colors"
                    title="Cancel Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy & Data Deletion */}
          <section id="privacy" className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
              <ShieldCheck className="w-5 h-5 text-ink-secondary" />
              <h2 className="font-serif font-bold text-xl text-ink">
                DPDP Privacy Controls
              </h2>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              In accordance with India's Digital Personal Data Protection Act, you have complete control over your stored history, alerts, and preferences. You may permanently purge all information at any time.
            </p>

            <button
              onClick={handleDeleteAllData}
              className="px-4 py-2 bg-brand-red-light text-brand-red border border-brand-red/30 rounded text-xs font-semibold hover:bg-brand-red hover:text-surface transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Account & All Stored Data</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
