const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

router.post("/add", async (req, res) => {
  const { name, amount, type, description, category_id, date } = req.body;

  // TIMEZONE FIX: Explicitly use America/New_York timezone
  console.log("API received date:", date);
  let processedDate = date;
  if (date) {
    // Create date in America/New_York timezone to prevent UTC conversion
    const [year, month, day] = date.split("-");
    const nyDate = new Date(year, month - 1, day); // month is 0-indexed
    // Format as YYYY-MM-DD in local timezone
    processedDate = nyDate.toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD format
    console.log("API processed date (NY timezone):", processedDate);
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (name, amount, type, description, category_id, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, amount, type, description, category_id, processedDate]
    );
    res.send({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/add-category", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`,
      [name]
    );
    res.json({ success: true, id: result.rows[0]?.id });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/categories", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`,
      [name]
    );
    res.json({ success: true, id: result.rows[0]?.id });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/categories", async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM categories ORDER BY name`);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/names", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT name FROM expenses ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/entries", async (req, res) => {
  try {
    let query = `
      SELECT
        e.id,
        e.name,
        e.amount,
        e.type,
        e.description,
        COALESCE(c.name, 'Uncategorized') as categoryname,
        e.date
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
    `;
    const whereClauses = [];
    const queryParams = [];

    if (req.query.name) {
      whereClauses.push(`e.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${req.query.name}%`);
    }
    if (req.query.month) {
      // Use BETWEEN for first and last day of the month
      const [year, month] = req.query.month.split("-");
      const startDate = `${year}-${month}-01`;
      // Get last day of month - use month+1 for 0-indexed Date constructor
      const endDate = new Date(year, parseInt(month) + 1, 0)
        .toISOString()
        .slice(0, 10);
      whereClauses.push(
        `e.date BETWEEN $${queryParams.length + 1} AND $${
          queryParams.length + 2
        }`
      );
      queryParams.push(startDate, endDate);
    }
    if (req.query.startDate && req.query.endDate) {
      whereClauses.push(
        `e.date BETWEEN $${queryParams.length + 1} AND $${
          queryParams.length + 2
        }`
      );
      queryParams.push(req.query.startDate, req.query.endDate);
    }
    if (req.query.category_id) {
      whereClauses.push(`e.category_id = $${queryParams.length + 1}`);
      queryParams.push(req.query.category_id);
    }
    if (req.query.categoryname) {
      whereClauses.push(
        `COALESCE(c.name, 'Uncategorized') ILIKE $${queryParams.length + 1}`
      );
      queryParams.push(req.query.categoryname);
    }
    if (req.query.type) {
      whereClauses.push(`e.type = $${queryParams.length + 1}`);
      queryParams.push(req.query.type);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    query += ` ORDER BY e.date DESC`;

    const { rows } = await pool.query(query, queryParams);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/totals", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT TO_CHAR(date, 'YYYY-MM') as month FROM expenses ORDER BY month DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/grand-totals", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(c.name, 'Uncategorized') as categoryName,
        COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) AS totalExpenses,
        COALESCE(SUM(CASE WHEN e.type = 'deposit' THEN e.amount ELSE 0 END), 0) AS totalDeposits
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id
      GROUP BY c.name
      ORDER BY c.name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/monthly-totals/:month", async (req, res) => {
  const month = req.params.month;
  try {
    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(c.name, 'Uncategorized') as categoryName,
        SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END) AS monthlyExpenses,
        SUM(CASE WHEN e.type = 'deposit' THEN e.amount ELSE 0 END) AS monthlyDeposits
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE TO_CHAR(e.date, 'YYYY-MM') = $1
      GROUP BY categoryName
      ORDER BY categoryName ASC
    `,
      [month]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/transactions/:month", async (req, res) => {
  const month = req.params.month;
  try {
    const { rows } = await pool.query(
      `
      SELECT
        e.id,
        e.name,
        e.amount,
        e.type,
        e.description,
        COALESCE(c.name, 'Uncategorized') as categoryName,
        e.date
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE TO_CHAR(e.date, 'YYYY-MM') = $1
      ORDER BY e.date DESC
    `,
      [month]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/transaction/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const { rows } = await pool.query(`SELECT * FROM expenses WHERE id = $1`, [
      id,
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/delete-transaction/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(`DELETE FROM expenses WHERE id = $1`, [id]);
    res.json({ success: true, changes: result.rowCount });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put("/update-transaction/:id", async (req, res) => {
  const id = req.params.id;
  const { name, amount, type, description, category_id, date } = req.body;

  // TIMEZONE FIX: Explicitly use America/New_York timezone
  console.log("API update received date:", date);
  let processedDate = date;
  if (date) {
    // Create date in America/New_York timezone to prevent UTC conversion
    const [year, month, day] = date.split("-");
    const nyDate = new Date(year, month - 1, day); // month is 0-indexed
    // Format as YYYY-MM-DD in local timezone
    processedDate = nyDate.toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD format
    console.log("API update processed date (NY timezone):", processedDate);
  }

  try {
    const result = await pool.query(
      `UPDATE expenses SET name = $1, amount = $2, type = $3, description = $4, category_id = $5, date = $6 WHERE id = $7`,
      [name, amount, type, description, category_id, processedDate, id]
    );
    res.json({ success: true, changes: result.rowCount });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/ytd-totals/:month", async (req, res) => {
  const month = req.params.month;
  try {
    const { rows } = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS ytdExpenses,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) AS ytdDeposits
      FROM expenses
      WHERE TO_CHAR(date, 'YYYY-MM') <= $1
    `,
      [month]
    );
    res.json(rows[0] || { ytdExpenses: 0, ytdDeposits: 0 });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/total-deposits", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS totalDeposits FROM expenses WHERE type = 'deposit'`
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/category/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const expenses = await pool.query(
      `SELECT id FROM expenses WHERE category_id = $1`,
      [id]
    );
    if (expenses.rows.length > 0) {
      return res.status(400).json({
        error:
          "Category is not empty and cannot be deleted. Please Clear Data!",
      });
    }
    await pool.query(`DELETE FROM categories WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put("/category/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    res.json({ success: true, category: result.rows[0] });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/entries-by-category/:categoryName", async (req, res) => {
  const { categoryName } = req.params;
  try {
    let query, params;
    if (categoryName === "Uncategorized") {
      query = `SELECT e.* FROM expenses e WHERE e.category_id IS NULL ORDER BY e.date DESC`;
      params = [];
    } else {
      query = `SELECT e.* FROM expenses e JOIN categories c ON e.category_id = c.id WHERE c.name = $1 ORDER BY e.date DESC`;
      params = [categoryName];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/all-deposits", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM expenses WHERE type = 'deposit' ORDER BY date DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
