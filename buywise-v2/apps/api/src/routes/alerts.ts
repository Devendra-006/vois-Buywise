import { Router, Request, Response } from "express";
import { PriceAlertCreateSchema } from "@buywise/shared";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { priceAlerts } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { getFixtureProducts } from "../providers/fixtures.js";

export const alertsRouter = Router();

interface MemoryAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  active: boolean;
  createdAt: string;
}

const memoryAlerts: MemoryAlert[] = [];

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

// GET /v1/alerts
alertsRouter.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const allProducts = getFixtureProducts();

  if (db) {
    try {
      const rows = await db.select().from(priceAlerts).where(eq(priceAlerts.userId, user.id));
      const items = rows.map(r => ({
        id: r.id,
        productId: r.productId,
        targetPrice: parseFloat(r.targetPrice),
        active: r.active,
        createdAt: r.createdAt.toISOString(),
        product: allProducts.find(p => p.id === r.productId)
      }));
      res.json({ alerts: items });
      return;
    } catch (err: any) {
      console.warn("⚠️ Price alerts DB fetch failed:", err.message);
    }
  }

  const userAlerts = memoryAlerts.filter(a => a.userId === user.id).map(a => ({
    ...a,
    product: allProducts.find(p => p.id === a.productId)
  }));
  res.json({ alerts: userAlerts });
});

// POST /v1/alerts
alertsRouter.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const parse = PriceAlertCreateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", details: parse.error.format() });
    return;
  }

  const { productId, targetPrice } = parse.data;
  const user = (req as any).user;

  if (db) {
    try {
      const [created] = await db.insert(priceAlerts).values({
        userId: user.id,
        productId,
        targetPrice: targetPrice.toString()
      }).returning();

      res.status(201).json({ alert: created });
      return;
    } catch (err: any) {
      console.warn("⚠️ Price alerts DB insert failed:", err.message);
    }
  }

  const alertObj: MemoryAlert = {
    id: `alert_${Date.now()}`,
    userId: user.id,
    productId,
    targetPrice,
    active: true,
    createdAt: new Date().toISOString()
  };
  memoryAlerts.push(alertObj);

  res.status(201).json({ alert: alertObj });
});

// DELETE /v1/alerts/:id
alertsRouter.delete("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = (req as any).user;

  if (db) {
    try {
      await db.delete(priceAlerts).where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, user.id)));
      res.json({ success: true, removed: id });
      return;
    } catch (err: any) {
      console.warn("⚠️ Price alert DB delete failed:", err.message);
    }
  }

  const idx = memoryAlerts.findIndex(a => a.id === id && a.userId === user.id);
  if (idx !== -1) {
    memoryAlerts.splice(idx, 1);
  }
  res.json({ success: true, removed: id });
});
