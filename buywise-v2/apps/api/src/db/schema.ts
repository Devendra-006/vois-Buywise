import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  timestamp,
  bigserial,
  jsonb,
  integer,
  uniqueIndex,
  index
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  preferredLang: varchar("preferred_lang", { length: 10 }).default("en").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  store: varchar("store", { length: 100 }).notNull(),
  storeProductId: varchar("store_product_id", { length: 255 }).notNull(),
  title: text("title").notNull(),
  brand: varchar("brand", { length: 150 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  imageUrl: text("image_url"),
  url: text("url").notNull(),
  specs: jsonb("specs").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  uniqueIndex("store_product_unique_idx").on(table.store, table.storeProductId)
]);

export const priceSnapshots = pgTable("price_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  inStock: boolean("in_stock").default(true).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  index("price_snapshots_product_fetched_idx").on(table.productId, table.fetchedAt)
]);

export const searches = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  rawQuery: text("raw_query").notNull(),
  parsed: jsonb("parsed").$type<Record<string, any>>(),
  weights: jsonb("weights").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const searchResults = pgTable("search_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  searchId: uuid("search_id").references(() => searches.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  rank: integer("rank").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  breakdown: jsonb("breakdown").$type<Record<string, any>>()
});

export const wishlist = pgTable("wishlist", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  uniqueIndex("wishlist_user_product_unique_idx").on(table.userId, table.productId)
]);

export const priceAlerts = pgTable("price_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  targetPrice: numeric("target_price", { precision: 12, scale: 2 }).notNull(),
  active: boolean("active").default(true).notNull(),
  lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const llmCache = pgTable("llm_cache", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: jsonb("value").notNull(),
  ttlSeconds: integer("ttl_seconds").default(86400).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
