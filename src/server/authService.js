import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

let dbAvailable = false;
let inMemoryUsers = new Map();
let inMemoryData = {
  searchHistory: [],
  recentlyViewed: [],
  wishlist: [],
  priceAlerts: []
};

async function checkDbConnection() {
  try {
    await pool.query("SELECT 1");
    dbAvailable = true;
    console.log("✅ PostgreSQL connected");
    return true;
  } catch (err) {
    console.warn("⚠️ PostgreSQL unavailable, using in-memory storage");
    dbAvailable = false;
    return false;
  }
}

checkDbConnection();

export function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function registerUser({ email, password, name }) {
  if (dbAvailable) {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      throw new Error("Email already registered");
    }

    const passwordHash = hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, preferences, created_at",
      [email, passwordHash, name || email.split("@")[0]]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        createdAt: user.created_at
      },
      token
    };
  } else {
    if (inMemoryUsers.has(email)) {
      throw new Error("Email already registered");
    }

    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      email,
      passwordHash: hashPassword(password),
      name: name || email.split("@")[0],
      preferences: {},
      createdAt: new Date().toISOString()
    };

    inMemoryUsers.set(email, user);
    const token = generateToken(user);

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}

export async function loginUser({ email, password }) {
  if (dbAvailable) {
    const passwordHash = hashPassword(password);
    const result = await pool.query(
      "SELECT id, email, name, preferences, created_at FROM users WHERE email = $1 AND password_hash = $2",
      [email, passwordHash]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = result.rows[0];
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        createdAt: user.created_at
      },
      token
    };
  } else {
    const user = inMemoryUsers.get(email);
    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new Error("Invalid email or password");
    }

    const token = generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}

