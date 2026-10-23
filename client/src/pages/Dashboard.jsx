import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MdInventory2, MdPointOfSale, MdShoppingCart, MdTrendingUp } from 'react-icons/md'
import { money } from '../currency'

const dayKey = date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

function recentDays(sales) {
  const totals = new Map()
  sales.forEach(sale => {
    const date = new Date(sale.date)
    if (!Number.isNaN(date.getTime())) {
      const key = dayKey(date)
      totals.set(key, (totals.get(key) || 0) + sale.total)
    }
  })
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - 6 + index)
    return { day: date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }), total: totals.get(dayKey(date)) || 0 }
  })
}

export default function Dashboard({ products, sales }) {
  const today = dayKey(new Date())
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
  const todaySales = sales.filter(sale => dayKey(new Date(sale.date)) === today).reduce((sum, sale) => sum + sale.total, 0)
  const unitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const byProduct = Object.values(sales.reduce((result, sale) => {
    const key = sale.productId ?? sale.productName
    if (!result[key]) result[key] = { name: sale.productName, quantity: 0, total: 0 }
    result[key].quantity += sale.quantity
    result[key].total += sale.total
    return result
  }, {})).sort((a, b) => b.total - a.total).slice(0, 5)
  const chartData = recentDays(sales)

  return <div>
    <div className="page-header">
      <h1>Dashboard</h1>
      <p>Resumen de ventas e inventario de Barbería Francis</p>
    </div>
    <div className="kpi-grid">
      <div className="kpi-card"><div className="kpi-icon gold"><MdTrendingUp /></div><div className="kpi-info"><div className="kpi-value">{money(totalSales)}</div><div className="kpi-label">Ingresos totales</div></div></div>
      <div className="kpi-card"><div className="kpi-icon green"><MdPointOfSale /></div><div className="kpi-info"><div className="kpi-value">{money(todaySales)}</div><div className="kpi-label">Ventas de hoy</div></div></div>
      <div className="kpi-card"><div className="kpi-icon blue"><MdShoppingCart /></div><div className="kpi-info"><div className="kpi-value">{sales.length}</div><div className="kpi-label">Ventas registradas</div></div></div>
      <div className="kpi-card"><div className="kpi-icon gold"><MdShoppingCart /></div><div className="kpi-info"><div className="kpi-value">{unitsSold}</div><div className="kpi-label">Unidades vendidas</div></div></div>
    </div>
    <div className="chart-card sales-chart">
      <div className="chart-title">Ventas de los últimos 7 días</div>
      <div className="chart-sub">Ingresos diarios en S/</div>
      <ResponsiveContainer width="100%" height={270}>
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#8b90a7', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8b90a7', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={money} width={85} />
          <Tooltip formatter={value => [money(value), 'Ventas']} contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, color: '#f0f2f5' }} cursor={{ fill: 'rgba(201,168,76,0.08)' }} />
          <Bar dataKey="total" fill="#c9a84c" radius={[5, 5, 0, 0]} maxBarSize={52} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="dashboard-detail-grid">
      <div className="chart-card">
        <div className="chart-title">Productos más vendidos</div>
        <div className="chart-sub">Ordenados por ingresos</div>
        {byProduct.length ? <div className="dashboard-list">{byProduct.map(item => <div className="dashboard-list-row" key={item.name}><div><strong>{item.name}</strong><span>{item.quantity} unidades</span></div><strong>{money(item.total)}</strong></div>)}</div> : <p className="dashboard-empty">Aún no hay ventas registradas.</p>}
      </div>
      <div className="chart-card">
        <div className="chart-title">Ventas recientes</div>
        <div className="chart-sub">Últimos registros</div>
        {sales.length ? <div className="dashboard-list">{sales.slice(0, 5).map(sale => <div className="dashboard-list-row" key={sale.id}><div><strong>{sale.productName}</strong><span>{new Date(sale.date).toLocaleString('es-PE')} · {sale.quantity} uds.</span></div><strong>{money(sale.total)}</strong></div>)}</div> : <p className="dashboard-empty">Aún no hay ventas registradas.</p>}
      </div>
    </div>
    <div className="dashboard-inventory-summary">
      <div className="kpi-card"><div className="kpi-icon blue"><MdInventory2 /></div><div className="kpi-info"><div className="kpi-value">{totalStock}</div><div className="kpi-label">Unidades en inventario</div></div></div>
      <div className="kpi-card"><div className="kpi-icon gold"><MdInventory2 /></div><div className="kpi-info"><div className="kpi-value">{products.length}</div><div className="kpi-label">Productos en catálogo</div></div></div>
    </div>
  </div>
}
