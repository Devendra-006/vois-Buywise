import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { runSupervisorAgent } from "./supervisorAgent.js";
import { fetchRealProducts, getCacheStats, clearCache } from "./productDataService.js";
import { detectLanguage, translateToEnglish, translateFromEnglish, isIndianLanguage } from "./languageService.js";
import {
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  updateSearchHistory,
  addToRecentlyViewed,
  addToWishlist,
  removeFromWishlist,
  updatePreferences,
  getSearchHistory,
  getRecentlyViewed,
  getWishlist
} from "./authService.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "../../public")));

app.get("/health", (req, res) => {
  res.json({
    name: "BuyWise – Agentic AI Buying Assistant",
    status: "ok",
    message: "Backend is running. Frontend is served from /.",
    dataSources: {
      serpapi: !!process.env.SERPAPI_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY
    },
    cache: getCacheStats()
  });
});

// Direct product search endpoint (for testing real data)
app.post("/api/products", async (req, res) => {
  try {
    const { query, forceRefresh } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'query' field" });
    }

    const products = await fetchRealProducts(query, { forceRefresh: !!forceRefresh });
    
    res.json({
      query,
      count: products?.length || 0,
      products: products || [],
      cache: getCacheStats()
    });
  } catch (err) {
    console.error("Error in /api/products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cache management endpoints
app.get("/api/cache/stats", (req, res) => {
  res.json(getCacheStats());
});

app.post("/api/cache/clear", (req, res) => {
  clearCache();
  res.json({ message: "Cache cleared successfully" });
});

app.post("/api/recommendations", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.id;
      }
    }

    const { query, weights, userProfile, targetLang } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'query' field" });
    }

    const detectedLang = detectLanguage(query);
    let processedQuery = query;
    let translationResult = null;

    if (detectedLang.code !== "en") {
      console.log(`🌍 Detected language: ${detectedLang.name} (${detectedLang.code})`);
      translationResult = await translateToEnglish(query, detectedLang.code);
      processedQuery = translationResult.translated;
    }

    const weightsToUse = userProfile?.weights || weights || {
      price: 0.3,
      reviews: 0.3,
      rating: 0.2,
      delivery: 0.2
    };

    const result = await runSupervisorAgent({
      query: processedQuery,
      weights: weightsToUse,
      userProfile: userProfile || {},
      originalQuery: query,
      detectedLanguage: detectedLang,
      targetLang: targetLang || detectedLang.code
    });

    if (userId) {
      await updateSearchHistory(userId, query);
      if (result.topPicks && result.topPicks.length > 0) {
        await addToRecentlyViewed(userId, result.topPicks[0]);
      }
    }

    result.language = {
      detected: detectedLang,
      translated: translationResult?.originalLang !== "en",
      originalLang: translationResult?.originalLang || "en"
    };

    res.json(result);
  } catch (err) {
    console.error("Error in /api/recommendations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body || {};
    
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'text' field" });
    }

    let result;
    if (sourceLang && sourceLang !== "en") {
      result = await translateToEnglish(text, sourceLang);
    } else if (targetLang && targetLang !== "en") {
      result = await translateFromEnglish(text, targetLang);
    } else {
      const detected = detectLanguage(text);
      if (detected.code !== "en") {
        result = await translateToEnglish(text, detected.code);
      } else {
        result = { translated: text };
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Error in /api/translate:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/detect-language", (req, res) => {
  const { text } = req.query;
  if (!text) {
    return res.status(400).json({ error: "Missing 'text' query parameter" });
  }
  const result = detectLanguage(text);
  res.json(result);
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = decoded;
  next();
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await registerUser({ email, password, name });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await loginUser({ email, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get("/api/user/profile", authenticate, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

app.put("/api/user/preferences", authenticate, async (req, res) => {
  try {
    const preferences = await updatePreferences(req.user.id, req.body);
    res.json({ preferences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/user/history", authenticate, (req, res) => {
  const history = getSearchHistory(req.user.id);
  res.json({ history });
});

app.get("/api/user/recently-viewed", authenticate, (req, res) => {
  const recentlyViewed = getRecentlyViewed(req.user.id);
  res.json({ recentlyViewed });
});

app.get("/api/user/wishlist", authenticate, (req, res) => {
  const wishlist = getWishlist(req.user.id);
  res.json({ wishlist });
});

app.post("/api/user/wishlist", authenticate, async (req, res) => {
  try {
    const { product } = req.body || {};
    if (!product) {
      return res.status(400).json({ error: "Product required" });
    }
    const wishlist = await addToWishlist(req.user.id, product);
    res.json({ wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/user/wishlist/:productId", authenticate, async (req, res) => {
  try {
    const wishlist = await removeFromWishlist(req.user.id, req.params.productId);
    res.json({ wishlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`BuyWise backend listening on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to use BuyWise.`);
  console.log(`\n📡 Data Sources:`);
  console.log(`   SerpAPI: ${process.env.SERPAPI_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   OpenRouter: ${process.env.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});


