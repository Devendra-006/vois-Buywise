import { NormalizedProduct, PriceSnapshot, PriceVerdict, evaluatePriceVerdict } from "@buywise/shared";
import { db } from "../db/client.js";
import { priceSnapshots, products } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { getFixturePriceHistory } from "../providers/fixtures.js";

export async function analyzeProductPrice(product: NormalizedProduct): Promise<{
  verdict: PriceVerdict;
  snapshots: PriceSnapshot[];
}> {
  let snapshots: PriceSnapshot[] = [];

  if (db) {
    try {
      // Find matching product in DB by store and title
      const dbProduct = await db
        .select()
        .from(products)
        .where(eq(products.storeProductId, product.id))
        .limit(1);

      if (dbProduct.length > 0) {
        const dbSnapshots = await db
          .select()
          .from(priceSnapshots)
          .where(eq(priceSnapshots.productId, dbProduct[0].id))
          .orderBy(desc(priceSnapshots.fetchedAt))
          .limit(30);

        snapshots = dbSnapshots.map(s => ({
          productId: product.id,
          price: parseFloat(s.price),
          currency: s.currency,
          store: product.store,
          inStock: s.inStock,
          fetchedAt: s.fetchedAt.toISOString()
        }));

        // Insert new snapshot
        await db.insert(priceSnapshots).values({
          productId: dbProduct[0].id,
          price: product.price.toString(),
          currency: "INR",
          inStock: product.inStock,
          fetchedAt: new Date()
        });
      }
    } catch (err: any) {
      console.warn("⚠️ Database query for price snapshots failed:", err.message);
    }
  }

  // Fallback to fixture snapshots if DB yielded fewer than 5 snapshots
  if (snapshots.length < 5) {
    const fixtureHistory = getFixturePriceHistory(product.id);
    if (fixtureHistory.length > 0) {
      snapshots = fixtureHistory;
    }
  }

  const verdict = evaluatePriceVerdict(product.price, snapshots);

  return {
    verdict,
    snapshots
  };
}
