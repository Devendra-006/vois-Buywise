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

### Quick Start

1. Install dependencies:

```bash
npm install
```

2. Run the app (backend + static frontend):

```bash
npm run dev
```

3. Open the UI:

- Visit `http://localhost:4000` in your browser.
- Use the search bar and sliders to run the full multi‑agent pipeline and see:
  - Comparison table
  - AI‑powered Smart Scores
  - Top‑3 simplified picks
  - Price trend chart for the selected product

4. Call the recommendation endpoint directly (optional, for testing/integration):

- `POST /api/recommendations`
- Body:

```json
{
  "query": "best 55 inch 4k tv",
  "weights": {
    "price": 0.3,
    "reviews": 0.3,
    "rating": 0.2,
    "delivery": 0.2
  }
}
```

You’ll receive:

- Raw product list with scores
- Top‑3 simplified choices:
  - 🥇 Best Overall
  - 💰 Best Budget
  - ⭐ Premium Choice

### PRD (Hackathon Version)

The `prd/buywise-prd.json` file captures the PRD you provided in a structured format used by the agents.


