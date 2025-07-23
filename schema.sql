CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('expense', 'deposit')) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  date DATE DEFAULT CURRENT_DATE
);

INSERT INTO categories (name) VALUES ('Shopping'), ('Miscellaneous'), ('Food'), ('Transport') ON CONFLICT (name) DO NOTHING;