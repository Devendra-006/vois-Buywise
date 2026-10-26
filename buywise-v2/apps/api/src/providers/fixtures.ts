import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { NormalizedProduct, PriceSnapshot, ProductCategory } from "@buywise/shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, "../../../../fixtures");

function readJsonFile<T>(filename: string): T {
  const filePath = path.join(fixturesDir, filename);
  if (!fs.existsSync(filePath)) {
    return [] as unknown as T;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as T;
}

export function getFixtureProducts(category?: ProductCategory): NormalizedProduct[] {
  const earbuds = readJsonFile<NormalizedProduct[]>("earbuds.json");
  const smartphones = readJsonFile<NormalizedProduct[]>("smartphones.json");
  const laptops = readJsonFile<NormalizedProduct[]>("laptops.json");

  if (category === "earbuds") return earbuds;
  if (category === "smartphones") return smartphones;
  if (category === "laptops") return laptops;

  return [...earbuds, ...smartphones, ...laptops];
}

export function getFixturePriceHistory(productId: string): PriceSnapshot[] {
  const historyMap = readJsonFile<Record<string, PriceSnapshot[]>>("price_history.json");
  return historyMap[productId] || [];
}

export function searchFixtures(query: string, maxPrice?: number | null): NormalizedProduct[] {
  const q = query.toLowerCase();
  const all = getFixtureProducts();

  const filtered = all.filter(p => {
    const matchesText =
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      q.includes(p.brand.toLowerCase()) ||
      q.includes(p.category.toLowerCase());

    const matchesPrice = maxPrice ? p.price <= maxPrice : true;
    return matchesText && matchesPrice;
  });

  if (filtered.length > 0) {
    return filtered;
  }

  // If no direct keyword match, return category matches based on heuristics
  if (q.includes("ear") || q.includes("bud") || q.includes("headphone") || q.includes("audio")) {
    return getFixtureProducts("earbuds");
  }
  if (q.includes("phone") || q.includes("mobile") || q.includes("5g")) {
    return getFixtureProducts("smartphones");
  }
  if (q.includes("laptop") || q.includes("pc") || q.includes("computer")) {
    return getFixtureProducts("laptops");
  }

  // Fallback to top earbuds if general
  return getFixtureProducts("earbuds");
}
