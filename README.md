## BuyWise – Agentic AI Buying Assistant

BuyWise is a **multi-agent AI buying assistant** that reduces decision fatigue in e‑commerce by aggregating product data, summarizing reviews, analyzing price intelligence, and generating **personalized recommendations**.

This implementation follows a **Ralph-style model** inspired by the Ralph autonomous loop described in the `snarktank/ralph` repository [`https://github.com/snarktank/ralph`](https://github.com/snarktank/ralph). Instead of automating code changes, this project applies a similar **modular, task‑oriented agent architecture** at runtime to solve the product selection problem defined in the PRD below.

### Core Idea

- **Supervisor Agent** orchestrates the workflow.
- **Product Retrieval Agent** fetches product candidates (mock data or real APIs).
- **Review Intelligence Agent** summarizes reviews with AI.
- **Price Intelligence Agent** evaluates discount fairness and timing.
- **Scoring & Personalization Agent** computes a Smart Score per product.
- **Decision Simplification Agent** reduces the list to **Best Overall**, **Best Budget**, and **Premium Choice**.

An HTTP API endpoint exposes this pipeline so a frontend (React, Next.js, etc.) can call it.

### Features

- Multi-language support (Hindi, Tamil, Telugu, and 9 more Indian languages)
- User authentication (JWT-based)
- Search history tracking
- Recently viewed products
- Wishlist management
- Price alerts
- PostgreSQL database for persistence
- Redis caching (optional)

### Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment (edit `.env`):

```bash
# Required
OPENROUTER_API_KEY=your-key
SERPAPI_KEY=your-key

# Database (optional - uses in-memory if not set)
PG_HOST=your-host
PG_PORT=5432
PG_DATABASE=buywise
PG_USER=postgres
PG_PASSWORD=your-password
```

3. Run the app (backend + static frontend):

```bash
npm run dev
```

4. Open the UI:

- Visit `http://localhost:4000` in your browser.
- Use the search bar and sliders to run the full multi‑agent pipeline and see:
  - Comparison table
  - AI‑powered Smart Scores
  - Top‑3 simplified picks
  - Price trend chart for the selected product

### API Endpoints

#### Recommendations
```bash
POST /api/recommendations
{
  "query": "best wireless earbuds under 3000",
  "weights": { "price": 0.3, "reviews": 0.3, "rating": 0.2, "delivery": 0.2 }
}
```

#### Authentication
```bash
POST /api/auth/register   # { email, password, name }
POST /api/auth/login     # { email, password }
```

#### User Data (requires Bearer token)
```bash
GET /api/user/profile
PUT /api/user/preferences
GET /api/user/history
GET /api/user/recently-viewed
GET /api/user/wishlist
POST /api/user/wishlist       # { product }
DELETE /api/user/wishlist/:productId
POST /api/user/price-alerts   # { product, targetPrice }
GET /api/user/price-alerts
DELETE /api/user/price-alerts/:alertId
```

#### Utilities
```bash
GET /api/detect-language?text=सस्ता+फोन
POST /api/translate           # { text, targetLang }
GET /api/cache/stats
POST /api/cache/clear
```

### PRD (Hackathon Version)

The `prd/buywise-prd.json` file captures the PRD you provided in a structured format used by the agents.


