# BuyWise Deployment Guide

This guide details how to deploy BuyWise to production using modern, free-tier-friendly cloud platforms.

---

## 1. Cloud Architecture Overview

| Component | Platform | Configuration |
|---|---|---|
| **Web Frontend** | Vercel | Next.js 14 App Router, Edge CDN |
| **API Backend** | Render / Railway / Fly.io | Docker container, Node 22 runtime |
| **Database** | Neon.tech / Supabase | Managed PostgreSQL with connection pooling |
| **Cache (Optional)** | Upstash | Serverless Redis (TLS connection string) |
| **Scheduled Alerts** | GitHub Actions | Daily cron triggering `/internal/price-check` |

---

## 2. Step 1: Database Setup (PostgreSQL)

1. Create a free PostgreSQL instance on **[Neon](https://neon.tech)** or **[Supabase](https://supabase.com)**.
2. Copy your pooled connection string (e.g., `postgresql://user:pass@ep-cool-db.neon.tech/neondb?sslmode=require`).
3. Set `DATABASE_URL` in your environment.

To push tables to the database:
```bash
npm run db:push --workspace=apps/api
```

---

## 3. Step 2: Deploy Backend API (Render / Railway / Fly.io)

### Using Docker on Render:
1. Connect your GitHub repository to [Render](https://render.com).
2. Choose **Web Service** with **Environment: Docker**.
3. Set the following environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `DATABASE_URL`: *(Your Neon/Supabase pooled Postgres connection string)*
   - `JWT_SECRET`: *(A random 32+ character string)*
   - `CRON_SECRET`: *(A secure random token for scheduled checks)*
   - `CORS_ORIGIN`: `https://your-buywise-web.vercel.app`
   - `OPENROUTER_API_KEY`: *(Your OpenRouter API Key)*
   - `SERPAPI_KEY`: *(Your SerpAPI Key)*
   - `DEMO_MODE`: `false`
4. Set the Health Check path to `/healthz`.

---

## 4. Step 3: Deploy Frontend Web (Vercel)

1. Import the repository in [Vercel](https://vercel.com).
2. Set the **Root Directory** to `apps/web`.
3. Add the environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-api-service.onrender.com`
4. Deploy. Vercel will automatically build and publish the Next.js frontend with global edge caching.

---

## 5. Step 4: Configure GitHub Actions Price Check Cron

1. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions**.
2. Add the following repository secrets:
   - `API_URL`: `https://your-api-service.onrender.com`
   - `CRON_SECRET`: *(The same CRON_SECRET configured on your API backend)*
3. The `.github/workflows/price-check.yml` workflow will automatically run every morning at 02:30 UTC, inspect price thresholds, and dispatch alert notifications.
