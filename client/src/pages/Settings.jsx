import { useState } from 'react'
import { MdSave, MdStore, MdPalette } from 'react-icons/md'

export default function Settings({ settings, onSave }) {
  const [storeName, setStoreName] = useState(settings.storeName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async event => {
    event.preventDefault()
    setSaving(true); setError('')
    try {
      await onSave({ storeName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  return <div>
    <div className="page-header"><h1>Configuración</h1><p>Ajustes generales del sistema de inventario</p></div>
    <form className="settings-grid" onSubmit={handleSave}>
      <div className="settings-card">
        <h3><MdStore style={{ verticalAlign: 'middle', marginRight: 8 }} />Información de la tienda</h3>
        <div className="settings-row">
          <div><div className="settings-label">Nombre del negocio</div><div className="settings-desc">Se muestra en el encabezado y reportes</div></div>
          <input id="setting-store-name" value={storeName} onChange={event => setStoreName(event.target.value)} required />
        </div>
      </div>
      <div className="settings-card">
        <h3><MdPalette style={{ verticalAlign: 'middle', marginRight: 8 }} />Apariencia</h3>
        <div className="settings-row">
          <div><div className="settings-label">Modo oscuro</div><div className="settings-desc">Tema oscuro activo (predeterminado)</div></div>
          <label className="toggle"><input type="checkbox" checked readOnly /><span className="slider" /></label>
        </div>
      </div>
      {error && <p role="alert" className="sale-error">{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
        <button className="btn btn-primary" type="submit" disabled={saving} id="btn-save-settings"><MdSave />{saved ? '¡Guardado!' : 'Guardar cambios'}</button>
      </div>
    </form>
  </div>
}
