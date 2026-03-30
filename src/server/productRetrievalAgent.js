// Product Retrieval Agent
// 🎯 Role: Fetch structured product data from multiple websites via real APIs.
//
// IMPROVEMENT 1: Real Product Data Integration
// - SerpAPI for real Google Shopping results
// - LLM fallback for generated data
// - In-memory caching (1 hour TTL)
// - Comprehensive fallback chain
//
// System Instruction:
// You are the Product Retrieval Agent.
// Your job is to retrieve factual product information from multiple e-commerce 
// platforms using real data sources.
//
// Retrieve the following:
// - Platform name
// - Product title
// - Price (real current price)
// - Original price (MRP)
// - Seller rating
// - Delivery time (days)
// - Warranty
// - Historical price (if available)
// - Review snippets
// - Stock availability
// - Product URL
//
// Rules:
// - Prefer real data over generated data
// - Return only structured JSON
// - Do NOT summarize or rank products
// - Fallback chain: SerpAPI → LLM → Mock data

import { fetchRealProducts } from "./productDataService.js";

// ── Fallback mock data (used when all sources fail) ──────────────────────

const fallbackProducts = {
  phone: [
    {
      id: "p1",
      platform: "Amazon",
      title: "GamingPro X1 8GB RAM 128GB",
      price: 18999,
      original_price: 24999,
      seller_rating: 4.5,
      delivery_days: 2,
      warranty: "1 year",
      review_snippets: [
        "Excellent gaming performance, no lag in PUBG or COD.",
        "Battery lasts all day with moderate gaming.",
        "Display is bright and colors are vibrant.",
        "Build quality is solid, feels premium.",
        "Fast charging works great, 0-100% in 45 minutes."
      ],
      historical_price: [24999, 22999, 20999, 19999, 18999]
    },
    {
      id: "p2",
      platform: "Flipkart",
      title: "BudgetGamer Y2 6GB RAM 64GB",
      price: 14999,
      original_price: 19999,
      seller_rating: 4.2,
      delivery_days: 4,
      warranty: "1 year",
      review_snippets: [
        "Great value for money, handles games well.",
        "Camera is decent for the price.",
        "Battery could be better, needs charging twice a day.",
        "Some heating during extended gaming sessions.",
        "Good for casual gamers on a budget."
      ],
      historical_price: [19999, 17999, 16999, 15999, 14999]
    },
    {
      id: "p3",
      platform: "Amazon",
      title: "EliteGamer Z3 12GB RAM 256GB",
      price: 24999,
      original_price: 29999,
      seller_rating: 4.7,
      delivery_days: 3,
      warranty: "2 years",
      review_snippets: [
        "Best gaming phone under 25k, handles everything smoothly.",
        "Premium build with metal frame, feels durable.",
        "120Hz display is buttery smooth for gaming.",
        "No heating issues even after 2 hours of gaming.",
        "Worth every rupee, highly recommended."
      ],
      historical_price: [29999, 27999, 26999, 25999, 24999]
    }
  ],
  tv: [
    {
      id: "p1",
      platform: "Amazon",
      title: "Acme 55\" 4K Smart TV",
      price: 49999,
      original_price: 64999,
      seller_rating: 4.4,
      delivery_days: 2,
      warranty: "1 year",
      review_snippets: [
        "Great picture quality and vibrant colors.",
        "Sound could be better but decent for the price.",
        "Setup was easy and UI is smooth.",
        "Build quality feels solid, no issues after 6 months.",
        "Remote control is responsive and intuitive."
      ],
      historical_price: [64999, 62999, 59999, 54999, 49999]
    },
    {
      id: "p2",
      platform: "Flipkart",
      title: "BudgetView 50\" 4K LED TV",
      price: 32999,
      original_price: 42999,
      seller_rating: 4.1,
      delivery_days: 5,
      warranty: "1 year",
      review_snippets: [
        "Excellent value for money.",
        "Remote feels a bit cheap.",
        "Good brightness for well-lit rooms.",
        "Some users report backlight bleeding after a year.",
        "Great for budget-conscious buyers."
      ],
      historical_price: [42999, 39999, 37999, 34999, 32999]
    },
    {
      id: "p3",
      platform: "Amazon",
      title: "PremiumVision 65\" OLED TV",
      price: 119999,
      original_price: 139999,
      seller_rating: 4.8,
      delivery_days: 3,
      warranty: "3 years",
      review_snippets: [
        "Blacks are truly deep, cinema-like experience.",
        "Expensive but worth it for movie lovers.",
        "Dolby Atmos support is fantastic.",
        "Premium build quality, should last many years.",
        "Best TV I've ever owned, no regrets."
      ],
      historical_price: [139999, 134999, 129999, 124999, 119999]
    }
  ],
  default: [
    {
      id: "p1",
      platform: "Amazon",
      title: "Top Rated Product Option A",
      price: 2999,
      original_price: 4999,
      seller_rating: 4.5,
      delivery_days: 2,
      warranty: "1 year",
      review_snippets: [
        "Excellent quality for the price.",
        "Works perfectly, exceeded expectations.",
        "Good build quality and finish.",
        "Fast delivery and great packaging.",
        "Would recommend to friends."
      ],
      historical_price: [4999, 4499, 3999, 3499, 2999]
    },
    {
      id: "p2",
      platform: "Flipkart",
      title: "Budget Friendly Product Option B",
      price: 1499,
      original_price: 2499,
      seller_rating: 4.1,
      delivery_days: 4,
      warranty: "6 months",
      review_snippets: [
        "Great value for money.",
        "Decent quality at this price.",
        "Does the job, nothing fancy.",
        "Packaging could be better.",
        "Good for basic needs."
      ],
      historical_price: [2499, 2199, 1999, 1699, 1499]
    },
    {
      id: "p3",
      platform: "Croma",
      title: "Premium Choice Product Option C",
      price: 5999,
      original_price: 7999,
      seller_rating: 4.7,
      delivery_days: 3,
      warranty: "2 years",
      review_snippets: [
        "Premium quality, feels luxurious.",
        "Best in class, no comparison.",
        "Durability is outstanding.",
        "Slightly expensive but worth it.",
        "Highly recommended for serious users."
      ],
      historical_price: [7999, 7499, 6999, 6499, 5999]
    }
  ]
};

