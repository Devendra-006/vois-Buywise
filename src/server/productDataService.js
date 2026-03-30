import fetch from "node-fetch";

const SERPAPI_BASE = "https://serpapi.com/search";
const CACHE_TTL = 3600;

const cache = new Map();

function generateCacheKey(query, source) {
    return `product:${source}:${query.toLowerCase().trim()}`;
}

function getFromCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL * 1000) {
        console.log(`📦 Cache hit for: ${key}`);
        return cached.data;
    }
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

async function searchWithSerpAPI(query) {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
        console.warn("⚠️ SERPAPI_KEY not configured");
        return null;
    }

    try {
        console.log(`🔍 SerpAPI: Searching for "${query}"...`);
        
        const params = new URLSearchParams({
            engine: "google_shopping",
            q: query,
            api_key: apiKey,
            num: 10
        });

        const response = await fetch(`${SERPAPI_BASE}?${params}`);
        
        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ SerpAPI error: ${response.status}`, errText);
            return null;
        }

        const data = await response.json();
        const shoppingResults = data.shopping_results || [];

        if (shoppingResults.length === 0) {
            console.log("⚠️ SerpAPI returned no results");
            return null;
        }

        console.log(`✅ SerpAPI returned ${shoppingResults.length} products`);

        return shoppingResults.map((item, index) => ({
            id: `serp_${index + 1}`,
            platform: extractPlatform(item.source),
            title: item.title || "Unknown Product",
            brand: item.brand || extractBrand(item.title),
            price: parsePrice(item.price),
            original_price: parsePrice(item.original_price) || parsePrice(item.price),
            discount: item.discount ? parseInt(item.discount.replace(/[^0-9]/g, "")) : 0,
            rating: item.rating || null,
            reviews_count: item.reviews || 0,
            delivery_days: estimateDelivery(item.delivery),
            warranty: "1 year",
            product_url: item.link || "#",
            image_url: item.thumbnail || null,
            seller_rating: item.extensions?.find(e => e.includes("★")) ? 
                parseFloat(e.match(/[\d.]+/)?.[0] || 4.0) : 4.0,
            review_snippets: [],
            historical_price: [parsePrice(item.original_price) || parsePrice(item.price), parsePrice(item.price)],
            data_source: "serpapi",
            in_stock: !item.availability || item.availability.toLowerCase().includes("in stock")
        }));
    } catch (err) {
        console.error("❌ SerpAPI search failed:", err.message);
        return null;
    }
}

function extractPlatform(source) {
    if (!source) return "Unknown";
    const s = source.toLowerCase();
    if (s.includes("amazon")) return "Amazon";
    if (s.includes("flipkart")) return "Flipkart";
    if (s.includes("croma")) return "Croma";
    if (s.includes("reliance")) return "Reliance Digital";
    if (s.includes("myntra")) return "Myntra";
    if (s.includes("tatacliq")) return "Tata CLiQ";
    if (s.includes("jiomart")) return "JioMart";
    return source;
}

function extractBrand(title) {
    if (!title) return "";
    const brands = ["Samsung", "Apple", "OnePlus", "Xiaomi", "Realme", "Vivo", "Oppo", 
                   "Sony", "LG", "TCL", "Mi", "Redmi", "Motorola", "Nokia", "Poco",
                   "BoAt", "Noise", "JBL", "Fire-Boltt", "Noise", "Titan", "Casio"];
    for (const brand of brands) {
        if (title.toLowerCase().includes(brand.toLowerCase())) {
            return brand;
        }
    }
    return "";
}

function parsePrice(priceStr) {
    if (typeof priceStr === "number") return priceStr;
    if (!priceStr) return 0;
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, "");
    return parseInt(cleaned) || 0;
}

function estimateDelivery(deliveryStr) {
    if (!deliveryStr) return 3;
    const match = deliveryStr.match(/\d+/);
    return match ? parseInt(match[0]) : 3;
}

async function searchWithLLM(query) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn("⚠️ OPENROUTER_API_KEY not configured");
        return null;
    }

    try {
        console.log(`🤖 LLM: Generating product listings for "${query}"...`);
        
        const systemPrompt = `You are a Multi-Website Product Search Agent for Indian e-commerce.
Given a user query, return realistic product listings from major Indian e-commerce platforms.

PLATFORMS: Amazon India, Flipkart, Croma, Reliance Digital, Tata CLiQ

RULES:
1. Return EXACTLY 6 products from at least 3 different platforms
2. Include: 2 budget, 2 mid-range, 2 premium options
3. Use realistic Indian pricing (INR)
4. Include realistic review snippets (3 per product)
5. Return ONLY valid JSON array

FORMAT:
[
  {
    "id": "llm_1",
    "platform": "Amazon|Flipkart|Croma|Reliance Digital|Tata CLiQ",
    "title": "Brand Model Name with Key Specs",
    "brand": "BrandName",
    "price": 12999,
    "original_price": 17999,
    "seller_rating": 4.3,
    "delivery_days": 2,
    "warranty": "1 year",
    "product_url": "https://example.in/product",
    "review_snippets": ["Great product", "Good value", "Recommended"],
    "historical_price": [17999, 15999, 14499, 12999]
  }
]

Return ONLY JSON. No markdown.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost",
                "X-Title": "BuyWise Agentic Assistant"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Find products for: "${query}"` }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            console.error(`❌ LLM API error: ${response.status}`);
            return null;
        }

        const json = await response.json();
        let raw = json.choices?.[0]?.message?.content || "[]";
        raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        
        const products = JSON.parse(raw);
        
        if (!Array.isArray(products) || products.length === 0) {
            return null;
        }

        console.log(`✅ LLM returned ${products.length} products`);

        return products.map((p, i) => ({
            id: p.id || `llm_${i + 1}`,
            platform: p.platform || "Unknown",
            title: p.title || "Unknown Product",
            brand: p.brand || "",
            price: parsePrice(p.price),
            original_price: parsePrice(p.original_price) || parsePrice(p.price),
            seller_rating: typeof p.seller_rating === "number" ? Math.min(p.seller_rating, 5) : 4.0,
            delivery_days: p.delivery_days || 3,
            warranty: p.warranty || "1 year",
            product_url: p.product_url || "#",
            review_snippets: Array.isArray(p.review_snippets) ? p.review_snippets : [],
            historical_price: Array.isArray(p.historical_price) ? p.historical_price : [p.original_price, p.price],
            data_source: "llm"
        }));
    } catch (err) {
        console.error("❌ LLM search failed:", err.message);
        return null;
    }
}

export async function fetchRealProducts(query, options = {}) {
    const { forceRefresh = false, maxProducts = 10 } = options;
    const cacheKey = generateCacheKey(query, "primary");

    if (!forceRefresh) {
        const cached = getFromCache(cacheKey);
        if (cached && cached.length > 0) {
            return cached.slice(0, maxProducts);
        }
    }

    console.log(`\n${"═".repeat(60)}`);
    console.log(`🌐 PRODUCT DATA SERVICE: Fetching real products for "${query}"`);
    console.log(`${"═".repeat(60)}`);

    let products = null;

    if (process.env.SERPAPI_KEY) {
        products = await searchWithSerpAPI(query);
    }

    if (!products || products.length === 0) {
        console.log("🔄 Falling back to LLM-generated data...");
        products = await searchWithLLM(query);
    }

    if (products && products.length > 0) {
        setCache(cacheKey, products);
        console.log(`✅ Returning ${Math.min(products.length, maxProducts)} products (source: ${products[0].data_source})`);
        return products.slice(0, maxProducts);
    }

    console.log("⚠️ All real data sources failed");
    return null;
}

export function getCacheStats() {
    return {
        size: cache.size,
        entries: Array.from(cache.keys()),
        ttl: CACHE_TTL
    };
}

export function clearCache() {
    cache.clear();
    console.log("🗑️ Cache cleared");
}
