import { NavLink } from 'react-router-dom'
import {
  MdDashboard, MdInventory2, MdSettings,
  MdContentCut, MdChevronLeft, MdChevronRight, MdPointOfSale, MdCategory
} from 'react-icons/md'

const navItems = [
  { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { to: '/inventory', icon: <MdInventory2 />, label: 'Inventario' },
  { to: '/categories', icon: <MdCategory />, label: 'Categorías' },
  { to: '/sales', icon: <MdPointOfSale />, label: 'Ventas' },
  { to: '/settings', icon: <MdSettings />, label: 'Configuración' },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <MdContentCut />
        </div>
        <div className={`sidebar-brand${collapsed ? ' desktop-hidden' : ''}`}>
            <h2>Barbería</h2>
            <span>Francis</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="icon">{item.icon}</span>
            <span className={`label${collapsed ? ' desktop-hidden' : ''}`}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={onToggle} title={collapsed ? 'Expandir' : 'Colapsar'}>
          <span className="icon" style={{ fontSize: 20 }}>
            {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
          </span>
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  )
}
