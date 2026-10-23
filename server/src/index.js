import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { timingSafeEqual } from 'node:crypto'
import { pool, productJson, saleJson } from './db.js'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(origin => origin.trim())
app.use(cors({ origin: origins }))
if (process.env.NODE_ENV === 'production' && (!process.env.API_USER || !process.env.API_PASSWORD)) {
  throw new Error('API_USER y API_PASSWORD son obligatorios en producción')
}
app.use('/api', (req, res, next) => {
  if (!process.env.API_USER || !process.env.API_PASSWORD) return next()
  const received = req.get('Authorization') || ''
  const expected = `Basic ${Buffer.from(`${process.env.API_USER}:${process.env.API_PASSWORD}`).toString('base64')}`
  const left = Buffer.from(received)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return res.status(401).json({ error: 'Credenciales incorrectas' })
  next()
})

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next)
const positiveInt = value => Number.isInteger(Number(value)) && Number(value) > 0
const validProduct = body =>
  typeof body.name === 'string' && body.name.trim().length > 0 &&
  typeof body.category === 'string' && body.category.trim().length > 0 &&
  Number.isInteger(Number(body.stock)) && Number(body.stock) >= 0 &&
  Number.isInteger(Number(body.minStock)) && Number(body.minStock) >= 0 &&
  Number.isFinite(Number(body.price)) && Number(body.price) >= 0 && Number(body.price) <= 9999999999.99
const productValues = body => [body.name.trim(), body.category.trim(), Number(body.stock), Number(body.price), Number(body.minStock)]

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true })
}))
app.get('/api/products', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY id')
  res.json(rows.map(productJson))
}))
app.post('/api/products', asyncRoute(async (req, res) => {
  if (!validProduct(req.body)) return res.status(400).json({ error: 'Datos de producto inválidos' })
  const { rows } = await pool.query('INSERT INTO products (name, category, stock, price, min_stock) VALUES ($1, $2, $3, $4, $5) RETURNING *', productValues(req.body))
  res.status(201).json(productJson(rows[0]))
}))
app.put('/api/products/:id', asyncRoute(async (req, res) => {
  if (!positiveInt(req.params.id) || !validProduct(req.body)) return res.status(400).json({ error: 'Datos de producto inválidos' })
  const { rows } = await pool.query('UPDATE products SET name=$1, category=$2, stock=$3, price=$4, min_stock=$5 WHERE id=$6 RETURNING *', [...productValues(req.body), req.params.id])
  if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json(productJson(rows[0]))
}))
app.delete('/api/products/:id', asyncRoute(async (req, res) => {
  if (!positiveInt(req.params.id)) return res.status(400).json({ error: 'ID inválido' })
  const result = await pool.query('DELETE FROM products WHERE id=$1', [req.params.id])
  if (!result.rowCount) return res.status(404).json({ error: 'Producto no encontrado' })
  res.status(204).end()
}))
app.post('/api/products/:id/movements', asyncRoute(async (req, res) => {
  const { direction, quantity } = req.body
  if (!positiveInt(req.params.id) || !['in', 'out'].includes(direction) || !positiveInt(quantity)) return res.status(400).json({ error: 'Movimiento inválido' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT * FROM products WHERE id=$1 FOR UPDATE', [req.params.id])
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Producto no encontrado' }) }
    const product = rows[0]
    if (direction === 'out' && product.stock < Number(quantity)) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Stock insuficiente' }) }
    const updated = await client.query('UPDATE products SET stock=stock+$1 WHERE id=$2 RETURNING *', [Number(quantity) * (direction === 'in' ? 1 : -1), req.params.id])
    await client.query('INSERT INTO stock_movements (product_id, product_name, direction, quantity) VALUES ($1,$2,$3,$4)', [req.params.id, product.name, direction, quantity])
    await client.query('COMMIT')
    res.json(productJson(updated.rows[0]))
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}))
app.get('/api/sales', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM sales ORDER BY sold_at DESC, id DESC')
  res.json(rows.map(saleJson))
}))
app.get('/api/settings', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT store_name, categories FROM app_settings WHERE id=true')
  res.json({ storeName: rows[0].store_name, categories: rows[0].categories })
}))
app.put('/api/settings', asyncRoute(async (req, res) => {
  const { storeName } = req.body
  if (typeof storeName !== 'string' || !storeName.trim()) {
    return res.status(400).json({ error: 'Configuración inválida' })
  }
  const { rows } = await pool.query('UPDATE app_settings SET store_name=$1 WHERE id=true RETURNING store_name, categories', [storeName.trim()])
  res.json({ storeName: rows[0].store_name, categories: rows[0].categories })
}))
const categoryName = value => typeof value === 'string' ? value.trim() : ''
const categoryExists = (categories, name) => categories.some(category => category.toLocaleLowerCase('es-PE') === name.toLocaleLowerCase('es-PE'))

