import { Router, Request, Response } from "express";
import { WishlistActionSchema } from "@buywise/shared";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { wishlist } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { getFixtureProducts } from "../providers/fixtures.js";

export const wishlistRouter = Router();

const memoryWishlist = new Set<string>();

function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, env.JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// GET /v1/wishlist
wishlistRouter.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const allProducts = getFixtureProducts();

  if (db) {
    try {
      const rows = await db.select().from(wishlist).where(eq(wishlist.userId, user.id));
      const items = rows.map(r => ({
        productId: r.productId,
        addedAt: r.createdAt.toISOString(),
        product: allProducts.find(p => p.id === r.productId)
      }));
      res.json({ items });
      return;
    } catch (err: any) {
      console.warn("⚠️ Wishlist DB fetch failed:", err.message);
    }
  }

  // Memory fallback
  const items = Array.from(memoryWishlist).map(id => ({
    productId: id,
    addedAt: new Date().toISOString(),
    product: allProducts.find(p => p.id === id)
  }));

  res.json({ items });
});

// POST /v1/wishlist
wishlistRouter.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const parse = WishlistActionSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", details: parse.error.format() });
    return;
  }

  const { productId } = parse.data;
  const user = (req as any).user;

  if (db) {
    try {
      await db.insert(wishlist).values({
        userId: user.id,
        productId
      }).onConflictDoNothing();
      res.status(201).json({ success: true, productId });
      return;
    } catch (err: any) {
      console.warn("⚠️ Wishlist DB insert failed:", err.message);
    }
  }

  memoryWishlist.add(productId);
  res.status(201).json({ success: true, productId });
});

// DELETE /v1/wishlist/:productId
wishlistRouter.delete("/:productId", authenticate, async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;
  const user = (req as any).user;

  if (db) {
    try {
      await db.delete(wishlist).where(and(eq(wishlist.userId, user.id), eq(wishlist.productId, productId)));
      res.json({ success: true, removed: productId });
      return;
    } catch (err: any) {
      console.warn("⚠️ Wishlist DB delete failed:", err.message);
    }
  }

  memoryWishlist.delete(productId);
  res.json({ success: true, removed: productId });
});
