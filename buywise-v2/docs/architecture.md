# BuyWise System Architecture

BuyWise is an explainable, neutral shopping intelligence platform engineered for Indian e-commerce. It addresses shopper decision fatigue by replacing endless scrolling and biased marketplace ads with transparent Smart Scores, price history verdicts, and Wirecutter-style editorial reasoning.

---

## 1. High-Level Architecture

```
                                +---------------------------+
                                |  Next.js 14 Web Frontend  |
                                |     (Tailwind + React)    |
                                +-------------+-------------+
                                              |
                                              | HTTPS / SSE Stream
                                              v
+------------------------------------------------------------------------------------------+
|                               Express 4 + TypeScript API                                 |
|                                                                                          |
|  [Security Layer]                                                                        |
|  - Helmet Security Headers       - CORS Strict Allowlist      - Express Rate Limiters    |
|  - Zod Request Validation        - JWT Authentication          - Prompt Injection Defense|
|                                                                                          |
|  [Multi-Agent Shopping Intelligence Pipeline]                                            |
|                                                                                          |
|     1. Query Parser Agent  -----> Categorizes intent, budget (INR), & must-have specs    |
|             |                                                                            |
|     2. Product Retrieval   -----> Fetches live listings via SerpAPI (Google Shopping in) |
|             |                     (or verified real snapshots in demo mode)              |
|             |                                                                            |
|             +-----------------------+-----------------------+                            |
|             |                                               |                            |
|     3a. Review Intelligence Agent                   3b. Price Intelligence Agent         |
|         (Summarizes real buyer feedback                 (Queries price_snapshots DB,     |
|          & calculates review confidence)                 calculates 90-day median,       |
|             |                                            & determines Fair Price verdict)|
|             +-----------------------+-----------------------+                            |
|                                     |                                                    |
|     4. Deterministic Scoring Engine > Computes 0-100 Smart Score with Bayesian ratings   |
|             |                                                                            |
|     5. Top 3 Pick Selector ---------> Identifies Best Overall, Budget, and Premium Choice|
|             |                                                                            |
|     6. Decision Explainer Agent ----> Generates editorial Wirecutter-style trade-offs    |
+---------------------------------------------+--------------------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
         +-----------------------+                         +-----------------------+
         | PostgreSQL (Neon/Sup) |                         |      Redis Cache      |
         | (Drizzle ORM Schema)  |                         |  (In-Memory fallback) |
         +-----------------------+                         +-----------------------+
```

---

## 2. Transparent Scoring Algorithm

The BuyWise Smart Score ($0-100$) is computed deterministically in TypeScript code—**never in the LLM**. This guarantees mathematical consistency and prevents model hallucination.

### 2.1 Bayesian Rating Formula
To prevent a $5.0\star$ item with only 3 reviews from beating a $4.5\star$ item with 15,000 verified buyers, ratings are smoothed toward a category prior ($C = 4.0$ with threshold $m = 50$):

$$\text{Bayes}(R, v) = \left(\frac{v}{v + m}\right) \cdot R + \left(\frac{m}{v + m}\right) \cdot C$$

### 2.2 Factor Normalization & Dynamic Redistribution
All candidate products in the search result are normalized using min-max scaling across available criteria:
- **Price Score** (Lower is better, inverted scale)
- **Rating Score** (Bayesian smoothed)
- **Review Volume Score** (Log-scaled to balance statistical weight)
- **Delivery Score** (If delivery days are reported by the store)
- **Seller Trust Score** (Fulfilled by store / verified merchant)
- **Price Fairness Score** (Historical deviation from 90-day median)

If a factor is unavailable (e.g., delivery time unknown), its weight is redistributed proportionally across the remaining active factors.

---

## 3. Price History & Verdict Engine

BuyWise evaluates pricing trajectory from genuine snapshots in the `price_snapshots` table:
- **Minimum Data Requirement**: Requires at least 5 price observations across $14+$ days.
- **Fair Value Comparison**: Compares the current price with the median price over the past 90 days.
  - $\le -5\%$ below median: **"Buy Now"** (Good Deal)
  - $\pm 5\%$ of median: **"Fair Price"**
  - $\ge +5\%$ above median: **"Wait for Deal"** (Inflated Price)

---

## 4. Security & Hardening Measures

- **Prompt Injection Defense**: Untrusted merchant titles, descriptions, and user reviews are quarantined inside `<untrusted_content>` tags. The model is strictly instructed to treat text as passive data and respond only in valid JSON.
- **Fail-Fast Startup**: If `NODE_ENV=production` is detected without `DATABASE_URL`, the server halts immediately rather than risking silent in-memory data loss.
- **Rate Limiting**: Search endpoints are limited to 15 requests per minute per IP to protect downstream API quotas.
- **Zero Hallucinated Numbers**: Prices, review counts, ratings, and URLs are sourced only from retrieved provider feeds.
