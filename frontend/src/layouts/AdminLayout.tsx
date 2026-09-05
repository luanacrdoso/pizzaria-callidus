import { NavLink, Outlet } from 'react-router-dom';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: 'block',
  padding: '8px 12px',
  marginBottom: 4,
  textDecoration: 'none',
  color: isActive ? '#fff' : '#333',
  background: isActive ? '#ef4444' : '#f5f5f5',
  borderRadius: 6
});

export function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 200, padding: 16, borderRight: '1px solid #ddd' }}>
        <h2 style={{ fontSize: 16 }}>Painel Admin</h2>
        <NavLink to="/admin/config" style={linkStyle}>Aparência</NavLink>
        <NavLink to="/admin/cardapio" style={linkStyle}>Cardápio</NavLink>
        <NavLink to="/admin/mesas" style={linkStyle}>Mesas</NavLink>
        <NavLink to="/admin/salao" style={linkStyle}>Salão de Eventos</NavLink>
      </nav>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}