export async function getUserById(userId) {
  if (dbAvailable) {
    const result = await pool.query(
      "SELECT id, email, name, preferences, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      preferences: user.preferences,
      createdAt: user.created_at
    };
  } else {
    for (const user of inMemoryUsers.values()) {
      if (user.id === userId) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }
}

export async function updateSearchHistory(userId, query) {
  if (dbAvailable) {
    await pool.query(
      "INSERT INTO search_history (user_id, query) VALUES ($1, $2)",
      [userId, query]
    );

    await pool.query(
      `DELETE FROM search_history 
       WHERE user_id = $1 
       AND id NOT IN (
         SELECT id FROM search_history 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         LIMIT 50
       )`,
      [userId]
    );
  } else {
    inMemoryData.searchHistory.unshift({ userId, query, timestamp: new Date().toISOString() });
    inMemoryData.searchHistory = inMemoryData.searchHistory
      .filter(h => h.userId === userId)
      .slice(0, 50);
  }
}

export async function addToRecentlyViewed(userId, product) {
  if (dbAvailable) {
    await pool.query(
      "DELETE FROM recently_viewed WHERE user_id = $1 AND product_id = $2",
      [userId, product.id]
    );

    await pool.query(
      "INSERT INTO recently_viewed (user_id, product_id, product_name, product_image, product_price) VALUES ($1, $2, $3, $4, $5)",
      [userId, product.id, product.name, product.image, product.price]
    );

    await pool.query(
      `DELETE FROM recently_viewed 
       WHERE user_id = $1 
       AND id NOT IN (
         SELECT id FROM recently_viewed 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         LIMIT 20
       )`,
      [userId]
    );
  } else {
    inMemoryData.recentlyViewed = inMemoryData.recentlyViewed.filter(p => !(p.userId === userId && p.productId === product.id));
    inMemoryData.recentlyViewed.unshift({
      userId,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      productPrice: product.price,
      timestamp: new Date().toISOString()
    });
    inMemoryData.recentlyViewed = inMemoryData.recentlyViewed
      .filter(p => p.userId === userId)
      .slice(0, 20);
  }
}

export async function getRecentlyViewed(userId) {
  if (dbAvailable) {
    const result = await pool.query(
      "SELECT product_id, product_name, product_image, product_price, timestamp FROM recently_viewed WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 20",
      [userId]
    );
    return result.rows;
  } else {
    return inMemoryData.recentlyViewed
      .filter(p => p.userId === userId)
      .map(p => ({
        product_id: p.productId,
        product_name: p.productName,
        product_image: p.productImage,
        product_price: p.productPrice,
        timestamp: p.timestamp
      }));
  }
}

export async function addToWishlist(userId, product) {
  if (dbAvailable) {
    await pool.query(
      "INSERT INTO wishlist (user_id, product_id, product_name, product_image, product_price) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
      [userId, product.id, product.name, product.image, product.price]
    );

    return getWishlist(userId);
  } else {
    const exists = inMemoryData.wishlist.find(p => p.userId === userId && p.productId === product.id);
    if (!exists) {
      inMemoryData.wishlist.unshift({
        userId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        addedAt: new Date().toISOString()
      });
    }
    return getWishlist(userId);
  }
}

export async function removeFromWishlist(userId, productId) {
  if (dbAvailable) {
    await pool.query(
      "DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );
    return getWishlist(userId);
  } else {
    inMemoryData.wishlist = inMemoryData.wishlist.filter(
      p => !(p.userId === userId && p.productId === productId)
    );
    return getWishlist(userId);
  }
}

export async function getWishlist(userId) {
  if (dbAvailable) {
    const result = await pool.query(
      "SELECT product_id, product_name, product_image, product_price, added_at FROM wishlist WHERE user_id = $1 ORDER BY added_at DESC",
      [userId]
    );
    return result.rows;
  } else {
    return inMemoryData.wishlist
      .filter(p => p.userId === userId)
      .map(p => ({
        product_id: p.productId,
        product_name: p.productName,
        product_image: p.productImage,
        product_price: p.productPrice,
        added_at: p.addedAt
      }));
  }
}

export async function updatePreferences(userId, preferences) {
  if (dbAvailable) {
    const result = await pool.query(
      "UPDATE users SET preferences = preferences || $1, updated_at = NOW() WHERE id = $2 RETURNING preferences",
      [JSON.stringify(preferences), userId]
    );
    return result.rows[0]?.preferences || {};
  } else {
    for (const user of inMemoryUsers.values()) {
      if (user.id === userId) {
        user.preferences = { ...user.preferences, ...preferences };
        return user.preferences;
      }
    }
    return {};
  }
}

export async function getSearchHistory(userId) {
  if (dbAvailable) {
    const result = await pool.query(
      "SELECT query, timestamp FROM search_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50",
      [userId]
    );
    return result.rows;
  } else {
    return inMemoryData.searchHistory
      .filter(h => h.userId === userId)
      .map(h => ({
        query: h.query,
        timestamp: h.timestamp
      }));
  }
}

export async function addPriceAlert(userId, product, targetPrice) {
  if (dbAvailable) {
    const result = await pool.query(
      "INSERT INTO price_alerts (user_id, product_id, product_name, target_price, current_price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, product.id, product.name, targetPrice, product.price]
    );
    return result.rows[0];
  } else {
    const alert = {
      id: inMemoryData.priceAlerts.length + 1,
      userId,
      productId: product.id,
      productName: product.name,
      targetPrice,
      currentPrice: product.price,
      createdAt: new Date().toISOString()
    };
    inMemoryData.priceAlerts.push(alert);
    return alert;
  }
}

export async function getPriceAlerts(userId) {
  if (dbAvailable) {
    const result = await pool.query(
      "SELECT * FROM price_alerts WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  } else {
    return inMemoryData.priceAlerts.filter(a => a.userId === userId);
  }
}

export async function deletePriceAlert(alertId, userId) {
  if (dbAvailable) {
    await pool.query(
      "DELETE FROM price_alerts WHERE id = $1 AND user_id = $2",
      [alertId, userId]
    );
  } else {
    inMemoryData.priceAlerts = inMemoryData.priceAlerts.filter(
      a => !(a.id === alertId && a.userId === userId)
    );
  }
}
