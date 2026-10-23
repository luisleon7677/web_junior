import 'dotenv/config'
import pg from 'pg'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL es obligatorio')
const databaseUrl = new URL(process.env.DATABASE_URL)
databaseUrl.searchParams.set('sslmode', 'verify-full')
export const pool = new pg.Pool({
  connectionString: databaseUrl.toString(),
  ssl: { rejectUnauthorized: true },
  max: 10,
  idleTimeoutMillis: 30000
})

export const productJson = row => ({
  id: Number(row.id), name: row.name, category: row.category,
  stock: row.stock, price: Number(row.price), minStock: row.min_stock
})
export const saleJson = row => ({
  id: Number(row.id), productId: row.product_id && Number(row.product_id),
  productName: row.product_name, quantity: row.quantity,
  unitPrice: Number(row.unit_price), total: Number(row.total), date: row.sold_at
})
