import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(v => parseInt(v, 10)).default("4000"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  SERPAPI_KEY: z.string().optional(),
  JWT_SECRET: z.string().default("buywise-development-secret-jwt-key-minimum-32-chars-long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  CRON_SECRET: z.string().default("buywise-internal-cron-secret-token"),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("BuyWise Alerts <alerts@buywise.in>"),
  DEMO_MODE: z.string().transform(v => v === "true" || v === "1").default("true"),
  DAILY_SEARCH_LIMIT: z.string().transform(v => parseInt(v, 10)).default("50")
}).refine(
  (data) => {
    if (data.NODE_ENV === "production") {
      if (!data.DATABASE_URL) return false;
    }
    return true;
  },
  {
    message: "DATABASE_URL is strictly required when NODE_ENV is set to production"
  }
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Fatal Configuration Error: Invalid environment variables");
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
