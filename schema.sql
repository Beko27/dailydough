PRAGMA foreign_keys = ON;

CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  image_url TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  delivery_address TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('GCash', 'COD', 'Bank Transfer (InstaPay)', 'Credit Card')),
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending Confirmation',
  subtotal REAL NOT NULL,
  delivery_note TEXT NOT NULL DEFAULT 'Delivery fee will be manually computed and communicated after order confirmation.',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE business_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  gcash_number TEXT NOT NULL,
  gcash_qr_url TEXT NOT NULL,
  business_hours TEXT NOT NULL,
  preparation_time TEXT NOT NULL,
  cancellation_policy TEXT NOT NULL,
  return_policy TEXT NOT NULL,
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
