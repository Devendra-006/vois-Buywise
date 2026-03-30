import pg from "pg";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || "buywise",
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on("error", (err) => {
  console.error("PostgreSQL unexpected error:", err);
});

export const redis = process.env.REDIS_PASSWORD 
  ? new Redis({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true
    })
  : null;

if (redis) {
  redis.on("error", () => {});
  redis.on("connect", () => console.log("✅ Connected to Redis"));
}

export async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recently_viewed (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL,
        product_name TEXT,
        product_image TEXT,
        product_price DECIMAL(10, 2),
        timestamp TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL,
        product_name TEXT,
        product_image TEXT,
        product_price DECIMAL(10, 2),
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS price_alerts (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(255) NOT NULL,
        product_name TEXT,
        target_price DECIMAL(10, 2) NOT NULL,
        current_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        notified_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
      CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
    `);
    console.log("✅ Database tables initialized");
  } catch (error) {
    console.warn("⚠️ Database unavailable - using in-memory storage:", error.message);
  }
}
