import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Settings from './pages/Settings'
import Sales from './pages/Sales'
import Categories from './pages/Categories'
import { api } from './api'

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [settings, setSettings] = useState({ storeName: 'Barberia Francis', categories: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [nextProducts, nextSales, nextSettings] = await Promise.all([api('/products'), api('/sales'), api('/settings')])
      setProducts(nextProducts)
      setSales(nextSales)
      setSettings(nextSettings)
      setError('')
      setRequiresLogin(false)
    } catch (cause) {
      if (cause.status === 401) setRequiresLogin(true)
      setError(cause.status === 401 && !sessionStorage.getItem('francis-auth') ? '' : cause.message)
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const saveProduct = async (entry, id) => {
    const result = await api(id ? `/products/${id}` : '/products', {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(entry)
    })
    setProducts(current => id ? current.map(p => p.id === id ? result : p) : [...current, result])
  }
  const deleteProduct = async id => {
    await api(`/products/${id}`, { method: 'DELETE' })
    setProducts(current => current.filter(p => p.id !== id))
  }
  const moveStock = async (id, direction, quantity) => {
    const result = await api(`/products/${id}/movements`, { method: 'POST', body: JSON.stringify({ direction, quantity }) })
    setProducts(current => current.map(p => p.id === id ? result : p))
  }
  const saveSettings = async next => {
    const result = await api('/settings', { method: 'PUT', body: JSON.stringify(next) })
    setSettings(result)
  }
  const addCategory = async name => {
    const categories = await api('/categories', { method: 'POST', body: JSON.stringify({ name }) })
    setSettings(current => ({ ...current, categories }))
  }
  const renameCategory = async (oldName, name) => {
    const categories = await api(`/categories/${encodeURIComponent(oldName)}`, { method: 'PUT', body: JSON.stringify({ name }) })
    setSettings(current => ({ ...current, categories }))
    setProducts(current => current.map(product => product.category === oldName ? { ...product, category: name } : product))
  }
  const deleteCategory = async name => {
    const categories = await api(`/categories/${encodeURIComponent(name)}`, { method: 'DELETE' })
    setSettings(current => ({ ...current, categories }))
  }
  const registerSale = async (productId, quantity) => {
    const sale = await api('/sales', { method: 'POST', body: JSON.stringify({ productId, quantity }) })
    setSales(current => [sale, ...current])
    setProducts(current => current.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p))
  }
  const login = async event => {
    event.preventDefault()
    sessionStorage.setItem('francis-auth', btoa(`${loginUser}:${loginPassword}`))
    setLoginPassword('')
    await refresh()
  }
  const logout = () => {
    sessionStorage.removeItem('francis-auth')
    setProducts([]); setSales([]); setRequiresLogin(true)
  }

  if (requiresLogin) return <div className="login-page"><form className="modal login-card" onSubmit={login}>
    <h1>Barbería Francis</h1><p>Inicia sesión para administrar ventas e inventario.</p>
    {error && <p role="alert" className="sale-error">{error}</p>}
    <div className="form-group"><label htmlFor="login-user">Usuario</label><input id="login-user" value={loginUser} onChange={event => setLoginUser(event.target.value)} required autoComplete="username" /></div>
    <div className="form-group"><label htmlFor="login-password">Contraseña</label><input id="login-password" type="password" value={loginPassword} onChange={event => setLoginPassword(event.target.value)} required autoComplete="current-password" /></div>
    <button className="btn btn-primary" type="submit">Entrar</button>
  </form></div>

  return <BrowserRouter>
    <div className="layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />
      <main className={`main-content${collapsed ? ' collapsed' : ''}`}>
        {loading ? <p className="app-status">Cargando datos...</p> : <>
          {sessionStorage.getItem('francis-auth') && <button className="btn btn-ghost btn-sm logout-btn" onClick={logout}>Cerrar sesión</button>}
          {error && <div className="app-error" role="alert">{error} <button className="btn btn-ghost btn-sm" onClick={refresh}>Reintentar</button></div>}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard products={products} sales={sales} />} />
            <Route path="/inventory" element={<Inventory products={products} onSave={saveProduct} onDelete={deleteProduct} onMove={moveStock} categories={settings.categories} />} />
            <Route path="/sales" element={<Sales products={products} sales={sales} onRegister={registerSale} />} />
            <Route path="/categories" element={<Categories categories={settings.categories} products={products} onAdd={addCategory} onRename={renameCategory} onDelete={deleteCategory} />} />
            <Route path="/settings" element={<Settings settings={settings} onSave={saveSettings} />} />
          </Routes>
        </>}
      </main>
    </div>
  </BrowserRouter>
}
