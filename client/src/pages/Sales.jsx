import { useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { money } from '../currency'

export default function Sales({ products, sales, onRegister }) {
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selected = products.find(p => p.id === Number(productId))
  const available = products.filter(p => p.stock > 0)

  const close = () => { setOpen(false); setError(''); setProductId(''); setQuantity('1') }
  const submit = async event => {
    event.preventDefault()
    const qty = Number(quantity)
    if (!selected || !Number.isInteger(qty) || qty < 1 || qty > selected.stock) {
      setError('Selecciona un producto y una cantidad válida dentro del stock disponible.')
      return
    }
    setSaving(true)
    try { await onRegister(selected.id, qty); close() }
    catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Ventas</h1>
        <p>Registra ventas de productos y descuenta automáticamente el inventario.</p>
      </div>
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Historial de ventas</span>
          <button className="btn btn-primary" onClick={() => setOpen(true)} disabled={!available.length}><MdAdd /> Registrar venta</button>
        </div>
        {sales.length === 0 ? (
          <div className="empty"><div className="empty-icon">🧾</div><p>Aún no hay ventas registradas.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}><table>
            <thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Total</th></tr></thead>
            <tbody>{sales.map(sale => <tr key={sale.id}>
              <td>{new Date(sale.date).toLocaleString('es-PE')}</td>
              <td>{sale.productName}</td><td>{sale.quantity}</td>
              <td>{money(sale.unitPrice)}</td><td style={{ fontWeight: 600 }}>{money(sale.total)}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </div>
      {open && <div className="modal-overlay" onClick={close}>
        <form className="modal" onClick={event => event.stopPropagation()} onSubmit={submit}>
          <h2>Registrar venta</h2>
          <div className="form-group"><label htmlFor="sale-product">Producto</label>
            <select id="sale-product" value={productId} onChange={event => { setProductId(event.target.value); setError('') }} required>
              <option value="">Seleccionar producto</option>
              {available.map(product => <option key={product.id} value={product.id}>{product.name} — {product.stock} disponibles</option>)}
            </select>
          </div>
          <div className="form-group"><label htmlFor="sale-quantity">Cantidad</label>
            <input id="sale-quantity" type="number" min="1" max={selected?.stock || undefined} step="1" value={quantity} onChange={event => { setQuantity(event.target.value); setError('') }} required />
          </div>
          {selected && <p className="sale-summary">Precio unitario: {money(selected.price)} · Total: {money(selected.price * (Number(quantity) || 0))}</p>}
          {error && <p role="alert" className="sale-error">{error}</p>}
          <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={close}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>Guardar venta</button></div>
        </form>
      </div>}
    </div>
  )
}