function getFallbackProducts(query) {
  const q = query.toLowerCase();
  if (q.includes("phone") || q.includes("mobile") || q.includes("smartphone")) {
    return fallbackProducts.phone;
  }
  if (q.includes("tv") || q.includes("television")) {
    return fallbackProducts.tv;
  }
  return fallbackProducts.default;
}

// ── Main Agent Function ──────────────────────────────────────────────────

export async function productRetrievalAgent({ query, forceRefresh = false }) {
  console.log(`🔍 Product Retrieval Agent: Searching for "${query}" across multiple websites...`);

  // Attempt real product data (SerpAPI → LLM → Mock)
  try {
    const searchResults = await fetchRealProducts(query, { forceRefresh });

    if (searchResults && searchResults.length > 0) {
      console.log(`✅ Product Retrieval Agent returned ${searchResults.length} real products.`);

      return searchResults.map((p) => ({
        id: p.id,
        platform: p.platform,
        title: p.title,
        brand: p.brand,
        price: p.price,
        original_price: p.original_price,
        discount: p.discount,
        seller_rating: p.seller_rating,
        rating: p.rating,
        reviews_count: p.reviews_count,
        delivery_days: p.delivery_days,
        warranty: p.warranty,
        historical_price: p.historical_price,
        review_snippets: p.review_snippets,
        product_url: p.product_url || "#",
        image_url: p.image_url,
        data_source: p.data_source,
        in_stock: p.in_stock
      }));
    }
  } catch (err) {
    console.warn("⚠️  Real product search failed, falling back to mock data:", err.message);
  }

  // Final fallback: use mock data
  console.log("📦 Using fallback mock data.");
  const mockProducts = getFallbackProducts(query);

  return mockProducts.map((p) => ({
    id: p.id,
    platform: p.platform,
    title: p.title,
    brand: p.brand || "",
    price: p.price,
    original_price: p.original_price,
    seller_rating: p.seller_rating,
    delivery_days: p.delivery_days,
    warranty: p.warranty,
    historical_price: p.historical_price,
    review_snippets: p.review_snippets,
    product_url: "#",
    data_source: "mock"
  }));
}
