# BuyWise – Multi-Agent Product Search Workflow

## Overview

BuyWise is a **multi-agent AI buying assistant** that searches across multiple e-commerce websites to find the best product for the user. Instead of the user manually comparing dozens of listings across Amazon, Flipkart, Croma, etc., BuyWise deploys a **pipeline of specialized AI agents**, each responsible for one part of the decision-making process.

The user simply describes what they want — **any product, any category** — and BuyWise returns 3 optimized picks: **Best Overall**, **Best Budget**, and **Premium Choice**, along with transparent reasoning.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                         │
│  User enters: "best wireless earbuds under 3000 for gym"    │
│  + adjusts weight sliders (price, reviews, rating, delivery)│
└─────────────────────┬───────────────────────────────────────┘
                      │  POST /api/recommendations
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              1. LANGUAGE PROCESSOR (Middleware)             │
│                                                             │
│  • Detects language (12 Indian languages supported)          │
│  • Translates non-English queries to English               │
│  • Returns response in user's language if requested         │
│                                                             │
│  Supported: Hindi, Tamil, Telugu, Kannada, Malayalam,       │
│             Marathi, Gujarati, Bengali, Punjabi,             │
│             Odia, Assamese, Urdu                            │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              2. SUPERVISOR AGENT (Orchestrator)              │
│                                                             │
│  • Receives user query + weight preferences                 │
│  • Breaks query into structured subtasks                    │
│  • Triggers each agent in the correct sequence              │
│  • Aggregates all structured outputs                        │
│  • Returns final formatted recommendation                   │
│                                                             │
│  RULES: Does NOT generate product data. Does NOT rank.      │
│         Only coordinates and passes structured data.        │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│         3. PRODUCT RETRIEVAL AGENT (Data Fetcher)           │
│                                                             │
│  • Fetches products from SerpAPI (real Google Shopping data) │
│  • Falls back to LLM-generated data if API unavailable     │
│  • Normalizes product data                                  │
│  • Caches results in Redis for 1 hour                      │
│                                                             │
│  OUTPUT: Array of 5-8 products from different platforms     │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│       4. REVIEW INTELLIGENCE AGENT (Sentiment Analyzer)     │
│                                                             │
│  • Takes the product list from Step 3                       │
│  • Uses LLM to analyze review snippets                      │
│  • Extracts for each product:                              │
│    - Top 5 pros                                            │
│    - Top 5 cons                                            │
│    - Sentiment score (0-10)                                │
│    - Most frequent complaints                              │
│    - Durability assessment (Low/Medium/High)               │
│                                                             │
│  RULES: Objective. No exaggeration. No purchase advice.     │
│                                                             │
│  OUTPUT: Array of review insights per product                │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│       5. PRICE INTELLIGENCE AGENT (Discount Analyzer)       │
│                                                             │
│  • Takes the product list from Step 3                       │
│  • Analyzes: current price vs. original price vs. history  │
│  • Determines for each product:                            │
│    - Is the discount authentic? (true/false)                │
│    - Price fairness score (0-10)                            │
│    - Buy recommendation: "Buy" / "Wait" / "Neutral"        │
│    - Risk level of price increase (Low/Medium/High)       │
│                                                             │
│  RULES: Based only on numbers. No opinions.                │
│                                                             │
│  OUTPUT: Array of price intelligence per product            │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│    6. SCORING & PERSONALIZATION AGENT (Weighted Ranker)    │
│                                                             │
│  INPUTS:                                                   │
│  • Products (Step 3)                                        │
│  • Review insights (Step 4)                                │
│  • Price intelligence (Step 5)                             │
│  • User weight preferences                                 │
│  • User profile (from database if authenticated)           │
│                                                             │
│  FORMULA:                                                  │
│  Smart Score = (price_score × weight_price)                │
│              + (sentiment_score × weight_reviews)          │
│              + (rating_score × weight_rating)              │
│              + (delivery_score × weight_delivery)          │
│                                                             │
│  OUTPUT: Ranked product list with Smart Scores             │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│    7. DECISION SIMPLIFICATION AGENT (Top 3 Selector)        │
│                                                             │
│  • Takes the ranked list from Step 6                        │
│  • Selects exactly 3 products:                            │
│                                                             │
│    🥇 Best Overall  → Highest Smart Score                  │
│    💰 Best Budget   → Lowest price with acceptable score   │
│    ⭐ Premium Pick  → Highest rating + premium features    │
│                                                             │
│  OUTPUT: 3 structured recommendation objects                │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│         8. EXPLANATION AGENT (Reasoning Layer)              │
│                                                             │
│  • Takes the top 3 picks + full scored list                │
│  • Generates human-friendly explanations                   │
│  • Translates to user's language if needed                 │
│                                                             │
│  OUTPUT: Array of reasoning strings                         │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FINAL API RESPONSE                        │
│                                                             │
│  {                                                          │
│    "query": "best wireless earbuds under 3000 for gym",     │
│    "weights": { price: 0.3, reviews: 0.3, ... },           │
│    "products": [ ... ranked list with Smart Scores ],      │
│    "topPicks": {                                           │
│      "best_overall": { ... },                              │
│      "best_budget": { ... },                               │
│      "premium_pick": { ... }                               │
│    },                                                       │
│    "language": { detected: {...}, translated: true }       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Additional Features

### Multi-Language Support
- Automatic language detection for 12 Indian languages
- Query translation before processing
- Response translation if requested
- API endpoints: `/api/detect-language`, `/api/translate`

### User Authentication & History
- JWT-based authentication
- Search history tracking
- Recently viewed products
- Wishlist management
- Price alerts

### Database
- PostgreSQL for persistent storage
- Automatic fallback to in-memory storage if unavailable

### Caching
- Redis for product data caching (1 hour TTL)
- Falls back to in-memory cache if unavailable

---

## API Endpoints

### Recommendations
```bash
POST /api/recommendations
{
  "query": "best wireless earbuds under 3000",
  "weights": { "price": 0.3, "reviews": 0.3, "rating": 0.2, "delivery": 0.2 }
}
```

### Authentication
```bash
POST /api/auth/register   # { email, password, name }
POST /api/auth/login     # { email, password }
```

### User Data (requires Bearer token)
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

### Utilities
```bash
GET /api/detect-language?text=सस्ता+फोन
POST /api/translate           # { text, targetLang }
GET /api/cache/stats
POST /api/cache/clear
```

---

## How to Run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (edit .env)
# Required:
# OPENROUTER_API_KEY=your-key
# SERPAPI_KEY=your-key
# 
# Optional (database):
# PG_HOST=your-host
# PG_PORT=5432
# PG_DATABASE=buywise
# PG_USER=postgres
# PG_PASSWORD=your-password

# 3. Start the server
npm run dev

# 4. Open in browser
# http://localhost:4000
```

---

## Technology Stack

| Component       | Technology               |
|-----------------|--------------------------|
| Backend         | Node.js + Express.js     |
| AI / LLM        | OpenRouter API           |
| LLM Model       | stepfun/step-3.5-flash   |
| Database        | PostgreSQL               |
| Cache           | Redis                    |
| Auth            | JWT                      |
| Architecture    | Multi-Agent Pipeline     |
