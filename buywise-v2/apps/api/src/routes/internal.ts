import { Router, Request, Response } from "express";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { priceAlerts, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getFixtureProducts } from "../providers/fixtures.js";
import { sendPriceAlertEmail } from "../lib/email.js";

export const internalRouter = Router();

// POST /internal/price-check (protected by x-cron-secret header)
internalRouter.post("/price-check", async (req: Request, res: Response): Promise<void> => {
  const cronSecret = req.headers["x-cron-secret"];

  if (!cronSecret || cronSecret !== env.CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing x-cron-secret header" });
    return;
  }

  console.log("⏰ [INTERNAL CRON] Executing scheduled price drop checks...");

  const allProducts = getFixtureProducts();
  let notificationsSent = 0;

  if (db) {
    try {
      const activeAlerts = await db
        .select({
          alertId: priceAlerts.id,
          targetPrice: priceAlerts.targetPrice,
          productId: priceAlerts.productId,
          userEmail: users.email
        })
        .from(priceAlerts)
        .innerJoin(users, eq(priceAlerts.userId, users.id))
        .where(eq(priceAlerts.active, true));

      for (const alert of activeAlerts) {
        const product = allProducts.find(p => p.id === alert.productId);
        if (!product) continue;

        const target = parseFloat(alert.targetPrice);
        if (product.price <= target) {
          const sent = await sendPriceAlertEmail({
            userEmail: alert.userEmail,
            productTitle: product.title,
            currentPrice: product.price,
            targetPrice: target,
            productUrl: product.productUrl,
            store: product.store
          });

          if (sent) {
            notificationsSent++;
            await db
              .update(priceAlerts)
              .set({ lastNotifiedAt: new Date() })
              .where(eq(priceAlerts.id, alert.alertId));
          }
        }
      }
    } catch (err: any) {
      console.error("❌ Cron job database check failed:", err.message);
    }
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    checkedAt: new Date().toISOString(),
    notificationsSent
  });
});
