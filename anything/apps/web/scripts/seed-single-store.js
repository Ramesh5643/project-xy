import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import argon2 from 'argon2';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '.env');
try {
  dotenv.config({ path: envPath });
} catch {}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

const storeSlug = process.env.SINGLE_TENANT_STORE_SLUG || 'onlinebdshop';
const storeName = process.env.SINGLE_TENANT_STORE_NAME || 'OnlineBdshop';
const adminEmail = process.env.SINGLE_TENANT_ADMIN_EMAIL || 'admin@acme.com';
const adminPassword = process.env.SINGLE_TENANT_ADMIN_PASSWORD || 'Secure123!';
const adminName = process.env.SINGLE_TENANT_ADMIN_NAME || 'Super Admin';

async function ensureSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS stores (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      custom_domain text UNIQUE,
      description text,
      logo_url text,
      contact_email text,
      contact_phone text,
      currency character(3) DEFAULT 'BDT',
      theme_config jsonb DEFAULT '{}',
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS roles (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
      name text NOT NULL,
      permissions jsonb DEFAULT '{}',
      created_at timestamptz DEFAULT now(),
      UNIQUE(name, store_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES roles(id),
      email text NOT NULL,
      password_hash text NOT NULL,
      full_name text,
      is_active boolean DEFAULT true,
      is_superadmin boolean DEFAULT false,
      last_login_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(store_id, email)
    );

    CREATE TABLE IF NOT EXISTS products (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      sku text NOT NULL,
      name text NOT NULL,
      description text,
      price numeric(12,2) DEFAULT 0,
      currency character(3) DEFAULT 'USD',
      stock_quantity integer DEFAULT 0,
      dynamic_attributes jsonb DEFAULT '{}',
      image_url text,
      status text DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(store_id, sku)
    );

    CREATE TABLE IF NOT EXISTS shipping_zones (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      name text NOT NULL,
      code text NOT NULL,
      delivery_charge numeric(10,2) DEFAULT 0,
      estimated_days text,
      is_active boolean DEFAULT true,
      sort_order integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      UNIQUE(store_id, code)
    );

    CREATE TABLE IF NOT EXISTS store_order_sequences (
      store_id uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
      last_seq integer DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      order_number text NOT NULL,
      status text DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','returned','cancelled')),
      customer_name text NOT NULL,
      customer_phone text NOT NULL,
      customer_email text,
      customer_address jsonb DEFAULT '{}',
      shipping_zone_id uuid REFERENCES shipping_zones(id) ON DELETE SET NULL,
      shipping_zone_name text,
      shipping_zone_code text,
      shipping_charge numeric(10,2) DEFAULT 0,
      estimated_delivery text,
      payment_method text DEFAULT 'cod',
      payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','failed','refunded')),
      payment_meta jsonb DEFAULT '{}',
      currency character(3) DEFAULT 'BDT',
      subtotal numeric(12,2) DEFAULT 0,
      discount_amount numeric(12,2) DEFAULT 0,
      shipping_total numeric(12,2) DEFAULT 0,
      grand_total numeric(12,2) DEFAULT 0,
      capi_events_fired jsonb DEFAULT '{}',
      notes text,
      source text DEFAULT 'admin',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(store_id, order_number)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      product_id uuid REFERENCES products(id) ON DELETE SET NULL,
      sku text NOT NULL,
      name text NOT NULL,
      unit_price numeric(12,2) NOT NULL,
      quantity integer NOT NULL CHECK (quantity > 0),
      line_total numeric(12,2) NOT NULL,
      dynamic_attributes jsonb DEFAULT '{}',
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      from_status text,
      to_status text NOT NULL,
      changed_by uuid,
      note text,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS integration_configs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      integration text NOT NULL,
      label text NOT NULL,
      category text DEFAULT 'payment',
      credentials jsonb DEFAULT '{}',
      public_config jsonb DEFAULT '{}',
      is_active boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(store_id, integration)
    );
  `);
}

async function main() {
  await ensureSchema();

  const existing = await pool.query('SELECT id FROM stores WHERE slug = $1 LIMIT 1', [storeSlug]);
  if (existing.rows[0]) {
    console.log(`Store ${storeSlug} already exists.`);
    await pool.end();
    return;
  }

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const storeResult = await pool.query(
    `INSERT INTO stores (name, slug, currency, is_active, description, contact_email, theme_config)
     VALUES ($1, $2, $3, true, $4, $5, $6)
     RETURNING id, name, slug`,
    [
      storeName,
      storeSlug,
      'BDT',
      'Single-tenant storefront for BusinessOS',
      adminEmail,
      JSON.stringify({
        hero_heading: 'Welcome to your online store',
        hero_subheading: 'Fast delivery across Bangladesh',
        show_new_arrivals: true,
        show_trending: true,
      }),
    ],
  );

  const store = storeResult.rows[0];
  const roleResult = await pool.query(
    `INSERT INTO roles (store_id, name, permissions) VALUES ($1, $2, $3) RETURNING id`,
    [store.id, 'Admin', JSON.stringify({ '*': ['*'] })],
  );

  await pool.query(
    `INSERT INTO users (store_id, role_id, email, password_hash, full_name, is_active)
     VALUES ($1, $2, $3, $4, $5, true)`,
    [store.id, roleResult.rows[0].id, adminEmail.toLowerCase(), passwordHash, adminName],
  );

  await pool.query(
    `INSERT INTO shipping_zones (store_id, name, code, delivery_charge, estimated_days, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, true, $6)`,
    [store.id, 'Dhaka City', 'dhaka-city', 60, '1-2 days', 1],
  );

  await pool.query(
    `INSERT INTO store_order_sequences (store_id, last_seq) VALUES ($1, 0) ON CONFLICT DO NOTHING`,
    [store.id],
  );

  console.log(`Seeded store ${store.slug} with admin ${adminEmail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(() => pool.end());
