import { useState } from 'react'
import { MdSearch, MdAdd, MdArrowUpward, MdArrowDownward, MdEdit, MdDelete } from 'react-icons/md'
import { money } from '../currency'

function stockBadge(stock, min) {
  if (stock === 0) return <span className="badge low">Sin stock</span>
  if (stock <= min) return <span className="badge low">Bajo</span>
  if (stock <= min * 2) return <span className="badge med">Medio</span>
  return <span className="badge ok">OK</span>
}

const emptyForm = category => ({ name: '', category: category || '', stock: '', price: '', minStock: '' })

export default function Inventory({ products, onSave, onDelete, onMove, categories }) {
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'move'
  const [form, setForm] = useState(() => emptyForm(categories[0]))
  const [editId, setEditId] = useState(null)
  const [moveQty, setMoveQty] = useState('')
  const [moveType, setMoveType] = useState('in')
  const [moveTarget, setMoveTarget] = useState(null)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(emptyForm(categories[0])); setEditId(null); setModal('add') }
  const openEdit = (p) => {
    setForm({ name: p.name, category: p.category, stock: p.stock, price: p.price, minStock: p.minStock })
    setEditId(p.id); setModal('edit')
  }
  const openMove = (p, type) => { setMoveTarget(p); setMoveType(type); setMoveQty(''); setModal('move') }
  const closeModal = () => { setModal(null); setError('') }

  const handleFormChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    const entry = {
      name: form.name.trim(), category: form.category,
      stock: Number(form.stock), price: Number(form.price), minStock: Number(form.minStock)
    }
    if (!entry.name || !Number.isInteger(entry.stock) || entry.stock < 0 || !Number.isFinite(entry.price) || entry.price < 0 || !Number.isInteger(entry.minStock) || entry.minStock < 0) {
      setError('Completa los datos del producto correctamente.')
      return
    }
    setSaving(true); setError('')
    try { await onSave(entry, modal === 'edit' ? editId : null); closeModal() }
    catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar este producto?')) return
    try { await onDelete(id); setError('') }
    catch (cause) { setError(cause.message) }
  }

  const handleMove = async () => {
    const qty = Number(moveQty)
    if (!Number.isInteger(qty) || qty <= 0 || (moveType === 'out' && qty > moveTarget.stock)) {
      setError('La cantidad debe ser valida y no superar el stock disponible.')
      return
    }
    setSaving(true); setError('')
    try { await onMove(moveTarget.id, moveType, qty); closeModal() }
    catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Inventario</h1>
        <p>Gestión de productos — agregar, editar y registrar movimientos</p>
      </div>

      {error && !modal && <p role="alert" className="sale-error">{error}</p>}
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">
            Productos <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 400 }}>({filtered.length})</span>
          </span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="search-bar">
              <MdSearch style={{ color: 'var(--text-secondary)', fontSize: 18 }} />
              <input
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="inventory-search"
              />
            </div>
            <button className="btn btn-primary" onClick={openAdd} id="btn-add-product">
              <MdAdd /> Agregar
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="cat-tag">{p.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.stock} uds.</td>
                    <td>{money(p.price)}</td>
                    <td>{stockBadge(p.stock, p.minStock)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-success" onClick={() => openMove(p, 'in')} title="Entrada">
                          <MdArrowUpward />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => openMove(p, 'out')} title="Salida">
                          <MdArrowDownward />
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => openEdit(p)} title="Editar">
                          <MdEdit />
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(p.id)} title="Eliminar"
                          style={{ color: 'var(--red)', borderColor: 'rgba(224,108,108,0.3)' }}>
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modal === 'add' ? 'Agregar Producto' : 'Editar Producto'}</h2>
            <div className="form-group">
              <label>Nombre</label>
              <input name="name" value={form.name} onChange={handleFormChange} placeholder="Ej: Shampoo Revlon" />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select name="category" value={form.category} onChange={handleFormChange}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Stock inicial</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleFormChange} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Stock mínimo</label>
                <input name="minStock" type="number" min="0" value={form.minStock} onChange={handleFormChange} placeholder="5" />
              </div>
            </div>
            <div className="form-group">
              <label>Precio (S/)</label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleFormChange} placeholder="0.00" />
            </div>
            {error && <p role="alert" className="sale-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {modal === 'move' && moveTarget && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{moveType === 'in' ? '📥 Entrada de Stock' : '📤 Salida de Stock'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              {moveTarget.name} — Stock actual: <strong style={{ color: 'var(--text-primary)' }}>{moveTarget.stock} uds.</strong>
            </p>
            <div className="form-group">
              <label>Cantidad a {moveType === 'in' ? 'agregar' : 'retirar'}</label>
              <input
                type="number" min="1" value={moveQty}
                onChange={e => setMoveQty(e.target.value)}
                placeholder="Ej: 10"
                autoFocus
              />
            </div>
            {error && <p role="alert" className="sale-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
              <button
                className={`btn ${moveType === 'in' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleMove}
                disabled={saving}
              >
                {moveType === 'in' ? 'Registrar Entrada' : 'Registrar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
