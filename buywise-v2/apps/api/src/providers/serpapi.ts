import { NormalizedProduct } from "@buywise/shared";
import { env } from "../config/env.js";
import { normalizeGoogleShoppingProduct } from "./normalise.js";
import { searchFixtures } from "./fixtures.js";
import { getCache, setCache, normalizeCacheKey } from "../lib/cache.js";

const SERPAPI_URL = "https://serpapi.com/search.json";

export async function fetchProductsFromSerpApi(
  query: string,
  maxPrice?: number | null,
  forceRefresh = false
): Promise<{ products: NormalizedProduct[]; isDemo: boolean; source: string }> {
  const cacheKey = normalizeCacheKey("serp", `${query}_${maxPrice || "all"}`);

  if (!forceRefresh) {
    const cached = await getCache<NormalizedProduct[]>(cacheKey);
    if (cached && cached.length > 0) {
      return { products: cached, isDemo: cached[0]?.isDemoData ?? false, source: "cache" };
    }
  }

  // If no SerpAPI key is provided or DEMO_MODE is true, return verified fixtures
  if (!env.SERPAPI_KEY || env.DEMO_MODE) {
    console.log(`📦 Using verified real fixtures for query: "${query}"`);
    const fixtures = searchFixtures(query, maxPrice);
    await setCache(cacheKey, fixtures, 3600);
    return { products: fixtures, isDemo: true, source: "fixtures" };
  }

  try {
    console.log(`🔍 Querying SerpAPI Google Shopping for: "${query}" (gl=in)`);
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: query,
      gl: "in",
      hl: "en",
      api_key: env.SERPAPI_KEY,
      num: "12"
    });

    const res = await fetch(`${SERPAPI_URL}?${params.toString()}`);
    if (!res.ok) {
      console.warn(`⚠️ SerpAPI error HTTP ${res.status}. Falling back to fixtures.`);
      const fixtures = searchFixtures(query, maxPrice);
      return { products: fixtures, isDemo: true, source: "fixtures_fallback" };
    }

    const data: any = await res.json();
    const shoppingResults = data.shopping_results || [];

    if (!Array.isArray(shoppingResults) || shoppingResults.length === 0) {
      console.warn(`⚠️ No shopping results returned for "${query}". Using fixtures.`);
      const fixtures = searchFixtures(query, maxPrice);
      return { products: fixtures, isDemo: true, source: "fixtures_fallback" };
    }

    const normalized = shoppingResults.map((item: any, idx: number) =>
      normalizeGoogleShoppingProduct(item, query, idx)
    );

    await setCache(cacheKey, normalized, 3600);
    return { products: normalized, isDemo: false, source: "serpapi_live" };
  } catch (err: any) {
    console.error("❌ SerpAPI fetch exception:", err.message);
    const fixtures = searchFixtures(query, maxPrice);
    return { products: fixtures, isDemo: true, source: "fixtures_fallback" };
  }
}
