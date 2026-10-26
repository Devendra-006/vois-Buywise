import { NormalizedProduct, ProductCategory, ProductSource, detectCategory } from "@buywise/shared";

export function parsePriceINR(val: any): number {
  if (typeof val === "number") return Math.round(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

export function normalizeStoreName(source?: string): ProductSource {
  if (!source) return "Google Shopping";
  const s = source.toLowerCase();
  if (s.includes("amazon")) return "Amazon India";
  if (s.includes("flipkart")) return "Flipkart";
  if (s.includes("croma")) return "Croma";
  if (s.includes("reliance")) return "Reliance Digital";
  if (s.includes("tatacliq") || s.includes("tata cliq")) return "Tata CLiQ";
  return "Google Shopping";
}

export function extractBrandFromTitle(title: string): string {
  const commonBrands = [
    "Apple", "Samsung", "OnePlus", "Sony", "boAt", "Realme", "Xiaomi", "Redmi",
    "Poco", "Noise", "JBL", "Boult", "Lenovo", "ASUS", "HP", "Dell", "Acer", "Motorola", "Nothing"
  ];
  const titleLower = title.toLowerCase();
  for (const b of commonBrands) {
    if (titleLower.includes(b.toLowerCase())) return b;
  }
  return title.split(" ")[0] || "Unknown";
}

export function normalizeGoogleShoppingProduct(item: any, query: string, index: number): NormalizedProduct {
  const title = item.title || "Untitled Product";
  const brand = extractBrandFromTitle(title);
  const category = detectCategory(query + " " + title);
  const price = parsePriceINR(item.price || item.extracted_price);
  const originalPrice = parsePriceINR(item.old_price) || Math.round(price * 1.15);
  const discountPercent = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const rating = parseFloat(item.rating) || 4.2;
  const reviewCount = parseInt(String(item.reviews || "120").replace(/[^0-9]/g, ""), 10) || 150;
  const store = normalizeStoreName(item.source);

  return {
    id: `gshop_${index}_${Date.now()}`,
    title,
    brand,
    category,
    store,
    price,
    originalPrice,
    discountPercent,
    rating: Math.min(5, Math.max(1, rating)),
    reviewCount,
    productUrl: item.link || item.product_link || "#",
    imageUrl: item.thumbnail || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
    inStock: true,
    deliveryDays: item.delivery ? (item.delivery.toLowerCase().includes("free") ? 2 : 4) : 3,
    seller: item.source || "Online Merchant",
    isFulfilled: store === "Amazon India" || store === "Flipkart",
    specs: {},
    reviewSnippets: item.snippet ? [item.snippet] : ["Verified purchase rating from Google Shopping"],
    fetchedAt: new Date().toISOString(),
    isDemoData: false
  };
}
