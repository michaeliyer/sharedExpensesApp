-- -- Add unique constraint if not already present (safe for existing DBs)
-- ALTER TABLE categories ADD CONSTRAINT unique_category_name UNIQUE (name);

-- CREATE TABLE IF NOT EXISTS categories (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL UNIQUE
-- );

-- CREATE TABLE IF NOT EXISTS expenses (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   amount REAL NOT NULL,
--   type TEXT CHECK(type IN ('expense', 'deposit')) NOT NULL,
--   description TEXT,
--   category_id INTEGER REFERENCES categories(id),
--   date DATE DEFAULT CURRENT_DATE
-- );

-- INSERT INTO categories (name) VALUES ('Shopping'), ('Miscellaneous'), ('Food'), ('Transport') ON CONFLICT (name) DO NOTHING;

-- Create categories table with built-in unique constraint on name
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Only add constraint if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_category_name'
    ) THEN
        ALTER TABLE categories ADD CONSTRAINT unique_category_name UNIQUE (name);
    END IF;
END
$$;

-- Create expenses table with timezone-aware default date
-- TIMEZONE FIX: Use America/New_York timezone to prevent one-day-off issues
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('expense', 'deposit')) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES categories(id),
  date DATE DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date
);

-- Seed default categories if they don't already exist
INSERT INTO categories (name)
VALUES ('Shopping'), ('Miscellaneous'), ('Food'), ('Transport')
ON CONFLICT (name) DO NOTHING;