app.post('/api/categories', asyncRoute(async (req, res) => {
  const name = categoryName(req.body.name)
  if (!name || name.length > 100) return res.status(400).json({ error: 'Nombre de categoría inválido' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT categories FROM app_settings WHERE id=true FOR UPDATE')
    const categories = rows[0].categories
    if (categoryExists(categories, name)) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Esta categoría ya existe' }) }
    categories.push(name)
    await client.query('UPDATE app_settings SET categories=$1 WHERE id=true', [JSON.stringify(categories)])
    await client.query('COMMIT')
    res.status(201).json(categories)
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}))

app.put('/api/categories/:name', asyncRoute(async (req, res) => {
  const oldName = req.params.name
  const name = categoryName(req.body.name)
  if (!name || name.length > 100) return res.status(400).json({ error: 'Nombre de categoría inválido' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT categories FROM app_settings WHERE id=true FOR UPDATE')
    const categories = rows[0].categories
    const index = categories.indexOf(oldName)
    if (index === -1) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Categoría no encontrada' }) }
    if (name !== oldName && categoryExists(categories, name)) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Esta categoría ya existe' }) }
    categories[index] = name
    await client.query('UPDATE app_settings SET categories=$1 WHERE id=true', [JSON.stringify(categories)])
    await client.query('UPDATE products SET category=$1 WHERE category=$2', [name, oldName])
    await client.query('COMMIT')
    res.json(categories)
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}))

app.delete('/api/categories/:name', asyncRoute(async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT categories FROM app_settings WHERE id=true FOR UPDATE')
    const categories = rows[0].categories
    const index = categories.indexOf(req.params.name)
    if (index === -1) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Categoría no encontrada' }) }
    const used = await client.query('SELECT 1 FROM products WHERE category=$1 LIMIT 1', [req.params.name])
    if (used.rowCount) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'La categoría tiene productos. Cámbialos de categoría antes de eliminarla.' }) }
    categories.splice(index, 1)
    await client.query('UPDATE app_settings SET categories=$1 WHERE id=true', [JSON.stringify(categories)])
    await client.query('COMMIT')
    res.json(categories)
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}))
app.post('/api/sales', asyncRoute(async (req, res) => {
  const { productId, quantity } = req.body
  if (!positiveInt(productId) || !positiveInt(quantity)) return res.status(400).json({ error: 'Venta inválida' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query('SELECT * FROM products WHERE id=$1 FOR UPDATE', [productId])
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Producto no encontrado' }) }
    const product = rows[0]
    if (product.stock < Number(quantity)) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Stock insuficiente' }) }
    await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [quantity, productId])
    const sale = await client.query('INSERT INTO sales (product_id, product_name, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5) RETURNING *', [productId, product.name, quantity, product.price, Number(product.price) * Number(quantity)])
    await client.query('COMMIT')
    res.status(201).json(saleJson(sale.rows[0]))
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}))
app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const port = process.env.PORT || 3001
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'
const server = app.listen(port, host, () => console.log(`API escuchando en puerto ${port}`))
process.on('SIGTERM', () => server.close(() => pool.end()))
