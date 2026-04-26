import { pgTable, text, timestamp, integer, varchar, real, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const storeSettings = pgTable("store_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  category: text("category").default(""),
  breed: text("breed").default(""),
  age: text("age").default(""),
  gender: text("gender").default("male"),
  author: text("author").default(""),
  location: text("location").notNull().default(""),
  priceNGN: real("price_ngn").default(0),
  priceUSD: real("price_usd").default(0),
  status: text("status").notNull().default("sale"),
  description: text("description").default(""),
  images: text("images").default("[]"),
  vaccinated: boolean("vaccinated").default(false),
  dewormed: boolean("dewormed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const euthanasiaListings = pgTable("euthanasia_listings", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull().default("dog"),
  breed: text("breed").notNull().default(""),
  age: text("age").notNull().default(""),
  gender: text("gender").notNull().default("unknown"),
  shelter: text("shelter").notNull().default(""),
  location: text("location").notNull().default(""),
  deadline: text("deadline").notNull().default(""),
  image: text("image").default(""),
  description: text("description").default(""),
  status: text("status").notNull().default("at-risk"),
  author: text("author").default(""),
  addedAt: text("added_at").notNull().default(""),
});

export const orders = pgTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  type: text("type").notNull(),
  customerEmail: text("customer_email"),
  amountUSD: integer("amount_usd").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("paid"),
  items: text("items").notNull().default("[]"),
  metadata: text("metadata").notNull().default("{}"),
  trackingNumber: text("tracking_number"),
  trackingEvents: text("tracking_events").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
