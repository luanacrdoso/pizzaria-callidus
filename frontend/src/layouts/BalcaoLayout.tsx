import { NavLink, Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';
 
const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "block", padding: "8px 12px", marginBottom: 4, textDecoration: "none",
  color: isActive ? "#fff" : "#333", background: isActive ? "#ef4444" : "#f5f5f5", borderRadius: 6
});
 
export function BalcaoLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav style={{ width: 200, padding: 16, borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", height: "100vh", boxSizing: "border-box" }}>
        <h2 style={{ fontSize: 16 }}>Balcão</h2>
        <NavLink to="/equipe/balcao/mesas" style={linkStyle}>Mesas</NavLink>
        <NavLink to="/equipe/balcao/reservas" style={linkStyle}>Reservas</NavLink>
        <NavLink to="/equipe/balcao/pedido-presencial" style={linkStyle}>Anotar Pedido</NavLink>
        <NavLink to="/equipe/balcao/retirada" style={linkStyle}>Retirada</NavLink>
        <NavLink to="/equipe/perfil" style={linkStyle}>Meus Dados</NavLink>
        <button onClick={() => { logoutFuncionario(); window.location.href = "/equipe/login"; }} style={{ marginTop: "auto" }}>Sair</button>
      </nav>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
}
