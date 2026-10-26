import { NormalizedProduct, ParsedQuery } from "@buywise/shared";
import { fetchProductsFromSerpApi } from "../providers/serpapi.js";

export async function retrieveProducts(
  parsed: ParsedQuery,
  forceRefresh = false
): Promise<{ products: NormalizedProduct[]; isDemo: boolean; dataSource: string }> {
  const result = await fetchProductsFromSerpApi(parsed.cleanedQuery, parsed.maxPrice, forceRefresh);

  // Sanity filtering & deduplication
  const seenTitles = new Set<string>();
  const validProducts = result.products.filter(p => {
    if (!p.price || p.price <= 0) return false;
    const normTitle = p.title.toLowerCase().slice(0, 30);
    if (seenTitles.has(normTitle)) return false;
    seenTitles.add(normTitle);
    return true;
  });

  return {
    products: validProducts,
    isDemo: result.isDemo,
    dataSource: result.source
  };
}
