import { Router, type IRouter } from "express";
import { db, products, euthanasiaListings } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

function parseImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function rowToProduct(row: typeof products.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    category: row.category ?? "",
    breed: row.breed ?? "",
    age: row.age ?? "",
    gender: row.gender ?? "male",
    author: row.author ?? "",
    location: row.location,
    priceNGN: row.priceNGN ?? 0,
    priceUSD: row.priceUSD ?? 0,
    status: row.status,
    description: row.description ?? "",
    images: parseImages(row.images),
    vaccinated: row.vaccinated ?? false,
    dewormed: row.dewormed ?? false,
  };
}

function rowToListing(row: typeof euthanasiaListings.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    age: row.age,
    gender: row.gender,
    shelter: row.shelter,
    location: row.location,
    deadline: row.deadline,
    image: row.image ?? "",
    description: row.description ?? "",
    status: row.status,
    author: row.author ?? "",
    addedAt: row.addedAt,
  };
}

// ── Products ──────────────────────────────────────────────

router.get("/products", async (_req, res) => {
  try {
    const rows = await db.select().from(products).orderBy(asc(products.createdAt));
    res.json(rows.map(rowToProduct));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

router.post("/products", async (req, res) => {
  try {
    const { type, name, images, ...rest } = req.body;
    if (!type || !name) return res.status(400).json({ error: "type and name are required." });
    const prefix = type === "dog" ? "dog" : type === "cat" ? "cat" : "sup";
    const id = `${prefix}-${Date.now()}`;
    const imagesJson = Array.isArray(images)
      ? JSON.stringify(images)
      : typeof images === "string"
        ? JSON.stringify(images.split("\n").map((u: string) => u.trim()).filter(Boolean))
        : "[]";
    const [row] = await db.insert(products).values({
      id, type, name,
      images: imagesJson,
      location: rest.location ?? "",
      status: rest.status ?? "sale",
      priceNGN: rest.priceNGN ?? 0,
      priceUSD: rest.priceUSD ?? 0,
      category: rest.category ?? "",
      breed: rest.breed ?? "",
      age: rest.age ?? "",
      gender: rest.gender ?? "male",
      author: rest.author ?? "",
      description: rest.description ?? "",
      vaccinated: rest.vaccinated ?? false,
      dewormed: rest.dewormed ?? false,
    }).returning();
    res.json(rowToProduct(row));
  } catch (err) {
    res.status(500).json({ error: "Failed to create product." });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const { images, ...rest } = req.body;
    const updates: Partial<typeof products.$inferInsert> = { ...rest };
    if (images !== undefined) {
      updates.images = Array.isArray(images)
        ? JSON.stringify(images)
        : typeof images === "string"
          ? JSON.stringify(images.split("\n").map((u: string) => u.trim()).filter(Boolean))
          : "[]";
    }
    const [row] = await db.update(products).set(updates).where(eq(products.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ error: "Product not found." });
    res.json(rowToProduct(row));
  } catch (err) {
    res.status(500).json({ error: "Failed to update product." });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const rows = await db.delete(products).where(eq(products.id, req.params.id)).returning({ id: products.id });
    if (!rows.length) return res.status(404).json({ error: "Product not found." });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product." });
  }
});

// ── Euthanasia Listings ───────────────────────────────────

router.get("/euthanasia", async (_req, res) => {
  try {
    const rows = await db.select().from(euthanasiaListings).orderBy(asc(euthanasiaListings.addedAt));
    res.json(rows.map(rowToListing));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch euthanasia listings." });
  }
});

router.post("/euthanasia", async (req, res) => {
  try {
    const { name, species, deadline, ...rest } = req.body;
    if (!name) return res.status(400).json({ error: "name is required." });
    const id = `euth-${Date.now()}`;
    const addedAt = new Date().toISOString();
    const [row] = await db.insert(euthanasiaListings).values({
      id, name,
      species: species ?? "dog",
      deadline: deadline ?? new Date(Date.now() + 7 * 86400000).toISOString(),
      addedAt,
      breed: rest.breed ?? "",
      age: rest.age ?? "",
      gender: rest.gender ?? "unknown",
      shelter: rest.shelter ?? "",
      location: rest.location ?? "",
      image: rest.image ?? "",
      description: rest.description ?? "",
      status: rest.status ?? "at-risk",
      author: rest.author ?? "",
    }).returning();
    res.json(rowToListing(row));
  } catch (err) {
    res.status(500).json({ error: "Failed to create listing." });
  }
});

router.put("/euthanasia/:id", async (req, res) => {
  try {
    const [row] = await db.update(euthanasiaListings).set(req.body).where(eq(euthanasiaListings.id, req.params.id)).returning();
    if (!row) return res.status(404).json({ error: "Listing not found." });
    res.json(rowToListing(row));
  } catch (err) {
    res.status(500).json({ error: "Failed to update listing." });
  }
});

router.delete("/euthanasia/:id", async (req, res) => {
  try {
    const rows = await db.delete(euthanasiaListings).where(eq(euthanasiaListings.id, req.params.id)).returning({ id: euthanasiaListings.id });
    if (!rows.length) return res.status(404).json({ error: "Listing not found." });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete listing." });
  }
});

export default router;
