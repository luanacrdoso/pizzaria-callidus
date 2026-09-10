import { NavLink, Outlet } from 'react-router-dom';
import { logoutFuncionario } from '../api/funcionarioAuth';
 
const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "block", padding: "8px 12px", marginBottom: 4, textDecoration: "none",
  color: isActive ? "#fff" : "#333", background: isActive ? "#ef4444" : "#f5f5f5", borderRadius: 6
});
 
export function GarcomLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav style={{ width: 200, padding: 16, borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", height: "100vh", boxSizing: "border-box" }}>
        <h2 style={{ fontSize: 16 }}>Garçom</h2>
        <NavLink to="/equipe/garcom/comandas" style={linkStyle}>Comandas</NavLink>
        <NavLink to="/equipe/garcom/servir" style={linkStyle}>Servir Pedidos</NavLink>
        <NavLink to="/equipe/garcom/dashboard" style={linkStyle}>Meus Ganhos</NavLink>
        <NavLink to="/equipe/perfil" style={linkStyle}>Meus Dados</NavLink>
        <button onClick={() => { logoutFuncionario(); window.location.href = "/equipe/login"; }} style={{ marginTop: "auto" }}>Sair</button>
      </nav>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
}
