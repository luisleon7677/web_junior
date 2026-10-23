import { useState } from 'react'
import { MdAdd, MdDelete, MdEdit, MdInventory2 } from 'react-icons/md'

export default function Categories({ categories, products, onAdd, onRename, onDelete }) {
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event, oldName = null) => {
    event.preventDefault()
    const value = (oldName ? editName : name).trim()
    if (!value) return setError('Escribe el nombre de la categoría.')
    if (categories.some(item => item !== oldName && item.toLocaleLowerCase('es-PE') === value.toLocaleLowerCase('es-PE'))) {
      return setError('Esta categoría ya existe.')
    }
    setSaving(true); setError('')
    try {
      if (oldName) { await onRename(oldName, value); setEditing(null) }
      else { await onAdd(value); setName('') }
    } catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  const remove = async category => {
    if (!window.confirm(`¿Eliminar la categoría «${category}»?`)) return
    setSaving(true); setError('')
    try { await onDelete(category) }
    catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  return <div>
    <div className="page-header"><h1>Categorías</h1><p>Agrega, edita y elimina categorías de productos.</p></div>
    <div className="settings-grid">
      <div className="settings-card">
        <h3><MdInventory2 style={{ verticalAlign: 'middle', marginRight: 8 }} />Categorías de productos</h3>
        {categories.length ? <div className="category-list">{categories.map(category => {
          const count = products.filter(product => product.category === category).length
          return <div className="category-row" key={category}>
            {editing === category ? <form className="category-edit" onSubmit={event => submit(event, category)}>
              <input aria-label={`Editar ${category}`} value={editName} onChange={event => setEditName(event.target.value)} maxLength={100} required autoFocus />
              <button className="btn btn-sm btn-primary" disabled={saving}>Guardar</button>
              <button className="btn btn-sm btn-ghost" type="button" onClick={() => { setEditing(null); setError('') }}>Cancelar</button>
            </form> : <>
              <div><strong>{category}</strong><span className="settings-desc">{count} {count === 1 ? 'producto' : 'productos'}</span></div>
              <div className="action-btns">
                <button className="btn btn-sm btn-ghost" title={`Editar ${category}`} aria-label={`Editar ${category}`} disabled={saving} onClick={() => { setEditing(category); setEditName(category); setError('') }}><MdEdit /></button>
                <button className="btn btn-sm btn-ghost" title={`Eliminar ${category}`} aria-label={`Eliminar ${category}`} disabled={saving || count > 0} onClick={() => remove(category)}><MdDelete /></button>
              </div>
            </>}
          </div>
        })}</div> : <p className="settings-desc">Aún no hay categorías.</p>}
        {products.some(product => categories.includes(product.category)) && <p className="settings-desc">Para eliminar una categoría, primero cambia de categoría sus productos.</p>}
      </div>
      <form className="settings-card" onSubmit={submit}>
        <h3>Agregar categoría</h3>
        <div className="form-group"><label htmlFor="new-category">Nombre</label><input id="new-category" value={name} onChange={event => { setName(event.target.value); setError('') }} placeholder="Ej: Productos para cabello" maxLength={100} required /></div>
        {error && <p role="alert" className="sale-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}><MdAdd /> {saving ? 'Guardando...' : 'Agregar categoría'}</button>
      </form>
    </div>
  </div>
}
