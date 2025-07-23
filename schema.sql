CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO categories (name) VALUES ('Shopping'), ('Miscellaneous'), ('Food'), ('Transport');

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('expense', 'deposit')) NOT NULL,
  description TEXT,
  category_id INTEGER,
  date TEXT DEFAULT CURRENT_DATE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);