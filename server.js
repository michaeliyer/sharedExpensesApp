require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontEnd")));

// CRITICAL: This deployment includes backend timezone fixes
console.log("🚀 SERVER STARTING WITH BACKEND TIMEZONE FIXES DEPLOYED 🚀");
console.log(
  "📅 All date processing now handled server-side to prevent timezone issues"
);
console.log("🔧 API endpoints will log date processing for debugging");

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.MASTER_USERNAME &&
    password === process.env.MASTER_PASSWORD
  ) {
    const token = jwt.sign({ username }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use("/api", authenticateToken);
app.use("/api", require("./api"));

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
pool.query(schema, (err) => {
  if (err) {
    console.error("Error executing schema:", err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

console.log("Monthly Totals are so so so Cool, Man!");
