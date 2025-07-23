const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const db = new sqlite3.Database("expenses.db");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontEnd")));

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema, (err) => {
  if (err) {
    console.error("Error executing schema:", err.message);
  }
});
/*
db.run(`CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  amount REAL,
  type TEXT,
  description TEXT,
  date TEXT DEFAULT CURRENT_DATE
);`);
*/
app.post("/add", (req, res) => {
  const { name, amount, type, description, category_id, date } = req.body;
  db.run(
    `INSERT INTO expenses (name, amount, type, description, category_id, date) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, amount, type, description, category_id, date],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.send({ success: true, id: this.lastID });
    }
  );
});

app.post("/add-category", (req, res) => {
  const { name } = req.body;
  db.run(
    `INSERT OR IGNORE INTO categories (name) VALUES (?)`,
    [name],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get("/categories", (req, res) => {
  db.all(`SELECT * FROM categories ORDER BY name`, [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.get("/entries", (req, res) => {
  db.all(
    `
    SELECT
      e.id,
      e.name,
      e.amount,
      e.type,
      e.description,
      c.name as categoryName,
      e.date
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    ORDER BY e.date DESC
  `,
    [],
    (err, rows) => {
      if (err) return res.status(500).send(err.message);
      res.json(rows);
    }
  );
});

app.get("/totals", (req, res) => {
  const query = `SELECT DISTINCT strftime('%Y-%m', date) as month FROM expenses ORDER BY month DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(rows);
  });
});

app.get("/grand-totals", (req, res) => {
  const query = `
    SELECT
      c.name as categoryName,
      SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END) AS totalExpenses,
      SUM(CASE WHEN e.type = 'deposit' THEN e.amount ELSE 0 END) AS totalDeposits
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    GROUP BY categoryName
    ORDER BY categoryName ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(rows);
  });
});

app.get("/monthly-totals/:month", (req, res) => {
  const month = req.params.month;
  const query = `
    SELECT
      c.name as categoryName,
      SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END) AS monthlyExpenses,
      SUM(CASE WHEN e.type = 'deposit' THEN e.amount ELSE 0 END) AS monthlyDeposits
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE strftime('%Y-%m', e.date) = ?
    GROUP BY categoryName
    ORDER BY categoryName ASC
  `;
  db.all(query, [month], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(rows);
  });
});

app.get("/transactions/:month", (req, res) => {
  const month = req.params.month;
  const query = `
    SELECT
      e.id,
      e.name,
      e.amount,
      e.type,
      e.description,
      c.name as categoryName,
      e.date
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE strftime('%Y-%m', e.date) = ?
    ORDER BY e.date DESC
  `;
  db.all(query, [month], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(rows);
  });
});

app.get("/transaction/:id", (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM expenses WHERE id = ?`, id, (err, row) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(row);
  });
});

app.delete("/delete-transaction/:id", (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM expenses WHERE id = ?`, id, function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json({ success: true, changes: this.changes });
  });
});

app.put("/update-transaction/:id", (req, res) => {
  const id = req.params.id;
  const { name, amount, type, description, category_id, date } = req.body;
  db.run(
    `UPDATE expenses SET name = ?, amount = ?, type = ?, description = ?, category_id = ?, date = ? WHERE id = ?`,
    [name, amount, type, description, category_id, date, id],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.json({ success: true, changes: this.changes });
    }
  );
});

app.get("/ytd-totals/:month", (req, res) => {
  const month = req.params.month;
  const query = `
    SELECT
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS ytdExpenses,
      SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) AS ytdDeposits
    FROM expenses
    WHERE strftime('%Y-%m', date) <= ?
  `;
  db.get(query, [month], (err, row) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(row);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
