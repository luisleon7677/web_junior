CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_sold_at_idx ON sales (sold_at DESC);
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  store_name TEXT NOT NULL,
  categories JSONB NOT NULL
);
INSERT INTO app_settings (id, store_name, categories)
VALUES (true, 'Barbería Francis', '["Shampoo", "Cera / Pomada", "Navaja / Hojas", "Crema", "Toalla", "Colonia", "Otro"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
