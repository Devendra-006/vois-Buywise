import { ProductCategory } from "./types.js";

export interface CategoryAttributeDef {
  key: string;
  label: string;
  unit?: string;
  highlightBest?: "max" | "min" | "exact";
}

export const CATEGORY_SPECS: Record<ProductCategory, CategoryAttributeDef[]> = {
  earbuds: [
    { key: "anc", label: "Active Noise Cancellation" },
    { key: "batteryHours", label: "Total Playtime", unit: "hrs", highlightBest: "max" },
    { key: "driverMm", label: "Driver Size", unit: "mm", highlightBest: "max" },
    { key: "ipRating", label: "Water Resistance" },
    { key: "latencyMs", label: "Low Latency", unit: "ms", highlightBest: "min" },
    { key: "bluetooth", label: "Bluetooth Version" }
  ],
  smartphones: [
    { key: "processor", label: "Processor" },
    { key: "ramGb", label: "RAM", unit: "GB", highlightBest: "max" },
    { key: "storageGb", label: "Storage", unit: "GB", highlightBest: "max" },
    { key: "display", label: "Display" },
    { key: "cameraMp", label: "Main Camera", unit: "MP", highlightBest: "max" },
    { key: "batteryMah", label: "Battery", unit: "mAh", highlightBest: "max" },
    { key: "chargingWatt", label: "Fast Charging", unit: "W", highlightBest: "max" }
  ],
  laptops: [
    { key: "processor", label: "Processor" },
    { key: "ramGb", label: "RAM", unit: "GB", highlightBest: "max" },
    { key: "storageGb", label: "SSD Storage", unit: "GB", highlightBest: "max" },
    { key: "displaySize", label: "Display Size", unit: "inch" },
    { key: "gpu", label: "Graphics" },
    { key: "weightKg", label: "Weight", unit: "kg", highlightBest: "min" }
  ],
  general: [
    { key: "warranty", label: "Warranty" },
    { key: "material", label: "Material" },
    { key: "modelYear", label: "Release Year" }
  ]
};

export function detectCategory(query: string): ProductCategory {
  const q = query.toLowerCase();
  if (
    q.includes("earbud") ||
    q.includes("earphone") ||
    q.includes("tws") ||
    q.includes("airpod") ||
    q.includes("headphone") ||
    q.includes("anc") ||
    q.includes("buds")
  ) {
    return "earbuds";
  }
  if (
    q.includes("phone") ||
    q.includes("mobile") ||
    q.includes("smartphone") ||
    q.includes("iphone") ||
    q.includes("galaxy") ||
    q.includes("oneplus") ||
    q.includes("redmi") ||
    q.includes("realme")
  ) {
    return "smartphones";
  }
  if (
    q.includes("laptop") ||
    q.includes("macbook") ||
    q.includes("thinkpad") ||
    q.includes("notebook") ||
    q.includes("gaming laptop") ||
    q.includes("chromebook")
  ) {
    return "laptops";
  }
  return "general";
}

/**
 * Standard Indian Bank Offers & EMI estimates based on real market norms
 */
export interface BankOffer {
  bank: string;
  discountType: "instant" | "cashback";
  amount: number;
  minSpend: number;
  description: string;
}

export function calculateEffectiveIndianPrice(price: number): {
  effectivePrice: number;
  availableOffers: BankOffer[];
  monthlyEmi3m: number;
  monthlyEmi6m: number;
} {
  const offers: BankOffer[] = [];

  if (price >= 1000) {
    offers.push({
      bank: "HDFC Bank",
      discountType: "instant",
      amount: Math.min(1500, Math.round(price * 0.10)),
      minSpend: 1000,
      description: "10% Instant Discount on HDFC Credit Cards"
    });
  }

  if (price >= 3000) {
    offers.push({
      bank: "ICICI Bank",
      discountType: "instant",
      amount: Math.min(2000, Math.round(price * 0.075)),
      minSpend: 3000,
      description: "7.5% Instant Discount on ICICI Bank Cards"
    });
  }

  if (price >= 5000) {
    offers.push({
      bank: "SBI Card",
      discountType: "cashback",
      amount: Math.min(1250, Math.round(price * 0.05)),
      minSpend: 5000,
      description: "5% Cashback on SBI Credit Cards"
    });
  }

  const bestDiscount = offers.length > 0 ? Math.max(...offers.map(o => o.amount)) : 0;
  const effectivePrice = Math.max(0, price - bestDiscount);

  // No-cost EMI estimates for 3-month and 6-month tenures
  const monthlyEmi3m = Math.round(effectivePrice / 3);
  const monthlyEmi6m = Math.round(effectivePrice / 6);

  return {
    effectivePrice,
    availableOffers: offers,
    monthlyEmi3m,
    monthlyEmi6m
  };
}
