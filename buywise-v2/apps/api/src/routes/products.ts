import { Router, Request, Response } from "express";
import { getFixtureProducts, getFixturePriceHistory } from "../providers/fixtures.js";
import { evaluatePriceVerdict, calculateSmartScore } from "@buywise/shared";

export const productsRouter = Router();

// GET /v1/products/:id
productsRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const allProducts = getFixtureProducts();
  const product = allProducts.find(p => p.id === id);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const snapshots = getFixturePriceHistory(id);
  const priceVerdict = evaluatePriceVerdict(product.price, snapshots);
  const score = calculateSmartScore(product, allProducts, undefined, priceVerdict);

  res.json({
    product,
    priceVerdict,
    snapshots,
    score
  });
});

// GET /v1/compare?ids=a,b,c
productsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  const idsParam = req.query.ids as string;
  if (!idsParam) {
    res.status(400).json({ error: "Query parameter 'ids' is required (comma-separated)" });
    return;
  }

  const ids = idsParam.split(",").map(i => i.trim()).filter(Boolean);
  const allProducts = getFixtureProducts();
  const matched = allProducts.filter(p => ids.includes(p.id));

  const compared = matched.map(p => {
    const snapshots = getFixturePriceHistory(p.id);
    const priceVerdict = evaluatePriceVerdict(p.price, snapshots);
    const score = calculateSmartScore(p, allProducts, undefined, priceVerdict);
    return {
      ...p,
      score,
      priceVerdict,
      snapshots
    };
  });

  res.json({
    count: compared.length,
    products: compared
  });
});
