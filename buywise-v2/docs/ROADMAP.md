# BuyWise Product Roadmap

This document outlines the evolutionary roadmap for BuyWise, tracking completed architecture rebuilds, upcoming feature releases, and long-term milestones.

---

## 🟢 Done (Full Rebuild v1.0)

- [x] **Monorepo Architecture**: Clean separation of `apps/web` (Next.js 14), `apps/api` (Node/Express/TypeScript), and `packages/shared` (Zod schemas & domain logic).
- [x] **Data Truthfulness (L1 Fix)**: Eliminated LLM-generated mock prices and ratings. All data is grounded in structured provider feeds or verified snapshots with store citations and fetch timestamps.
- [x] **Deterministic Smart Score (L4 Fix)**: Mathematical formula using Bayesian ratings, log-transformed review volumes, and dynamic weight redistribution.
- [x] **Top 3 Curated Picks**: Wirecutter-style picks for Best Overall, Best Budget, and Premium Choice.
- [x] **Price History & Verdict (L2 Fix)**: `price_snapshots` schema with 90-day median comparison and 5-point/14-day statistical threshold rules.
- [x] **Prompt Injection Defense (L11 Fix)**: Untrusted merchant titles and review snippets quarantined in `<untrusted_content>` tags with strict JSON schema validation.
- [x] **Security Hardening (L7, L12 Fix)**: Express rate limiters on search endpoints, Helmet HTTP security headers, and CORS allowlisting.
- [x] **Production Database (L16, L20 Fix)**: PostgreSQL via Drizzle ORM with fail-fast production startup validation.
- [x] **Warm Editorial UI Redesign (L30 Fix)**: Redesigned interface using warm off-white tones (`#FAF8F5`), ink typography, Fraunces serif headlines, and tabular Indian Rupee numerals (`₹`).
- [x] **Indian Retail Economics**: Curated instant bank card discounts (HDFC, ICICI, SBI) and 3/6-month No-Cost EMI calculations.
- [x] **DPDP Privacy Controls**: Clear data deletion controls in accordance with India's Digital Personal Data Protection Act.
- [x] **CI/CD Automation**: GitHub Actions workflows for continuous integration and scheduled price drop check crons.

---

## 🟡 Next (v1.1 - v1.2)

- [ ] **Multi-Category Expansion**: Expand beyond TWS Earbuds, Smartphones, and Laptops to Smart TVs, Smartwatches, and Air Conditioners.
- [ ] **Festive Sale Calendar Tracker**: Interactive visual countdown and price prediction guidance for major Indian sales (Amazon Great Indian Festival, Flipkart Big Billion Days).
- [ ] **Browser Extension (Lightweight)**: Chrome/Edge extension that displays the BuyWise Smart Score and Price History chart directly on Amazon and Flipkart product pages.
- [ ] **Offline PWA Service Worker**: Offline caching for saved wishlists and past search results on mobile devices.

---

## ⚪ Later (v2.0+)

- [ ] **Crowdsourced Price Snapshots**: Verified receipt/invoice upload for instant price verification.
- [ ] **Voice Search Integration**: Native Web Speech API integration for regional voice queries in Hindi and Tamil.
- [ ] **Direct Creator API Integration**: Direct integration with verified retailer affiliate APIs upon qualifying channel scaling.
