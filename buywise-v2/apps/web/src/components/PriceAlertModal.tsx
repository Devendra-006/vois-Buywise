"use client";

import React, { useState } from "react";
import { ScoredProduct } from "@buywise/shared";
import { X, Bell, CheckCircle2 } from "lucide-react";

interface PriceAlertModalProps {
  product: ScoredProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState<number>(
    product ? Math.round(product.price * 0.9) : 0
  );
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || targetPrice <= 0) return;
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded bg-brand-green-light text-brand-green">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-xl text-ink">
            Set Price Drop Alert
          </h3>
        </div>

        <p className="text-xs text-ink-secondary mb-4">
          Receive an automated email alert when {product.title} hits your target price.
        </p>

        {submitted ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-brand-green mb-2" />
            <h4 className="font-bold text-base text-ink mb-1">Price Alert Configured!</h4>
            <p className="text-xs text-ink-secondary">
              We'll notify <strong className="text-ink">{email}</strong> as soon as the price falls to ₹{targetPrice.toLocaleString("en-IN")}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-ink block mb-1">
                Current Price on {product.store}:
              </label>
              <div className="p-2.5 rounded bg-background border border-border font-mono font-bold text-sm text-ink">
                ₹{product.price.toLocaleString("en-IN")}
              </div>
            </div>

            <div>
              <label className="font-medium text-ink block mb-1">
                Your Target Price (₹ INR):
              </label>
              <input
                type="number"
                required
                min="100"
                max={product.price}
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded bg-background border border-border font-mono font-bold text-sm text-brand-green focus:outline-none focus:border-ink"
              />
              <span className="text-[11px] text-ink-muted mt-0.5 block">
                Suggested 10% drop: ₹{Math.round(product.price * 0.9).toLocaleString("en-IN")}
              </span>
            </div>

            <div>
              <label className="font-medium text-ink block mb-1">
                Your Email Address:
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded bg-background border border-border text-ink focus:outline-none focus:border-ink text-sm"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-border rounded font-medium text-ink hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-green text-surface rounded font-medium hover:bg-brand-green/90 transition-colors shadow-sm"
              >
                Track Price
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
