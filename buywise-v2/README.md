# BuyWise 🛍️

> **Explainable, Neutral Shopping Intelligence for Indian E-Commerce.**  
> Cut through marketplace noise, sponsored rankings, and fake discounts with transparent Smart Scores, price history verdicts, and Wirecutter-style editorial reasoning.

[![CI](https://github.com/Devendra-006/vois-Buywise/actions/workflows/ci.yml/badge.svg)](https://github.com/Devendra-006/vois-Buywise/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem BuyWise Solves

When shopping online in India, consumers face severe **decision fatigue**:
- **Incentive Bias**: Marketplaces prioritize products that pay high ad fees or carry higher margins, not what is genuinely best for the buyer.
- **Inflated "Discounts"**: A product claiming "70% OFF" was often artificially marked up days prior.
- **Review Overload**: Thousands of generic, unhelpful, or low-quality reviews make it exhausting to discern true product flaws.
- **Spec Complexity**: Comparing earbuds, smartphones, and laptops across different platforms is fragmented and frustrating.

**BuyWise provides a trusted, neutral buying guide**:
1. **Truth in Data**: All prices, ratings, and specs are grounded in real, timestamped snapshots from Amazon India, Flipkart, and Croma—never hallucinated by an LLM.
2. **Deterministic Smart Score (0–100)**: Transparent open-source algorithm utilizing Bayesian rating smoothing, review volume scaling, and seller trust.
3. **Price History Verdict**: Evaluates 90-day median price trajectory to give an honest **"Buy Now"**, **"Fair Price"**, or **"Wait for Deal"** recommendation.
4. **Editorial Top 3 Picks**: One clear **Best Overall** recommendation, plus **Best Budget** and **Premium Choice** options with explicit trade-offs.
5. **India Price Realities**: Instant bank card discount calculations (HDFC, ICICI, SBI) and 3/6-month No-Cost EMI math.

---

## Architecture Overview

```
Browser (Next.js 14 App Router, Vercel)
   │  HTTPS / SSE Progress Streaming
   ▼
API Backend (Node 22, Express, TypeScript, Docker)
   ├── Security: Helmet, CORS allowlist, Rate Limiters, Prompt Injection Shields
   ├── Multi-Agent Pipeline:
   │      1. Query Parser Agent  ──> Extract category, budget, must-have specs
   │      2. Product Retrieval   ──> SerpAPI Google Shopping (gl=in) or verified fixtures
   │      3. Parallel Analysis   ──> Review Intelligence ∥ Price Snapshots
   │      4. Scoring Engine      ──> Deterministic Smart Score in TypeScript
   │      5. Top 3 Picker        ──> Best Overall, Budget, Premium
   │      6. Explainer Agent     ──> Wirecutter-style trade-offs & summary
   ├── PostgreSQL (Neon / Supabase) via Drizzle ORM
   ├── Cache: Upstash Redis / Memory TTL
   └── Scheduled Alerts: Daily cron ──> Resend Email Dispatcher
```

For complete architectural details, see [docs/architecture.md](docs/architecture.md).

---

## Monorepo Project Structure

```
buywise/
├── apps/
│   ├── web/                     # Next.js 14 App Router frontend (Tailwind CSS, Recharts)
│   └── api/                     # Express 4 + TypeScript recommendation API
├── packages/
│   └── shared/                  # Shared Zod schemas, TypeScript types & scoring logic
├── fixtures/                    # Real snapshots (Earbuds, Smartphones, Laptops, 90d History)
├── docs/
│   ├── architecture.md          # System architecture, scoring math & security model
│   ├── ROADMAP.md               # Product roadmap (Done / Next / Later)
│   ├── DEPLOY.md                # Cloud deployment guide (Vercel, Render, Neon)
│   └── legacy/                  # Archived previous documentation
├── .github/workflows/           # CI test/build & scheduled price-check crons
├── Dockerfile                   # Production multi-stage container
├── docker-compose.yml           # Local dev PostgreSQL & Redis
├── .env.example                 # Environment configuration template
└── package.json                 # Monorepo workspaces definition
```

---

## Quickstart (Local Development)

### Prerequisites
- Node.js `20.x` or `22.x`
- npm `10.x` or `11.x`
- Docker (optional, for local PostgreSQL/Redis)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Devendra-006/vois-Buywise.git
cd vois-Buywise
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(By default, `DEMO_MODE=true` is enabled, allowing full local execution with verified real fixtures without requiring paid API keys!)*

### 3. Run Development Servers
```bash
npm run dev
```
- **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Backend**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/healthz](http://localhost:4000/healthz)

---

## Running Tests & Typechecks

```bash
# Typecheck all packages
npm run typecheck

# Run unit tests
npm run test

# Build production bundles
npm run build
```

---

## API Surface

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/search` | Execute recommendation pipeline (JSON response) |
| `GET` | `/v1/search/stream` | Real-time Server-Sent Events (SSE) pipeline progress |
| `GET` | `/v1/products/:id` | Product detail, price history snapshots, and verdict |
| `GET` | `/v1/products?ids=...`| Side-by-side comparison matrix |
| `POST` | `/v1/auth/register` | Register user account with bcrypt password hashing |
| `POST` | `/v1/auth/login` | Authenticate user and issue JWT token |
| `GET/POST/DELETE` | `/v1/wishlist` | Authenticated user wishlist CRUD |
| `GET/POST/DELETE` | `/v1/alerts` | Authenticated price drop alert subscriptions |
| `POST` | `/internal/price-check`| Scheduled cron worker (Protected by `x-cron-secret`) |
| `GET` | `/healthz` | Service liveness & Docker health check |

---

## Privacy & Indian DPDP Act Compliance

BuyWise complies with India's **Digital Personal Data Protection Act (DPDP)**:
- Users can clear their local cache, search history, and wishlist with a single click in the **Account** tab.
- Outbound retail links include standard `rel="sponsored noopener noreferrer"` tags.
- No personal data or search histories are sold or shared with third parties.

---

## License

This project is open-source under the [MIT License](LICENSE).
