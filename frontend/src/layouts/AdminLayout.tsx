import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';

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
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

return (
  <div style={{ display: 'flex', height: '100vh' }}>
    <nav style={{
      width: 200,
      padding: 16,
      borderRight: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ fontSize: 16 }}>Painel Admin</h2>
      <NavLink to="/admin/config" style={linkStyle}>Aparência</NavLink>
      <NavLink to="/admin/cardapio" style={linkStyle}>Cardápio</NavLink>
      <NavLink to="/admin/mesas" style={linkStyle}>Mesas</NavLink>
      <NavLink to="/admin/salao" style={linkStyle}>Salão de Eventos</NavLink>
      <NavLink to="/admin/funcionarios" style={linkStyle}>Funcionários</NavLink>
      <button onClick={handleLogout} style={{ marginTop: 'auto' }}>Sair</button>
      <NavLink to="/admin/perfil" style={linkStyle}>Meus Dados</NavLink>
    </nav>
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Outlet />
    </div>
  </div>
)};