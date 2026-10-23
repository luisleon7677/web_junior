import { readFile } from 'node:fs/promises'
import { pool } from './db.js'

try {
  await pool.query((await readFile(new URL('../schema.sql', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''))
  console.log('Tablas listas')
} finally {
  await pool.end()
}
