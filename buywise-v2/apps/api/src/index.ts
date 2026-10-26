import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiRateLimiter } from "./lib/rateLimit.js";
import { getCacheStats } from "./lib/cache.js";
import { searchRouter } from "./routes/search.js";
import { productsRouter } from "./routes/products.js";
import { authRouter } from "./routes/auth.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { alertsRouter } from "./routes/alerts.js";
import { internalRouter } from "./routes/internal.js";
import { sql } from "./db/client.js";

const app = express();

// Security Headers & Cross-Origin settings
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map(o => o.trim()),
  credentials: true
}));

// Body limits (defense against oversized payload abuse)
app.use(express.json({ limit: "100kb" }));

// General rate limiter
app.use(apiRateLimiter);

// Liveness & Readiness endpoints for monitoring / Kubernetes / Docker
app.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    service: "buywise-api",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/readyz", async (_req, res) => {
  const ready = {
    api: true,
    postgres: false,
    cache: getCacheStats()
  };

  if (sql) {
    try {
      await sql`SELECT 1`;
      ready.postgres = true;
    } catch {
      ready.postgres = false;
    }
  }

  res.status(ready.api ? 200 : 503).json(ready);
});

// Cache stats endpoint
app.get("/v1/cache/stats", (_req, res) => {
  res.json(getCacheStats());
});

// Mount versioned routers
app.use("/v1/search", searchRouter);
app.use("/v1/products", productsRouter);
app.use("/v1/auth", authRouter);
app.use("/v1/wishlist", wishlistRouter);
app.use("/v1/alerts", alertsRouter);
app.use("/internal", internalRouter);

// Global 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const server = app.listen(env.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 BuyWise Shopping Intelligence API v1.0.0`);
  console.log(`📡 Listening on http://localhost:${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🛡️  Rate Limiting & Helmet enabled`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    if (sql) {
      await sql.end({ timeout: 5 });
    }
    console.log("👋 BuyWise API shutdown complete.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
