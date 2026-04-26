app.get("/api/admins", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM admins ORDER BY created_at ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins." });
  }
});
